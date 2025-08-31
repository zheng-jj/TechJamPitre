import json
import uuid
import logging
from typing import List, Tuple, Union, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


# ------------------ Data Models ------------------

class Feature(BaseModel):
    feature_title: str = Field(description="The name of the feature. Must be written in full.")
    feature_description: str = Field(description="In-depth summary of the feature goals, including any legal implications.")
    feature_type: str = Field(description="Identify the type of feature.")


class DataDictionary(BaseModel):
    variable_name: str = Field(description="The name of the term or acronym.")
    variable_description: str = Field(description="The meaning of the variable_name.")


class Compliance(BaseModel):
    compliance_title: str = Field(description="The name of the compliance statement.")
    compliance_description: str = Field(description="Details about the compliance statement.")


class SpecificationDocument(BaseModel):
    project_name: str = Field(description="The project name (no abbreviations).")
    features: List[Feature] = Field(description="A list of features in the document.")
    data_dictionary: List[DataDictionary] = Field(description="Specialized terms used in the document.")
    compliance_terms: List[Compliance] = Field(description="Compliance information in the document.")


# ------------------ Feature Parser ------------------

class FeatureParser:
    logger = logging.getLogger("FeatureParser")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    @staticmethod
    def _generate_prompt() -> str:
        """Generate system prompt with parsing rules."""
        return """<role>
            parser
            </role>
            <rules>
            1. Reference the document in PDF format. 
            2. Input 'n/a' in any field that does not exist or does not have any data.
            3. DO NOT search the internet. 
            4. DO NOT generate new data or make up data.
            5. ALL data except relevant labels must originate from the document.
            </rules>
        """

    @staticmethod
    def _send_request(doc_path: str) -> Optional[str]:
        """Send request to Google GenAI with error handling."""
        try:
            client = genai.Client()
            
            FeatureParser.logger.info(f"Uploading document: {doc_path}")

            if doc_path.lower().endswith(".pdf"):
                doc = client.files.upload(file=doc_path)
            else:
                with open(doc_path, "r") as f:
                    doc = f.read()

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[doc, FeatureParser._generate_prompt()],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SpecificationDocument
                )
            )

            return response.text if response else None

        except Exception as e:
            FeatureParser.logger.error(f"Error sending request: {e}", exc_info=True)
            return None

    @staticmethod
    def _extract_json(response: str) -> Optional[dict]:
        """Extract JSON object from model response text."""
        try:
            if not response:
                return None
            raw = response[response.find("{"): response.rfind("}") + 1]
            return json.loads(raw)
        except Exception as e:
            FeatureParser.logger.error(f"Error parsing JSON: {e}", exc_info=True)
            return None

    @staticmethod
    def _jsonl_from_records(records: List[dict], record_type: str,
                            project_name: str, project_id: str, file_path: str,
                            id_field: str) -> str:
        """Convert list of records to JSONL format with generated metadata."""
        jsonl_output = ""
        for rec in records:
            rec[id_field] = str(uuid.uuid4())
            rec["project_name"] = project_name
            rec["reference_file"] = file_path
            rec["project_id"] = project_id
            jsonl_output += json.dumps(rec) + "\n"
        FeatureParser.logger.info(f"Generated JSONL for {record_type}: {len(records)} records")
        return jsonl_output

    @staticmethod
    def _parse_response(response: str, file_path: str) -> Optional[Tuple[str, str, str]]:
        """Parse model response into JSONL outputs for features, compliance, and data dictionary."""
        data = FeatureParser._extract_json(response)
        if not data:
            return None

        project_name = data.get("project_name", "n/a")
        project_id = str(uuid.uuid4())

        feature_jsonl = FeatureParser._jsonl_from_records(
            data.get("features", []),
            "features",
            project_name,
            project_id,
            file_path,
            "feature_id"
        )

        compliance_jsonl = FeatureParser._jsonl_from_records(
            data.get("compliance_terms", []),
            "compliance",
            project_name,
            project_id,
            file_path,
            "compliance_id"
        )

        dictionary_jsonl = FeatureParser._jsonl_from_records(
            data.get("data_dictionary", []),
            "data dictionary",
            project_name,
            project_id,
            file_path,
            "dictionary_id"
        )

        return feature_jsonl, compliance_jsonl, dictionary_jsonl

    @staticmethod
    def parse(file_path: str) -> Optional[Tuple[str, str, str]]:
        """Main entrypoint: parse a given document into structured JSONL."""
        FeatureParser.logger.info(f"Parsing file: {file_path}")
        response = FeatureParser._send_request(file_path)

        if not response:
            FeatureParser.logger.error("No response received from model.")
            return None

        parsed_data = FeatureParser._parse_response(response, file_path)
        if not parsed_data:
            FeatureParser.logger.error("Failed to parse response.")
            return None

        FeatureParser.logger.info("Parsing completed successfully.")
        return parsed_data
