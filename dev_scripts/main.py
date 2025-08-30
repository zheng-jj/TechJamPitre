from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel

load_dotenv(dotenv_path=".ENV")

app = FastAPI()

rag_law_model = RAGLawModel()

@app.get("/")
def root():
    print("hello")
    print(os.getenv("GEMINI_API_KEY"))
    print(os.getenv("GOOGLE_API_KEY"))
    return {"message": "Welcome to the python services!"}

@app.post("/parse/law")
async def parse_law(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    temp_path = f"./temp/{file.filename}"
    contents = await file.read()
    os.makedirs("./temp", exist_ok=True)
    with open(temp_path, "wb") as f:
        f.write(contents)
    try:
        parsed_law = LawParser.parse(temp_path)
        # rag_law_model.update_vector_store(parsed_law)
        # answer = rag_law_model.prompt("Sample compliance query")
        return JSONResponse(content={"parsed_law": parsed_law, "model_answer": "answer"})
    finally:
        # os.remove(temp_path)
        pass

@app.post("/parse/feature")
async def parse_feature(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    temp_path = f"./temp/{file.filename}"
    contents = await file.read()
    os.makedirs("./temp", exist_ok=True)
    with open(temp_path, "wb") as f:
        f.write(contents)
    try:
        parsed_feature = FeatureParser.parse(temp_path)
        # TODO: integrate rag feature model here when ready
        return JSONResponse(content={"parsed_feature": parsed_feature})
    finally:
        # os.remove(temp_path)
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
