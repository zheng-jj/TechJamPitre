import os
import json
from langchain_core.documents import Document
from parser.LawParser import LawParser
from model.RAGLawModel import RAGLawModel
from dotenv import load_dotenv
from time import sleep

load_dotenv()

def parse_to_string(json_string):
    data = json.loads(json_string)
    metadata = {
        "provision_code": data["provision_code"], 
        "country": data["country"], 
        "region": data["region"], 
        "labels": data["relevant_labels"], 
        "law_code": data["law_code"], 
        "reference_file": data["reference_file"]
    }
    return Document(page_content=json_string, metadata=metadata)

def main():
    
    f = open("laws.jsonl", "r")
    lines = f.readlines()
    f.close()

    docs = []
    model = RAGLawModel()
    for i in range(125, len(lines)):
        print(f"line {i}")
        doc = parse_to_string(lines[i])
        docs.append(doc)
        model.update_vector_store(docs)
        sleep(10)

if __name__ == "__main__":
    main()