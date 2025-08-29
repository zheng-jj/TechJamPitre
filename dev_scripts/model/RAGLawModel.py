import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.chat_models import init_chat_model


VECTOR_STORE = "law_index"

class RAGLawModel:
    def __init__(self):
        self.llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")
        self.embedding = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

        # create new faiss vector store if it doesn't exist
        try:
            self.vector_store = FAISS.load_local(VECTOR_STORE, self.embedding, allow_dangerous_deserialization=True)
        except RuntimeError:
            self.vector_store = FAISS(
                embedding_function=self.embedding,
                index=faiss.IndexFlatL2(3072),
                docstore=InMemoryDocstore(),
                index_to_docstore_id={},
            )
            self.vector_store.save_local(VECTOR_STORE, index_name="index")

    # update local faiss vector store with docs
    def update_vector_store(self, documents):
        self.vector_store.add_documents(documents)
        self.vector_store.save_local(VECTOR_STORE)

    # prompt rag model
    def prompt(self, prompt):
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever()
        )
        response = qa_chain.invoke(prompt)
        return response