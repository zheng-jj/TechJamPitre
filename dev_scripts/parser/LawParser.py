import json
import uuid
import logging
from typing import List, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


# ------------------ Data Models ------------------

class Provision(BaseModel):
    provision_title: str = Field(description="The title of the provision.")
    provision_body: str = Field(description="The raw content of the provision, including any child paragraphs.")
    provision_code: str = Field(description="Identifier for the provision (section letter/number/etc.), or 'n/a' if not available.")


class LegalDocument(BaseModel):
    country: str = Field(description="Country or European Union (full name, not abbreviated).")
    region: str = Field(description="Region or state; 'n/a' if not applicable.")
    relevant_labels: str = Field(description="Any topic-related relevant labels, separated by commas.")
    law_code: str = Field(description="The specific code of the law.")
    provisions: List[Provision] = Field(description="List of provisions. Do not separate subsections. Ignore sections that are not provisions.")


# ------------------ Parser ------------------

class LawParser:
    logger = logging.getLogger("LawParser")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    @staticmethod
    def _generate_prompt() -> str:
        """Generate parsing rules prompt."""
        return """<role>parser</role>
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
        """Send request to GenAI API with error handling."""
        try:
            client = genai.Client()
            LawParser.logger.info(f"Uploading document: {doc_path}")
            
            doc = client.files.upload(file=doc_path)

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[doc, LawParser._generate_prompt()],
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=1024),
                    temperature=0.2,
                    top_k=80,
                    top_p=0.2,
                    response_mime_type="application/json",
                    response_schema=LegalDocument,
                ),
            )

            if response and response.text:
                return response.text
            else:
                LawParser.logger.error("Empty response received from model.")
                return None

        except Exception as e:
            LawParser.logger.error(f"Error sending request: {e}", exc_info=True)
            return None

    @staticmethod
    def _extract_json(response: str) -> Optional[dict]:
        """Safely extract JSON object from response string."""
        if not response:
            return None
        try:
            raw = response[response.find("{"): response.rfind("}") + 1]
            return json.loads(raw)
        except Exception as e:
            LawParser.logger.error(f"Error parsing JSON from response: {e}", exc_info=True)
            return None

    @staticmethod
    def _parse_response(response: str, file_path: str) -> Optional[str]:
        """Parse model response and output provisions in JSONL format."""
        data = LawParser._extract_json(response)
        if not data:
            return None

        provisions = data.pop("provisions", [])
        if not provisions:
            LawParser.logger.warning("No provisions found in parsed data.")

        out = ""
        for provision in provisions:
            try:
                provision = provision | data  # merge common fields
                provision["id"] = str(uuid.uuid4())
                provision["reference_file"] = file_path
                out += json.dumps(provision) + "\n"
            except Exception as e:
                LawParser.logger.error(f"Error processing provision: {e}", exc_info=True)
                continue

        return out if out else None

    @staticmethod
    def parse(file_path: str) -> Optional[str]:
        """Main entrypoint: parse a legal document into provision JSONL."""
        LawParser.logger.info(f"Parsing file: {file_path}")
        response = LawParser._send_request(file_path)

        if not response:
            LawParser.logger.error("No response to parse.")
            return None

        parsed_data = LawParser._parse_response(response, file_path)
        if not parsed_data:
            LawParser.logger.error("Failed to extract provisions.")
            return None

        LawParser.logger.info("Parsing completed successfully.")
        return parsed_data
