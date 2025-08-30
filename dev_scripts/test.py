import json
from parser.LawParser import LawParser
from parser.FeatureParser import FeatureParser
from model.RAGLawModel import RAGLawModel


def load_jsonl(file_path):
    """Load a JSONL file into a list of dicts."""
    with open(file_path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def build_prompt(items, title_key, desc_key):
    """Build a numbered prompt string from list of dicts."""
    return "\n".join(
        f"{i}. {item[title_key]} - {item[desc_key]}"
        for i, item in enumerate(items)
    )


def main():
    rag_law_model = RAGLawModel()
    def build_prompt(items, title_key, desc_key):
        """Build a numbered prompt string from list of dicts."""
        return "\n".join(
            f"{i}. {item[title_key]} - {item[desc_key]}"
            for i, item in enumerate(items)
        )

    # Load parsed data
    features = load_jsonl("E:/TechJam/feature_parsed/2009 - library-feature.jsonl")
    compliance = load_jsonl("E:/TechJam/feature_parsed/2009 - library-compliance.jsonl")
    data_dict = load_jsonl("E:/TechJam/feature_parsed/2009 - library-data_dictionary.jsonl")

    # Build prompts
    terminology_prompt = build_prompt(data_dict, "variable_name", "variable_description")
    compliance_prompt = build_prompt(compliance, "compliance_title", "compliance_description")
    features_prompt = build_prompt(features, "feature_title", "feature_description")

    # Retrieve docs (deduplicate)
    raw_docs = []
    for feature in features:
        query_text = f'{feature["feature_title"]} - {feature["feature_description"]}'
        raw_docs.extend(rag_law_model.retrieve_docs(query_text))

    docs = []
    for doc in raw_docs:
        if doc not in docs:
            docs.append(doc)  # deduplicate with set

    # Final model prompt
    full_prompt = f"""
        <features>
        {features_prompt}
        </features>
        <terminology>
        {terminology_prompt}
        </terminology>
        <compliance_already_conformed>
        {compliance_prompt}
        </compliance_already_conformed>
    """

    result = rag_law_model.prompt(full_prompt.strip(), docs)
    print(result)


if __name__ == "__main__":
    main()
