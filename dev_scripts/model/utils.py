from langchain_core.documents import Document
import json
def jsonl_to_document(jsonl_string):
    json_list = jsonl_string.split("\n")
    return [Document(j, metadata={"id": json.loads(j)["id"]}) for j in json_list if j]