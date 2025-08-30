import os
import glob
import getpass
import json
import time
from collections import defaultdict
from dotenv import load_dotenv
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai  import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

FEATURES_DIRECTORY = "feature_data/" 
VECTOR_STORE_PATH = "feature_vector_store"  # Save to a separate directory

def main():
    # use dictionary to split projects
    project_files = defaultdict(dict)

    for file_path in glob.glob(os.path.join(FEATURES_DIRECTORY, "*.jsonl")):
        base_name = os.path.basename(file_path).split('.')[0]
        # Get project name part from file name
        project_name_part = base_name.split('-')[1].strip()
        
        if 'feature' in base_name:
            project_files[project_name_part]['features'] = file_path
        elif 'data_dictionary' in base_name:
            project_files[project_name_part]['dictionary'] = file_path
        elif 'compliance' in base_name:
            project_files[project_name_part]['compliance'] = file_path

    print(f"Found data for {len(project_files)} projects.")

    all_docs = []
    for project_name_part, files in project_files.items():
        project_dictionary = []
        if files.get('dictionary'):
            with open(files['dictionary'], 'r', encoding='utf-8') as f:
                for line in f:
                    project_dictionary.append(json.loads(line))

        project_compliance = []
        if files.get('compliance'):
            with open(files['compliance'], 'r', encoding='utf-8') as f:
                for line in f:
                    project_compliance.append(json.loads(line))
        
        # Format the context once per project
        dict_context = "\n".join([f"- {item.get('variable_name', '')}: {item.get('variable_description', '')}" for item in project_dictionary])
        comp_context = "\n".join([f"- {item.get('compliance_title', '')}: {item.get('compliance_description', '')}" for item in project_compliance])

        # Iterate through the features file for this project
        if files.get('features'):
            with open(files['features'], 'r', encoding='utf-8') as f:
                for line in f:
                    feature = json.loads(line)
                    
                    content = (
                        f"**Project:** {feature.get('project_name', 'N/A')}\n\n"
                        f"**Feature Title:** {feature.get('feature_title', 'N/A')}\n"
                        f"**Feature Type:** {feature.get('feature_type', 'N/A')}\n"
                        f"**Description:**\n{feature.get('feature_description', '')}\n\n"
                        f"--- Project Data Dictionary ---\n{dict_context}\n\n"
                        f"--- Project Compliance Rules ---\n{comp_context}"
                    )
                    
                    metadata = {
                        "project_name": feature.get('project_name'),
                        "project_id": feature.get('project_id'),
                        "feature_id": feature.get('feature_id'),
                        "feature_title": feature.get('feature_title'),
                        "source_file": feature.get('reference_file')
                    }
                    all_docs.append(Document(page_content=content, metadata=metadata))

    if not all_docs:
        print("No documents were created. Please check file paths and content.")
        return
        

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    vector_store = None
    BATCH_SIZE = 1
    DELAY_BETWEEN_BATCHES = 5 # 5 seconds

    for i in range(0, len(all_docs), BATCH_SIZE):
        batch = all_docs[i:i + BATCH_SIZE]
        if vector_store is None:
            vector_store = FAISS.from_documents(batch, embeddings)
        else:
            vector_store.add_documents(batch)
        
        print(f"  - Processed batch {i // BATCH_SIZE + 1}. Waiting for {DELAY_BETWEEN_BATCHES} seconds...")
        import time
        time.sleep(DELAY_BETWEEN_BATCHES)

    vector_store.save_local(VECTOR_STORE_PATH)
    print("Ingestion complete")

if __name__ == "__main__":
    main()
