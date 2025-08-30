import os
import argparse
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings # Using Ollama as an example
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Load environment variables
load_dotenv()

# --- Configuration ---
LAW_VECTOR_STORE_PATH = "law_vector_store"
FEATURE_VECTOR_STORE_PATH = "feature_vector_store"

def format_docs(docs):
    """Helper function to format retrieved documents for the prompt context."""
    return "\n\n".join(
        f"Source: {doc.metadata.get('source_file', 'N/A')}\nID: {doc.metadata.get('law_id') or doc.metadata.get('feature_id')}\nContent: {doc.page_content}"
        for doc in docs
    )

def main():
    """Main function to run compliance analysis using two separate vector stores."""
    
    # --- Step 1: Set up command-line argument parsing ---
    parser = argparse.ArgumentParser(description="Perform compliance analysis using a RAG pipeline.")
    parser.add_argument(
        '--type',
        type=str,
        required=True,
        choices=['feature_vs_laws', 'law_vs_features'],
        help="The type of analysis to perform."
    )
    args = parser.parse_args()



    # --- Step 2: Configure based on the selected analysis type ---
    if args.type == 'feature_vs_laws':
        print("--- Mode: Analyzing a New Feature vs. Existing Laws ---")
        vector_store_path = LAW_VECTOR_STORE_PATH
        query_text = (
            "Feature Name: Biometric Login with Liveness Check. "
            "This feature allows users to log in by scanning their face. A liveness check is performed to prevent spoofing. "
            "The collected facial geometry data is stored securely in our cloud environment."
        )
        prompt_template = """
        You are a legal compliance expert. Analyze the new software feature described below against the provided legal texts.

        **New Feature Description:**
        {query}

        **Retrieved Legal Texts:**
        {context}

        **Analysis Request:**
        1. Identify which laws are most relevant to this feature.
        2. Highlight specific compliance risks (e.g., data collection, consent, storage).
        3. Recommend concrete next steps for the engineering team.
        """
    elif args.type == 'law_vs_features':
        print("--- Mode: Analyzing a New Law vs. Existing Features ---")
        vector_store_path = FEATURE_VECTOR_STORE_PATH
        query_text = (
            "A new regulation, 'The Digital Services Accountability Act,' has been passed. "
            "It mandates that any system using automated decision-making to serve content must provide users with a clear explanation of why specific content was recommended. "
            "It also requires an easy way for users to opt-out of all algorithmic personalization."
        )
        prompt_template = """
        You are a product compliance analyst. A new law has been introduced. Based on the retrieved descriptions of our existing product features, identify which features are most likely impacted by this new law.

        **New Law Description:**
        {query}

        **Retrieved Existing Product Features:**
        {context}

        **Analysis Request:**
        1. List the product features that are most impacted by this new law.
        2. For each impacted feature, explain which part of the law applies (e.g., 'automated decision-making,' 'opt-out requirement').
        3. Suggest what changes might be needed for each feature to comply.
        """

    # --- Step 3: Load the appropriate vector store ---
    if not os.path.exists(vector_store_path):
        print(f"Error: Vector store not found at '{vector_store_path}'. Please run the correct ingestion script first.")
        return

    print(f"Loading vector store from '{vector_store_path}'...")
    embeddings = OllamaEmbeddings(model="mxbai-embed-large")
    vector_store = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    # --- Step 4: Build and run the RAG chain ---
    prompt = ChatPromptTemplate.from_template(prompt_template)
    llm = ChatOllama(model="llama3", temperature=0)

    # The chain automatically passes the 'query_text' to the retriever
    rag_chain = (
        {"context": retriever | format_docs, "query": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    print("Generating analysis...\n")
    analysis_result = rag_chain.invoke(query_text)

    print("--- Compliance Analysis Result ---")
    print(analysis_result)
    
if __name__ == "__main__":
    main()