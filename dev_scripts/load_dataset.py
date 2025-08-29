import os
import json
from langchain_core.documents import Document
from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel

def parse_to_string(json_string):
    data = json.loads(json_string)
    content = f"{data['provision_title']} - {data['provision_body']}"
    metadata = {"provision_code": data["provision_code"], "country": data["country"], "region": data["region"], "labels": data["relevant_labels"], "law_code": data["law_code"], "reference_file": data["reference_file"]}
    return Document(page_content=content, metadata=metadata)

def main():
    f = open("laws.jsonl", "r")
    lines = f.readlines()
    f.close()

    docs = []
    
    for line in lines:
        doc = parse_to_string(line)
        docs.append(doc)
    model = RAGLawModel()
    model.update_vector_store(docs)
    
if __name__ == "__main__":
    main()