package models

type Feature struct {
	FeatureID          string    `bson:"feature_id" json:"feature_id"`
	FeatureTitle       string `bson:"feature_title" json:"feature_title"`
	FeatureDescription string `bson:"feature_description" json:"feature_description"`
	FeatureType        string `bson:"feature_type" json:"feature_type"`
	ProjectName        string `bson:"project_name" json:"project_name"`
	ReferenceFile      string `bson:"reference_file" json:"reference_file"`
	ProjectID          string `bson:"project_id" json:"project_id"`
}

type ReasoningFeature struct {
	FeatureID          string `bson:"feature_id" json:"feature_id"`
	FeatureTitle       string `bson:"feature_title" json:"feature_title"`
	FeatureDescription string `bson:"feature_description" json:"feature_description"`
	FeatureType        string `bson:"feature_type" json:"feature_type"`
	ProjectName        string `bson:"project_name" json:"project_name"`
	ReferenceFile      string `bson:"reference_file" json:"reference_file"`
	ProjectID          string `bson:"project_id" json:"project_id"`
	Reasoning          string `bson:"reasoning" json:"reasoning"`
}

type Provision struct {
	ProvisionID    string   `bson:"provision_id" json:"id"`
	ProvisionTitle string   `bson:"provision_title" json:"provision_title"`
	ProvisionBody  string   `bson:"provision_body" json:"provision_body"`
	ProvisionCode  string   `bson:"provision_code" json:"provision_code"`
	Country        string   `bson:"country" json:"country"`
	Region         string   `bson:"region" json:"region"`
	RelevantLabels []string `bson:"relevant_labels" json:"relevant_labels"`
	LawCode        string   `bson:"law_code" json:"law_code"`
	ReferenceFile  string   `bson:"reference_file" json:"reference_file"`
}

type ReasoningProvision struct {
	ProvisionID    string   `bson:"provision_id" json:"id"`
	ProvisionTitle string   `bson:"provision_title" json:"provision_title"`
	ProvisionBody  string   `bson:"provision_body" json:"provision_body"`
	ProvisionCode  string   `bson:"provision_code" json:"provision_code"`
	Country        string   `bson:"country" json:"country"`
	Region         string   `bson:"region" json:"region"`
	RelevantLabels []string `bson:"relevant_labels" json:"relevant_labels"`
	LawCode        string   `bson:"law_code" json:"law_code"`
	ReferenceFile  string   `bson:"reference_file" json:"reference_file"`
	Reasoning      string   `bson:"reasoning" json:"reasoning"`
}

type ProvisionRaw struct {
    ProvisionID    string `json:"id"`
    ProvisionTitle string `json:"provision_title"`
    ProvisionBody  string `json:"provision_body"`
    ProvisionCode  string `json:"provision_code"`
    Country        string `json:"country"`
    Region         string `json:"region"`
    RelevantLabels string `json:"relevant_labels"` // string here
    LawCode        string `json:"law_code"`
    ReferenceFile  string `json:"reference_file"`
}


type FeatureProvisionLink struct {
	FeatureID   string `bson:"feature_id" json:"feature_id"`
	ProvisionID string `bson:"provision_id" json:"provision_id"`
}
