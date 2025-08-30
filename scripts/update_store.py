from collections import defaultdict
import os
import json
import glob
from dotenv import load_dotenv
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai  import GoogleGenerativeAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chat_models import init_chat_model
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.chains.combine_documents import create_stuff_documents_chain

VECTOR_LAW_STORE_PATH = "law_vector_store"
LAW_DATABASE_FILE = "law_data/laws.jsonl" # main law database
NEW_LAW_FILE = "new_law.json" # new law file

VECTOR_FEATURE_STORE_PATH = "feature_vector_store"
FEATURE_DATABASE_FILE = "feature_data/" # main feature database
NEW_FEATURE_FILE = "new_feature.json" # new feature file
NEW_COMPLIANCE_FILE = "new_compliance.json" # new compliance file
NEW_DATA_DICTIONARY_FILE = "new_data_dictionary.json" # new data dictionary file

LAW_SCHEMA = {
  "title": "Answer",
  "type": "object",
  "properties": {
    "violated_old_law_provisions": {
      "type": "array",
      "description": "A list of provisions from new, proposed, or recently enacted laws that the feature might violate.",
      "items": {
        "type": "object",
        "properties": {
           "id": {
               "type": "string",
               "description": "unique identifier for the law"
           },
           "provision_title": {
            "type": "string",
            "description": "The official title of the violated provision from the new law."
          },
          "provision_body": {
            "type": "string",
            "description": "The full text of the violated provision from the new law."
          },
          "provision_code": {
            "type": "string",
            "description": "The specific code or article number of the provision."
          },
          "law_code": {
            "type": "string",
            "description": "The official code or name of the parent new law."
          },
          "country": {
            "type": "string",
            "description": "The country of the new law's jurisdiction."
          },
          "region": {
            "type": "string",
            "description": "The region of the new law's jurisdiction."
          },
          "reference_file": {
            "type": "string",
            "description": "The source file where this new law is defined."
          },
          "reasoning": {
            "type": "string",
            "description": "A detailed explanation of how the feature specifically violates this provision of the new law."
          }
        },
        "required": [
            "id",
          "provision_title",
          "provision_body",
          "provision_code",
          "law_code",
          "country",
          "region",
          "reference_file",
          "reasoning"
        ]
      }
    }
  },
  "required": [
    "violated_old_law_provisions"
  ]
}

