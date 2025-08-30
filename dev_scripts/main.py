from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import requests
from dotenv import load_dotenv

from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel
from model.FeatureRagModel import FeatureRagModel
from model.utils import law_to_document, feature_to_document

load_dotenv(dotenv_path=".ENV")

app = FastAPI()

GO_BACKEND_URL = os.getenv("GO_BACKEND_URL") 

rag_law_model = RAGLawModel()
rag_feature_model = FeatureRagModel()

def load_jsonl(jsonl_string):
    """Load a JSONL file into a list of dicts."""
    return [json.loads(line) for line in jsonl_string.split("\n") if line.strip()]

@app.get("/")
def root():
    print("hello")
    return {"message": "Welcome to the python services!"}

@app.post("/upload/law")
async def upload_law(file: UploadFile = File(...)):
    try:
        #!!!!!!!!! store parsed_law into nosql
        temp_path = os.path.join("./temp", os.path.basename(file.filename))
        contents = await file.read()
        os.makedirs("./temp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(contents)
        parsed_law = LawParser.parse(temp_path)
        documents = law_to_document(parsed_law)
        rag_law_model.update_vector_store(documents) # might error out  due to api limits from free tier
        laws = load_jsonl(parsed_law)
        
        # # Save all laws in one go to mongodb
        # resp = requests.post(f"{GO_BACKEND_URL}/provision", json=law)
        # if resp.status_code != 201:
        #     print("Failed to save laws:", resp.text)
        law_prompt = ""
        raw_docs = []
        for i, law in enumerate(laws):
            law_prompt = f'{law_prompt}\n{i}. [{law["provision_code"]}/{law["law_code"]}] {law["provision_title"]} - {law["provision_body"]}'
            doc_query_prompt = f'{law["provision_title"]} - {law["provision_body"]}'
            raw_docs.extend(rag_feature_model.retrieve_docs(doc_query_prompt))
        docs = []
        for doc in raw_docs:
            if doc not in docs:
                docs.append(doc)  # deduplicate with set
        result = ""
        if len(docs) > 0:
            result = rag_feature_model.prompt(law_prompt, docs)

        return JSONResponse(content={'conflict': result, 'parsed_law': parsed_law})
    finally:
        # os.remove(temp_path)
        pass

@app.post("/upload/feature")
async def upload_feature(file: UploadFile = File(...)):
    def build_prompt(items, title_key, desc_key):
        """Build a numbered prompt string from list of dicts."""
        return "\n".join(
            f"{i}. {item[title_key]} - {item[desc_key]}"
            for i, item in enumerate(items)
        )
    try:
        temp_path = os.path.join("./temp", os.path.basename(file.filename))
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

        # Save all features in one go to mongodb
        # resp = requests.post(f"{GO_BACKEND_URL}/feature", json=features)
        # if resp.status_code != 201:
        #     print("Failed to save features:", resp.text)

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
        # <compliance_already_conformed>
        #    {compliance_prompt}
        # </compliance_already_conformed>
        full_prompt = f"""
            <features>
            {features_prompt}
            </features>
            <terminology>
            {terminology_prompt}
            </terminology>
        """
        result = "{}"
        if len(docs) > 0:
            result = rag_law_model.prompt(full_prompt.strip(), docs)

        return JSONResponse(content={'conflict': result, 'parsed_feature': parsed_feature})
    finally:
        # os.remove(temp_path)
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
