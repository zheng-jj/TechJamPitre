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




VECTOR_LAW_STORE_PATH = "law_vector_store"
VECTOR_FEATURE_STORE_PATH = "feature_vector_store"
LAW_DATABASE_FILE = "law_data/laws.jsonl" # main law database
FEATURE_DATABASE_FILE = "feature_data/" # main feature database
NEW_LAW_FILE = "new_law.json" # new law file

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
    # def process_feature_record(project_name, feature, source_file):
    #     content = (
    #         f"Project: {project_name}\n"
    #         f"Feature Title: {feature.get('feature_title', 'N/A')}\n"
    #         f"Feature Type: {feature.get('feature_type', 'N/A')}\n"
    #         f"Description: {feature.get('feature_description', '')}"
    #     )
    #     metadata = {
    #         "project_name": project_name,
    #         "source_file": source_file,
    #         "doc_type": "Feature",
    #         "feature_title": feature.get('feature_title')
    #     }
    #     return Document(page_content=content, metadata=metadata)
        

    def __init__(self, args):
        load_dotenv()
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

        if (args == "update_law"):
            self.update_law()
        elif (args == "update_feature"):
            self.update_feature()
        else:
            print("Invalid argument. Please use 'update_law' or 'update_feature'.")

    def update_law(self):
        self.vector_store = FAISS.load_local(VECTOR_LAW_STORE_PATH, self.embeddings, allow_dangerous_deserialization=True)
        self.llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai", response_mime_type="application/json")
        
        self.llm.response_schema = LAW_SCHEMA
        self.prompt_template = """
        Flag out 1 MOST IDENTICAL LAW with IDENTICAL LAW CODE, LAW TITLE, AND ONLY SLIGHT CHANGES TO ITS DESCRIPTION. RESPONED WITH {{NONE}} IF THERE ARE NO IDENTICAL LAW CODE, ELSE SEPARATE IT OUT WITH OLD LAW AND NEW LAW.
    
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
        retriever = vector_store.as_retriever(search_kwargs={"score_threshold": 0.9})

        prompt = ChatPromptTemplate.from_template(self.prompt_template)

        self.rag_chain = (
            {"context": retriever | self.format_docs, "query": RunnablePassthrough()}
            | prompt
            | self.llm
            | JsonOutputParser()
        )
        print("RagModel initialized successfully.")
        self.query = json.dumps(self.new_law)
        self.analysis_result = self.rag_chain.invoke(self.query) # invoke query text
        print(json.dumps(self.analysis_result, indent=2))
        self.replace_law() # replace law

        # check if law already exists
        # existing_law_index = next((i for i, law in enumerate(all_laws) if json.loads(law).get('law_code') == new_law.get('law_code')), -1)
        

    def replace_law(self):
        id = self.analysis_result.get('id')
        if id:
            # Find the existing law in the vector store
            existing_doc = self.vector_store.docstore.get(id)
            if existing_doc:
                for doc_id, doc in self.vector_store.docstore.items():
                    if doc.metadata.get('id') == id:
                        self.vector_store.docstore[doc_id] = Document(self.query)
                        print(f"Law with id {id} has been updated to law with id {self.new_law.get('id')} in the vector store.")

        else:
            self.vector_store.add_documents([Document(self.query)])
            print(f"New law with id {self.new_law.get('id')} has been added to the vector store.")

        self.vector_store.save_local(VECTOR_LAW_STORE_PATH)
        print("Vector store updated successfully.")


    # def update_feature(self):
    #     self.vector_store = FAISS.load_local(VECTOR_FEATURE_STORE_PATH, self.embeddings, allow_dangerous_deserialization=True)

    #     json_files = glob.glob(os.path.join(FEATURE_DATABASE_FILE, "*.json"))
    #     for file_path in json_files:
    #         with open(file_path, 'r', encoding='utf-8') as f:
    #             data = json.load(f)
        
    #     # check if law already exists
    #     existing_law_index = next((i for i, law in enumerate(all_laws) if json.loads(law).get('law_code') == new_law.get('law_code')), -1)

    #     if existing_law_index != -1:
    #         ids_to_remove = [
    #             doc_id for doc_id, doc in self.vector_store.docstore.items()
    #             if doc.metadata.get('law_id') == new_law.get('law_code')
    #         ]

    #         # Remove existing law
    #         if ids_to_remove:
    #             self.vector_store.delete(ids_to_remove)
    #             print(f"Removed {len(ids_to_remove)} documents related to law_code {new_law.get('law_code')} from vector store.")

    #         all_laws[existing_law_index] = json.dumps(new_law)
    #     else:
    #         all_laws.append(json.dumps(new_law))

    #     new_doc = self.process_law_item(new_law, NEW_LAW_FILE)
    #     self.vector_store.add_documents([new_doc])
    #     self.vector_store.save_local(VECTOR_STORE_PATH)

    #     # rewrite jsonl file
    #     with open(LAW_DATABASE_FILE, 'w') as jsonlfile:
    #         jsonlfile.writelines(all_laws)

    def format_docs(self, docs):
        return "\n\n".join(
            f"Source: {doc.metadata.get('source_file', 'N/A')}\nID: {doc.metadata.get('law_code') or doc.metadata.get('feature_id')}\nContent: {doc.page_content}"
            for doc in docs
        )