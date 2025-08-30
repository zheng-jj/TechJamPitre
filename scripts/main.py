from FeatureRagModel import FeatureRagModel
from update_store import update_store

def main():
    # query_text = """
    # Loot Boxes implementation
    # """
    # FEATURE_CHECK = 'feature_vs_laws'
    # LAW_CHECK = 'law_vs_features'
    # model = FeatureRagModel()
    # result = model.prompt('{"provision_title": "Anonymous age verification.", "provision_body": "(1) As used in this section, the term \"anonymous age verification\" means a commercially reasonable method used by a government agency or a business for the purpose of age verification which is conducted by a nongovernmental, independent third party organized under the laws of a state of the United States which: (a) Has its principal place of business in a state of the United States; and (b) Is not owned or controlled by a company formed in a foreign country, a government of a foreign country, or any other entity formed in a foreign country. (2) A third party conducting anonymous age verification pursuant to this section: (a) May not retain personal identifying information used to verify age once the age of an account holder or a person seeking an account has been verified. (b) May not use personal identifying information used to verify age for any other purpose. (c) Must keep anonymous any personal identifying information used to verify age. Such information may not be shared or otherwise communicated to any person. (d) Must protect personal identifying information used to verify age from unauthorized or illegal access, destruction, use, modification, or disclosure through reasonable security procedures and practices appropriate to the nature of the personal information.", "provision_code": "501.1738", "country": "United States", "region": "Florida", "relevant_labels": "online protections for minors, social media platforms, account termination, age verification, material harmful to minors, civil penalties, private causes of action, Department of Legal Affairs, investigative demands, punitive damages, jurisdiction of state courts, contract, rules, third party conducting age verification, severability, effective date", "law_code": "CS/CS/HB 3, Engrossed 1", "reference_file": "./law_dataset\\CSCSHB_3_Online_Protections_for_Minors.pdf"}')
    # print(result)
    response = update_store("update_law")

if __name__ == "__main__":
    main()
