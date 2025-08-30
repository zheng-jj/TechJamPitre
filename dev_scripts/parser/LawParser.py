from google import genai
from google.genai import types
import json
from pydantic import BaseModel, Field
from typing import List
import uuid

class Provision(BaseModel):
    provision_title: str = Field(description="The title of the provision.")
    provision_body: str = Field(description="The raw content of the provision, including any child paragraphs.")
    provision_code: str = Field(description="Any form of identifier for the provision in form of section letter/number/etc., or 'n/a' if not available.")

class LegalDocument(BaseModel):
    country: str = Field(description="The country or European Union associated with the document. No abbreviated format, the name must in full.")
    region: str = Field(description="The region or state; 'n/a' if it does not apply.")
    relevant_labels: str = Field(description="Any topic related relevant labels, separated by commas.")
    law_code: str = Field(description="The specific code of the law.")
    provisions: List[Provision] = Field(description="A list of all provisions found in the document. Do not seperate subsections of provisions. IGNORE SECTIONS THAT ARE NOT PROVISIONS.")

class LawParser:
    def _generate_prompt():
        return f"""<role>
            parser
            </role>
            <rules>
            1. Reference the document in pdf format 
            2. Input n/a in any field that does not exist or does not have any data.
            3. DO NOT SEARCH THE INTERNET 
            4. DO NOT GENERATE NEW DATA OR MAKE UP DATA.
            5. ALL DATA EXCEPT RELEVANT LABELS SHOULD ORIGINATE FROM THE DOCUMENT.
            </rules>
            """
    
    def _send_request(doc_path):
        client = genai.Client()
        doc = client.files.upload(
            file=doc_path,
        )
        if doc_path.lower().endswith(".pdf"):
            doc = client.files.upload(file=doc_path)
        else:
            with open(doc_path, "r") as f:
                doc = f.read()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                doc, 
                LawParser._generate_prompt()
            ],
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=1024),
                temperature=0.2,
                top_k=80,
                top_p=0.2,
                response_mime_type = "application/json",
                response_schema = LegalDocument
            )
        )
        return response.text
    
    def _parse_response(response, file_path):
        raw = response[response.find("{"): response.rfind("}")+1]
        data = json.loads(raw)
        provisions = data["provisions"]
        del data["provisions"]
        out = ""
        for provision in provisions:
            provision = provision | data
            provision["id"] = str(uuid.uuid4())
            provision["reference_file"] = file_path
            out = f"{out}{json.dumps(provision)}\n"
        return out
    
    def parse(file_path):
        res = LawParser._send_request(file_path)
        data = LawParser._parse_response(res, file_path)
        return data