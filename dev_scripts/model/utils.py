from langchain_core.documents import Document
def jsonl_to_document(jsonl_string):
    json_list = jsonl_string.split("\n")
    return [Document(json) for json in json_list]
        