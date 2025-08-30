import os
import logging
from typing import List, Optional

import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI

VECTOR_STORE = "law_index"
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

SCHEMA = {
    "title": "Answer",
    "type": "object",
    "properties": {
        "provisions": {
            "type": "array",
            "description": "List of all provisions the feature has violated.",
            "items": {
                "type": "object",
                "properties": {
                    "provision_title": {"type": "string", "description": "provision_title of provision violated."},
                    "provision_body": {"type": "string", "description": "provision_body of provision violated."},
                    "provision_code": {"type": "string", "description": "provision_code of provision violated."},
                    "country": {"type": "string", "description": "country of provision violated."},
                    "region": {"type": "string", "description": "region of provision violated."},
                    "relevant_labels": {"type": "string", "description": "relevant_labels of provision violated."},
                    "law_code": {"type": "string", "description": "law_code of provision violated."},
                    "reference_file": {"type": "string", "description": "reference_file of provision violated."},
                    "reasoning": {"type": "string", "description": "How does the feature violate the provision"}
                },
                "required": [
                    "provision_title",
                    "provision_body",
                    "provision_code",
                    "country",
                    "region",
                    "relevant_labels",
                    "law_code",
                    "reference_file",
                    "reasoning",
                ],
            },
        }
    },
    "required": ["provisions"],
}


class RAGLawModel:
    def __init__(self):
        self.logger = logging.getLogger("RAGLawModel")
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash", response_mime_type="application/json", response_schema=SCHEMA
            )
            self.embedding = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
            self.vector_store = self._get_vector_store()
        except Exception as e:
            self.logger.error(f"Error initializing model components: {e}", exc_info=True)
            raise

    def _get_vector_store(self) -> FAISS:
        try:
            if os.path.isdir(VECTOR_STORE):
                self.logger.info(f"Loading existing vector store from {VECTOR_STORE}")
                return FAISS.load_local(
                    folder_path=VECTOR_STORE, embeddings=self.embedding, allow_dangerous_deserialization=True
                )
            else:
                self.logger.info(f"Creating new vector store at {VECTOR_STORE}")
                os.makedirs(VECTOR_STORE, exist_ok=True)
                index = faiss.IndexFlatL2(3072)  # Dimensionality should match embedding size

                vs = FAISS(
                    embedding_function=self.embedding,
                    index=index,
                    docstore=InMemoryDocstore(),
                    index_to_docstore_id={},
                )
                vs.save_local(VECTOR_STORE)
                return vs
        except Exception as e:
            self.logger.error(f"Error creating/loading vector store: {e}", exc_info=True)
            raise

    def _generate_template(self) -> ChatPromptTemplate:
        template = """
        You are an expert in legal analysis. Your task is to identify provisions from the provided context that are violated by the user's input.

        You MUST ONLY respond with a JSON object that conforms to the 'Answer' schema.
        Your response should start with a '{{' and end with a '}}'. Do not include any other text, explanations, or markdown formatting.

        The context will contain compliances that are conformed or considered, if it resolves any provision violation, ignore the violation.
        If you find relevant provisions in the context, extract them according to the schema.
        If the context is empty or you cannot find any relevant provisions, you MUST return a JSON object with an empty list for the "provisions" key.

        Context:
        {context}

        Input: {input}
        """
        return ChatPromptTemplate.from_template(template)

    def update_vector_store(self, documents: List):
        try:
            self.vector_store.add_documents(documents, )
            self.vector_store.save_local(VECTOR_STORE)
            self.logger.info(f"Vector store updated with {len(documents)} documents.")
        except Exception as e:
            self.logger.error(f"Error updating vector store: {e}", exc_info=True)
            raise

    def retrieve_docs(self, feature) -> List:
        try:
            retriever = self.vector_store.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs={
                    "fetch_k": len(self.vector_store.docstore._dict),
                    "k": len(self.vector_store.docstore._dict),
                    "score_threshold": 0.6,
                },
            )
            results = retriever.invoke(feature)
            self.logger.info(f"Retrieved {len(results)} documents for feature.")
            return results
        except Exception as e:
            self.logger.error(f"Error retrieving documents: {e}", exc_info=True)
            return []

    def prompt(self, prompt, docs):
        try:
            document_chain = create_stuff_documents_chain(self.llm, self._generate_template())
            response = document_chain.invoke({"input": prompt, "context": docs})
            return response
        except Exception as e:
            self.logger.error(f"Error running prompt chain: {e}", exc_info=True)
            return None