from langchain_core.documents import Document
import json

def law_to_document(jsonl_string):
    json_list = jsonl_string.strip().split("\n")
    return [Document(j, metadata={"id": json.loads(j)["id"]}) for j in json_list]

def feature_to_document(features, compliances, data_dictionary):
    all_docs = []
    project_dictionary = []
    for line in data_dictionary.strip().split("\n"):
        project_dictionary.append(json.loads(line))

    project_compliance = []
    for line in compliances.strip().split("\n"):
        project_compliance.append(json.loads(line))
    
    # Format the context once per project
    dict_context = "\n".join([f"- {item.get('variable_name', '')}: {item.get('variable_description', '')}" for item in project_dictionary])
    comp_context = "\n".join([f"- {item.get('compliance_title', '')}: {item.get('compliance_description', '')}" for item in project_compliance])

    # Iterate through the features file for this project
    for line in features.strip().split("\n"):
        feature = json.loads(line)
        
        content = (
            f"Project: {feature.get('project_name', 'N/A')}\n\n"
            f"Project ID: {feature.get('project_id', 'N/A')}\n\n"
            f"Feature Title: {feature.get('feature_title', 'N/A')}\n"
            f"Feature Type: {feature.get('feature_type', 'N/A')}\n"
            f"Feature ID: {feature.get('feature_id', 'N/A')}\n"
            f"Feature Description:\n{feature.get('feature_description', '')}\n\n"
            f"--- Project Data Dictionary ---\n{dict_context}\n\n"
            f"--- Project Compliance Rules ---\n{comp_context}\n"
            f"Source File: {feature.get('reference_file', 'N/A')}"
        )

        metadata = {
            "project_name": feature.get('project_name'),
            "project_id": feature.get('project_id'),
            "feature_id": feature.get('feature_id'),
            "feature_title": feature.get('feature_title'),
            "source_file": feature.get('reference_file')
        }
        all_docs.append(Document(page_content=content, metadata=metadata))
    return all_docs
