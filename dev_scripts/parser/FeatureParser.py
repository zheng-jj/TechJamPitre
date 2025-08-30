from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
import json

class Feature(BaseModel):
    feature_title: str = Field(description="The name of the feature. No abbreviated format, the name must in full.")
    feature_description: str = Field(description="Provide an indepth summary on the feature goals. Include any information that might cause legal complications.")
    feature_type: str = Field(description="Identify the type of feature")
    
class DataDictionary(BaseModel):
    variable_name: str = Field(description="The name of the term or acronym used.")
    variable_description: str = Field(description="The meaning of the variable_name.")

class Compliance(BaseModel):
    compliance_title: str = Field(description="The name of the compliance statement.")
    compliance_description: str = Field(description="The description of the compliance statement.")

class SpecificationDocument(BaseModel):
    project_name: str = Field(description="The name of the project. No abbreviated format, the name must in full.")
    features: List[Feature] = Field(description="A list of all features found in the document.")
    data_dictionary: List[DataDictionary] = Field(description="A list of all specialized terms found in the document.")
    compliance_terms: List[Compliance] = Field(description="A list of all compliance information found in the document.")

class FeatureParser:
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
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                doc, 
                FeatureParser._generate_prompt()
            ],
            config=types.GenerateContentConfig(
                response_mime_type = "application/json",
                response_schema = SpecificationDocument
            )
        )
        return response.text

    def _parse_response(response, file_path):
        raw = response[response.find("{"): response.rfind("}")+1]
        data = json.loads(raw)
        data["reference_file"] = file_path
        return json.dumps(data)
    
    def parse(file_path):
        res = FeatureParser._send_request(file_path)
        data = FeatureParser._parse_response(res, file_path)
        return data