class update_store:
    def __init__(self, args):
        load_dotenv()
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

        if (args == "update_law"):
            self.update_law()
        elif (args == "add_feature"):
            self.add_feature()
        else:
            print("Invalid argument. Please use 'update_law' or 'add_feature'.")

    def update_law(self):
        self.vector_store = FAISS.load_local(VECTOR_LAW_STORE_PATH, self.embeddings, allow_dangerous_deserialization=True)
        self.llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai", response_mime_type="application/json")
        
        self.llm.response_schema = LAW_SCHEMA
        self.prompt_template = """
        Flag out 1 MOST SIMILAR LAW with SIMILAR LAW CODE, LAW TITLE, with either NO or ONLY SLIGHT CHANGES TO ITS DESCRIPTION. RESPONED WITH {{NONE}} IF THERE ARE NO IDENTICAL LAW CODE, ELSE OUTPUT OLD LAW AND NEW LAW.
    
        You MUST ONLY respond with a JSON object that conforms to the 'Answer' schema.
        Your response should start with a '{{' and end with a '}}'. Do not include any other text, explanations, or markdown formatting.

        If you find relevant provisions in the context, extract them according to the schema.
        If the context is empty or you cannot find any relevant provisions, you MUST return a JSON object with an empty list for the "provisions" key.

        Context:
        {context}

        Input: {query}
        """

        with open(NEW_LAW_FILE, 'r', encoding='utf-8') as jsonfile:
            self.new_law = json.load(jsonfile)
        
        if not os.path.exists(VECTOR_LAW_STORE_PATH):
            print(f"Error: Vector store not found at '{VECTOR_LAW_STORE_PATH}'.")
            self.rag_chain = None # Ensure chain is None if setup fails
            return

        vector_store = FAISS.load_local(
            VECTOR_LAW_STORE_PATH,
            self.embeddings, 
            allow_dangerous_deserialization=True
        )
        retriever = vector_store.as_retriever(search_type="similarity_score_threshold", search_kwargs={"score_threshold": 0.9, 'fetch_k': len(self.vector_store.docstore._dict), 'k': len(self.vector_store.docstore._dict)})

        prompt = ChatPromptTemplate.from_template(self.prompt_template)

        self.rag_chain = (
            {"context": retriever | self.format_docs, "query": RunnablePassthrough()}
            | prompt
            | self.llm
            | JsonOutputParser()
        )
        print("RagModel initialized successfully.")
        self.query = json.dumps(self.new_law)
        document_chain = create_stuff_documents_chain(self.llm, prompt)
        # self.analysis_result = self.rag_chain.invoke(self.query) # invoke query text
        self.analysis_result = document_chain.invoke({"query": self.query, "context": retriever.invoke(self.query)})
        print(json.loads(self.analysis_result))
        # print(self.analysis_result)
        self.replace_law() # replace law

        # check if law already exists
        # existing_law_index = next((i for i, law in enumerate(all_laws) if json.loads(law).get('law_code') == new_law.get('law_code')), -1)
        

    def replace_law(self):
        id = json.loads(self.analysis_result).get('id')
        if id:
            # Find the existing law in the vector store
            existing_doc = self.vector_store.docstore.get(id)
            if existing_doc:
                for doc_id, doc in self.vector_store.docstore.items():
                    if doc.metadata.get('id') == id:
                        self.vector_store.docstore[doc_id] = Document(self.query, metadata = {"id": self.new_law.get('id')})
                        print(f"Law with id {id} has been updated to law with id {self.new_law.get('id')} in the vector store.")
        else:
            self.vector_store.add_documents([Document(self.query, metadata = {"id": self.new_law.get('id')})])
            print(f"New law with id {self.new_law.get('id')} has been added to the vector store.")

        self.vector_store.save_local(VECTOR_LAW_STORE_PATH)
        print("Vector store updated successfully.")


    def add_features(self):
        project_name = None
        files_to_process = [
            NEW_FEATURE_FILE,
            NEW_COMPLIANCE_FILE,
            NEW_DATA_DICTIONARY_FILE
        ]
        feature_files = 

        if not feature_files:
            print(f"Error: No feature files (e.g., 'feature-MyProject.jsonl') found in '{features_directory}'.")
            return []
        
        first_feature_file = os.path.basename(feature_files[0])
        project_name = first_feature_file.replace('feature-', '').replace('.jsonl', '')


    def format_docs(self, docs):
        print("--- Documents received by format_docs ---")
        for doc in docs:
            print(doc.metadata) # Print metadata to identify the doc
        print("------------------------------------")
        # ... rest of your formatting logic
        return "\n\n".join(doc.page_content for doc in docs)
    
    def process_feature_doc(self):
        content = (
            f"**Project:** {feature.get('project_name', 'N/A')}\n\n"
            f"**Project ID:** {feature.get('project_id', 'N/A')}\n\n"
            f"**Feature Title:** {feature.get('feature_title', 'N/A')}\n"
            f"**Feature Type:** {feature.get('feature_type', 'N/A')}\n"
            f"**Feature ID:** {feature.get('feature_id', 'N/A')}\n"
            f"**Feature Description:**\n{feature.get('feature_description', '')}\n\n"
            f"--- Project Data Dictionary ---\n{dict_context}\n\n"
            f"--- Project Compliance Rules ---\n{comp_context}\n"
            f"**Source File:** {feature.get('reference_file', 'N/A')}"
        )
        
        metadata = {
            "project_name": feature.get('project_name'),
            "project_id": feature.get('project_id'),
            "feature_id": feature.get('feature_id'),
            "feature_title": feature.get('feature_title'),
            "source_file": feature.get('reference_file')
        }
        return Document(page_content=content, metadata=metadata)