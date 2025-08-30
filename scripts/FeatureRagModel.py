import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai  import GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.chat_models import init_chat_model

load_dotenv()

FEATURE_VECTOR_STORE_PATH = "feature_vector_store"
FEATURE_SCHEMA = {
  "title": "Answer",
  "type": "object",
  "properties": {
    "provisions": {
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
          "feature_type": {
            "type": "string",
            "description": "feature_type of feature violated by law."
          },
          "reasoning": {
            "type": "string",
            "description": "How does the feature violate the provision"
          }
        },
        "required": [
          "feature_title",
          "feature_description",
          "feature_type",
          "reasoning"
        ]
      }
    }
  },
  "required": [
    "provisions"
  ]
}


class FeatureRagModel:
    def __init__(self, args):
        self.args = args
        self.vector_store_path = None
        self.prompt_template = None
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        self.llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai", response_mime_type="application/json")

        self.vector_store_path = FEATURE_VECTOR_STORE_PATH
        self.llm.response_schema = FEATURE_SCHEMA
        self.prompt_template = """
        Your are an expert in feature analysis. Your task is to identify the existing product features that may be impacted by the new law.

        Input:
        {query}

        **Retrieved Existing Product Features:**
        {context}

        You MUST ONLY respond with a JSON object that conforms to the 'Answer' schema.
        Your response should start with a '{{' and end with a '}}'. Do not include any other text, explanations, or markdown formatting.

        If you find relevant provisions in the context, extract them according to the schema.
        If the context is empty or you cannot find any relevant provisions, you MUST return a JSON object with an empty list for the "provisions" key.
        """
        

        if not os.path.exists(self.vector_store_path):
            print(f"Error: Vector store not found at '{self.vector_store_path}'.")
            self.rag_chain = None # Ensure chain is None if setup fails
            return

        vector_store = FAISS.load_local(
            self.vector_store_path, 
            self.embeddings, 
            allow_dangerous_deserialization=True
        )
        retriever = vector_store.as_retriever(search_kwargs={"score_threshold": 0.6})

        prompt = ChatPromptTemplate.from_template(self.prompt_template)

        self.rag_chain = (
            {"context": retriever | self.format_docs, "query": RunnablePassthrough()}
            | prompt
            | self.llm
            | JsonOutputParser()
        )
        print("RagModel initialized successfully.")
        

    def format_docs(self, docs):
        return "\n\n".join(
            f"Source: {doc.metadata.get('source_file', 'N/A')}\nID: {doc.metadata.get('law_code') or doc.metadata.get('feature_id')}\nContent: {doc.page_content}"
            for doc in docs
        )

    def prompt(self, query_text):
        if not self.rag_chain:
            return "Error: RAG chain is not initialized. Please check the vector store path."
        
        analysis_result = self.rag_chain.invoke(query_text) # invoke query text
        return analysis_result
