from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import requests
import threading
import time
from dotenv import load_dotenv

from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel
from model.FeatureRagModel import FeatureRagModel
from model.utils import law_to_document, feature_to_document

# Load environment variables
load_dotenv(dotenv_path=".ENV")

app = FastAPI()

GO_BACKEND_URL = os.getenv("GO_BACKEND_URL")
SLEEP_SECONDS = 2
BATCH_SIZE = 2

rag_law_model = RAGLawModel()
rag_feature_model = FeatureRagModel()


def load_jsonl(jsonl_string: str):
    """Load a JSONL string into a list of dicts."""
    try:
        return [json.loads(line) for line in jsonl_string.split("\n") if line.strip()]
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSONL format: {e}")


@app.get("/")
def root():
    return {"message": "Welcome to the python services!"}


@app.post("/upload/law")
async def upload_law(file: UploadFile = File(...)):
    temp_path = os.path.join("./law_dataset", os.path.basename(file.filename))
    try:
        os.makedirs("./law_dataset", exist_ok=True)
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        parsed_law = LawParser.parse(temp_path)
        documents = law_to_document(parsed_law)

        # Run update_vector_store in a daemon thread to avoid blocking
        def update_vector_store_daemon():
            try:
                rag_law_model.update_vector_store(documents)
            except Exception as e:
                print("Warning: Failed to update vector store:", e)

        thread = threading.Thread(target=update_vector_store_daemon)
        thread.daemon = True
        thread.start()

        laws = load_jsonl(parsed_law)

        # Save laws to backend
        try:
            resp = requests.post(f"{GO_BACKEND_URL}/provision", json=laws)
            if resp.status_code != 201:
                print("Failed to save laws:", resp.text)
        except Exception as e:
            print("Error sending laws to backend:", e)

        # Build prompts + retrieve docs
        law_prompt = ""
        raw_docs = []
        for i in range(0, len(laws), BATCH_SIZE):
            batch = laws[i:i + BATCH_SIZE]
            for j, law in enumerate(batch, start=i):
                law_prompt += f'\n{j}. [{law["provision_code"]}/{law["law_code"]}] {law["provision_title"]} - {law["provision_body"]}'
                doc_query_prompt = f'{law["provision_title"]} - {law["provision_body"]}'
                raw_docs.extend(rag_feature_model.retrieve_docs(doc_query_prompt))
            
            time.sleep(SLEEP_SECONDS)
        docs = []
        for doc in raw_docs:
            if doc not in docs:
                docs.append(doc)

        result = ""
        if docs:
            result = rag_feature_model.prompt(law_prompt, docs)

        return JSONResponse(content={'conflict': result, 'parsed_law': parsed_law})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/feature")
async def upload_feature(file: UploadFile = File(...)):
    def build_prompt(items, title_key: str, desc_key: str):
        """Build a numbered prompt string from list of dicts."""
        return "\n".join(f"{i}. {item[title_key]} - {item[desc_key]}" for i, item in enumerate(items))

    temp_path = os.path.join("./feature_dataset", os.path.basename(file.filename))
    try:
        os.makedirs("./feature_dataset", exist_ok=True)
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Parse feature file
        parsed_feature, parsed_compliance, parsed_data_dict = FeatureParser.parse(temp_path)

        # Run update_vector_store in a background daemon thread to avoid blocking
        def update_vector_store_daemon():
            try:
                documents = feature_to_document(parsed_feature, parsed_compliance, parsed_data_dict)
                rag_feature_model.update_vector_store(documents)
            except Exception as e:
                print("Warning: Failed to update feature vector store:", e)

        thread = threading.Thread(target=update_vector_store_daemon)
        thread.daemon = True
        thread.start()

        features = load_jsonl(parsed_feature)
        compliance = load_jsonl(parsed_compliance)
        data_dict = load_jsonl(parsed_data_dict)

        # Save to backend
        try:
            resp = requests.post(f"{GO_BACKEND_URL}/feature", json=features)
            if resp.status_code != 201:
                print("Failed to save features:", resp.text)
        except Exception as e:
            print("Error sending features to backend:", e)

        # Build prompts
        terminology_prompt = build_prompt(data_dict, "variable_name", "variable_description")
        features_prompt = build_prompt(features, "feature_title", "feature_description")

        raw_docs = []
        for i in range(0, len(features), BATCH_SIZE):
            batch = features[i:i + BATCH_SIZE]
            for feature in batch:
                query_text = f'{feature["feature_title"]} - {feature["feature_description"]}'
                raw_docs.extend(rag_law_model.retrieve_docs(query_text))
            time.sleep(SLEEP_SECONDS)
            

        docs = []
        for doc in raw_docs:
            if doc not in docs:
                docs.append(doc)

        # Final prompt
        full_prompt = f"""
            <features>
            {features_prompt}
            </features>
            <terminology>
            {terminology_prompt}
            </terminology>
        """

        result = "{}"
        if docs:
            result = rag_law_model.prompt(full_prompt.strip(), docs)

        return JSONResponse(content={'conflict': result, 'parsed_feature': parsed_feature})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
