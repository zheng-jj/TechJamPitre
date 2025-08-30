import os
import logging
from typing import List
from dotenv import load_dotenv
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from time import sleep

load_dotenv()

FEATURE_VECTOR_STORE_PATH = "feature_vector_store"
FEATURE_SCHEMA = {
  "title": "Answer",
  "type": "object",
  "properties": {
    "features": {
      "type": "array",
      "description": "List of all features violated by the law",
      "items": {
        "type": "object",
        "properties": {
          "feature_title": {
            "type": "string",
            "description": "feature_title of feature violated by law."
          },
          "feature_description": {
            "type": "string",
            "description": "feature_description of feature violated by law."
          },
          "feature_id": {
            "type": "string",
            "description": "feature_id of feature violated by law."
          },
          "feature_type": {
            "type": "string",
            "description": "feature_type of feature violated by law."
          },
          "project_name": {
            "type": "string",
            "description": "project_name of feature violated by law."
          },
          "project_id": {
              "type": "string",
              "description": "project_id of feature violated by law."
          },
          "reference_file": {
            "type": "string",
            "description": "reference_file of feature violated by law."
          },
          "reasoning": {
            "type": "string",
            "description": "List out all laws that has been violated the features and the reason for the violation"
          }
        },
        "required": [
          "feature_title",
          "feature_description",
          "feature_id",
          "feature_type",
          "project_name",
          "project_id",
          "reference_file",
          "reasoning"
        ]
      }
    }
  },
  "required": [
    "features"
  ]
}


class FeatureRagModel:
    def __init__(self):
        self.logger = logging.getLogger("RAGFeatureModel")
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash", response_mime_type="application/json", response_schema=FEATURE_SCHEMA
            )
            self.embedding = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
            self.vector_store = self._get_vector_store()
        except Exception as e:
            self.logger.error(f"Error initializing model components: {e}", exc_info=True)
            raise

    def _get_vector_store(self) -> FAISS:
        try:
            if os.path.isdir(FEATURE_VECTOR_STORE_PATH):
                self.logger.info(f"Loading existing vector store from {FEATURE_VECTOR_STORE_PATH}")
                return FAISS.load_local(
                    folder_path=FEATURE_VECTOR_STORE_PATH, embeddings=self.embedding, allow_dangerous_deserialization=True
                )
            else:
                self.logger.info(f"Creating new vector store at {FEATURE_VECTOR_STORE_PATH}")
                os.makedirs(FEATURE_VECTOR_STORE_PATH, exist_ok=True)
                index = faiss.IndexFlatL2(3072)
                vs = FAISS(
                    embedding_function=self.embedding,
                    index=index,
                    docstore=InMemoryDocstore(),
                    index_to_docstore_id={},
                )
                vs.save_local(FEATURE_VECTOR_STORE_PATH)
                return vs
        except Exception as e:
            self.logger.error(f"Error creating/loading vector store: {e}", exc_info=True)
            raise

    def _generate_template(self) -> ChatPromptTemplate:
        template = """
        Your are an expert in feature analysis. Your task is to identify the existing product features that may be impacted by the new law.
        You MUST ONLY respond with a JSON object that conforms to the 'Answer' schema.
        Your response should start with a '{{' and end with a '}}'. Do not include any other text, explanations, or markdown formatting.

        If you find relevant provisions in the context, extract them according to the schema.
        If the context is empty or you cannot find any relevant provisions, you MUST return an empty JSON object.

        Input:
        {query}

        **Retrieved Existing Product Features:**
        {context} 
        """
        return ChatPromptTemplate.from_template(template)

    def update_vector_store(self, documents: List, batch_size: int = 2):
      try:
          for i in range(0, len(documents), batch_size):
              batch = documents[i:i + batch_size]
              self.vector_store.add_documents(batch)
              sleep(2)
          self.vector_store.save_local(FEATURE_VECTOR_STORE_PATH)
          self.logger.info(f"Vector store updated with {len(documents)} documents in batches of {batch_size}.")
      except Exception as e:
          self.logger.error(f"Error updating vector store: {e}", exc_info=True)
          raise


    def retrieve_docs(self, law) -> List:
        try:
            retriever = self.vector_store.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs={
                    "fetch_k": len(self.vector_store.docstore._dict),
                    "k": len(self.vector_store.docstore._dict),
                    "score_threshold": 0.6,
                },
            )
            results = retriever.invoke(law)
            self.logger.info(f"Retrieved {len(results)} documents for law.")
            return results
        except Exception as e:
            self.logger.error(f"Error retrieving documents: {e}", exc_info=True)
            return []

    def prompt(self, prompt, docs):
        try:
            document_chain = create_stuff_documents_chain(self.llm, self._generate_template())
            response = document_chain.invoke({"query": prompt, "context": docs})
            return response
        except Exception as e:
            self.logger.error(f"Error running prompt chain: {e}", exc_info=True)
            return None
