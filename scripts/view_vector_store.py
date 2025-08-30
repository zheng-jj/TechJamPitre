# view_vector_store.py

import os
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
# Make sure these match the ones used to create the store
VECTOR_STORE_PATH = "law_vector_store" 

def main():
    """Loads a FAISS vector store from disk and prints its contents."""
    
    print(f"Attempting to load vector store from: '{VECTOR_STORE_PATH}'")
    
    if not os.path.exists(VECTOR_STORE_PATH):
        print("Error: Directory not found. Please check the VECTOR_STORE_PATH.")
        return

    # Initialize the exact same embedding function used to create the store
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    try:
        # Load the vector store from the local directory
        vector_store = FAISS.load_local(
            VECTOR_STORE_PATH, 
            embeddings,
            allow_dangerous_deserialization=True # Required for loading local FAISS stores
        )
        print("✅ Vector store loaded successfully.")
    except Exception as e:
        print(f"An error occurred while loading the vector store: {e}")
        return

    # The .docstore attribute holds the documents
    docstore = vector_store.docstore
    
    # Check if the docstore exists and has content
    if hasattr(docstore, '_dict') and docstore._dict:
        num_docs = len(docstore._dict)
        print(f"\n--- Found {num_docs} document(s) in the store ---\n")
        
        # Iterate through the documents and print their details
        for i, (doc_id, doc) in enumerate(docstore._dict.items()):
            print(f"--- Document {i + 1} of {num_docs} ---")
            print(f"Internal Doc ID: {doc_id}")
            print("\n--- METADATA ---")
            # Nicely print the metadata dictionary
            for key, value in doc.metadata.items():
                print(f"  {key}: {value}")
            
            print("\n--- PAGE CONTENT (Preview) ---")
            # Print the first 300 characters of the page content
            print(f"{doc.page_content[:300]}...")
            print("\n" + "="*40 + "\n")
            
    else:
        print("The vector store appears to be empty or does not have a standard docstore.")

if __name__ == "__main__":
    main()