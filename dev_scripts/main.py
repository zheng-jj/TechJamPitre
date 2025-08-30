from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import json
from dotenv import load_dotenv

from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel
from model.FeatureRagModel import FeatureRagModel
from model.utils import law_to_document, feature_to_document

load_dotenv(dotenv_path=".ENV")

app = FastAPI()

rag_law_model = RAGLawModel()
rag_feature_model = FeatureRagModel()
def load_jsonl(jsonl_string):
    """Load a JSONL file into a list of dicts."""
    return [json.loads(line) for line in jsonl_string.split("\n") if line.strip()]

@app.get("/")
def root():
    print("hello")
    print(os.getenv("GEMINI_API_KEY"))
    print(os.getenv("GOOGLE_API_KEY"))
    return {"message": "Welcome to the python services!"}

@app.post("/upload/law")
async def parse_law(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    try:
        #!!!!!!!!! store parsed_law into nosql
        temp_path = f"./temp/{file.filename}"
        contents = await file.read()
        os.makedirs("./temp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(contents)
        parsed_law = LawParser.parse(temp_path)
        documents = law_to_document(parsed_law)
        rag_law_model.update_vector_store(documents) # might error out due to api limits from free tier
        law = load_jsonl(parsed_law)
        law_prompt = "<law>".join(
            f'{i}. [{l["provision_code"]/l["law_code"]}] {l["provision_title"]} - {l["provision_body"]}'
            for i, l in enumerate(law)
        ) + "</law>"
        result = rag_feature_model.prompt(law_prompt)
        return JSONResponse(content=result)
    finally:
        # os.remove(temp_path)
        pass

@app.post("/upload/feature")
async def parse_feature(file: UploadFile = File(...)):
    def build_prompt(items, title_key, desc_key):
        """Build a numbered prompt string from list of dicts."""
        return "\n".join(
            f"{i}. {item[title_key]} - {item[desc_key]}"
            for i, item in enumerate(items)
        )
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    try:
        temp_path = f"./temp/{file.filename}"
        contents = await file.read()
        os.makedirs("./temp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(contents)
        # path should be in database store**
        parsed_feature, parsed_compliance, parsed_data_dict = FeatureParser.parse(temp_path)
        #!!!!!!!! store parsed_feature, parsed_compliance, parsed_data_dict to nosql
        documents = feature_to_document(parsed_feature, parsed_compliance, parsed_data_dict)
        rag_feature_model.update_vector_store(documents)
        
        features = load_jsonl(parsed_feature)
        compliance = load_jsonl(parsed_compliance)
        data_dict = load_jsonl(parsed_data_dict)

        # Build prompts
        terminology_prompt = build_prompt(data_dict, "variable_name", "variable_description")
        compliance_prompt = build_prompt(compliance, "compliance_title", "compliance_description")
        features_prompt = build_prompt(features, "feature_title", "feature_description")

        # Retrieve docs (deduplicate)
        raw_docs = []
        for feature in features:
            query_text = f'{feature["feature_title"]} - {feature["feature_description"]}'
            raw_docs.extend(rag_law_model.retrieve_docs(query_text))

        docs = []
        for doc in raw_docs:
            if doc not in docs:
                docs.append(doc)  # deduplicate with set

        # Final model prompt
        full_prompt = f"""
            <features>
            {features_prompt}
            </features>
            <terminology>
            {terminology_prompt}
            </terminology>
            <compliance_already_conformed>
            {compliance_prompt}
            </compliance_already_conformed>
        """

        result = rag_law_model.prompt(full_prompt.strip(), docs)
        return JSONResponse(content=result)
    finally:
        # os.remove(temp_path)
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
