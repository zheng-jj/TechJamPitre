import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate


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

    def _generate_template(self):
        template = """
        Your goal is to identify all the possible laws and provisions the input feature has violated and nothing else. Include provision_code, law_code, provision body and reference file. For context, here is a list of all laws and provisions to reference to:

        {context}

        Question: {input}
        """
        return ChatPromptTemplate.from_template(template)


    # update local faiss vector store with docs
    def update_vector_store(self, documents):
        self.vector_store.add_documents(documents)
        self.vector_store.save_local(VECTOR_STORE)

    # prompt rag model
    def prompt(self, prompt):
        document_chain = create_stuff_documents_chain(self.llm, self._generate_template())
        retrieval_chain = create_retrieval_chain(self.vector_store.as_retriever(), document_chain)
        response = retrieval_chain.invoke({"input": prompt})
        return response["answer"]