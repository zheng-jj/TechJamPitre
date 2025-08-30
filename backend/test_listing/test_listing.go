package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Feature struct should match your models.Feature
type Feature struct {
	FeatureID          int    `json:"feature_id"`
	FeatureTitle       string `json:"feature_title"`
	FeatureDescription string `json:"feature_description"`
	FeatureType        string `json:"feature_type"`
	ProjectName        string `json:"project_name"`
	ProjectID          int    `json:"project_id"`
	ReferenceFile      string `json:"reference_file"`
}

type Provision struct {
	ProvisionID    int      `bson:"provision_id" json:"id"`
	ProvisionTitle string   `bson:"provision_title" json:"provision_title"`
	ProvisionBody  string   `bson:"provision_body" json:"provision_body"`
	ProvisionCode  string   `bson:"provision_code" json:"provision_code"`
	Country        string   `bson:"country" json:"country"`
	Region         string   `bson:"region" json:"region"`
	RelevantLabels []string `bson:"relevant_labels" json:"relevant_labels"`
	LawCode        string   `bson:"law_code" json:"law_code"`
	ReferenceFile  string   `bson:"reference_file" json:"reference_file"`
}

func main() {
	baseURL := "http://127.0.0.1:8080"

	features := []Feature{
		{
			FeatureID:          1,
			FeatureTitle:       "Customer Accounts",
			FeatureDescription: "Allows customers to create accounts and store profile info",
			FeatureType:        "System Feature",
			ProjectName:        "GAMMA-J Web Store",
			ProjectID:          101,
			ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
		},
		{
			FeatureID:          2,
			FeatureTitle:       "Order Processing",
			FeatureDescription: "Process customer orders and update inventory",
			FeatureType:        "System Feature",
			ProjectName:        "GAMMA-J Web Store",
			ProjectID:          101,
			ReferenceFile:      "feature_dataset/0001 - gamma j.pdf",
		},
		{
			FeatureID:          3,
			FeatureTitle:       "Payment Gateway",
			FeatureDescription: "Handle online payments securely",
			FeatureType:        "System Feature",
			ProjectName:        "GAMMA-J Web Store",
			ProjectID:          101,
			ReferenceFile:      "feature_dataset/0002 - gamma j.pdf",
		},
		{
			FeatureID:          4,
			FeatureTitle:       "Inventory Management",
			FeatureDescription: "Track stock levels and update automatically",
			FeatureType:        "System Feature",
			ProjectName:        "GAMMA-J Web Store",
			ProjectID:          101,
			ReferenceFile:      "feature_dataset/0003 - gamma j.pdf",
		},
		{
			FeatureID:          5,
			FeatureTitle:       "Customer Reviews",
			FeatureDescription: "Allow customers to leave product reviews",
			FeatureType:        "System Feature",
			ProjectName:        "GAMMA-J Web Store",
			ProjectID:          101,
			ReferenceFile:      "feature_dataset/0004 - gamma j.pdf",
		},
	}

	provisions := []Provision{
		{
			ProvisionID:    1,
			ProvisionTitle: "Age Verification",
			ProvisionBody:  "Third party must not retain personal info.",
			ProvisionCode:  "2a",
			Country:        "SG",
			Region:         "APAC",
			RelevantLabels: []string{"Privacy", "PII"},
			LawCode:        "LAW001",
			ReferenceFile:  "law_dataset/20230SB976_91-1.pdf",
		},
		{
			ProvisionID:    2,
			ProvisionTitle: "Age Verification Usage",
			ProvisionBody:  "Personal info may not be used for other purposes.",
			ProvisionCode:  "2b",
			Country:        "SG",
			Region:         "APAC",
			RelevantLabels: []string{"Privacy"},
			LawCode:        "LAW001",
			ReferenceFile:  "law_dataset/20230SB976_91-1.pdf",
		},
		{
			ProvisionID:    3,
			ProvisionTitle: "Anonymous Info",
			ProvisionBody:  "Must keep anonymous any personal identifying info.",
			ProvisionCode:  "2c",
			Country:        "SG",
			Region:         "APAC",
			RelevantLabels: []string{"Privacy", "Anonymity"},
			LawCode:        "LAW001",
			ReferenceFile:  "law_dataset/20230SB976_91-1.pdf",
		},
		{
			ProvisionID:    4,
			ProvisionTitle: "Data Retention",
			ProvisionBody:  "Data must be deleted after 30 days.",
			ProvisionCode:  "3a",
			Country:        "SG",
			Region:         "APAC",
			RelevantLabels: []string{"Data Management"},
			LawCode:        "LAW002",
			ReferenceFile:  "law_dataset/20230SB977_91-1.pdf",
		},
		{
			ProvisionID:    5,
			ProvisionTitle: "Data Sharing",
			ProvisionBody:  "Data may only be shared with consent.",
			ProvisionCode:  "3b",
			Country:        "SG",
			Region:         "APAC",
			RelevantLabels: []string{"Data Management", "Consent"},
			LawCode:        "LAW002",
			ReferenceFile:  "law_dataset/20230SB977_91-1.pdf",
		},
	}

	postURL := fmt.Sprintf("%s/feature", baseURL)

	for _, feature := range features {
		payload, _ := json.Marshal(feature)
		resp, err := http.Post(postURL, "application/json", bytes.NewBuffer(payload))
		if err != nil {
			fmt.Println("Error posting feature:", err)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		fmt.Println("POST /feature response:", resp.Status)
		fmt.Println(string(body))
		resp.Body.Close()
	}

	for _, p := range provisions {
		payload, _ := json.Marshal(p)
		resp, err := http.Post(fmt.Sprintf("%s/provision", baseURL), "application/json", bytes.NewBuffer(payload))
		if err != nil {
			fmt.Println("Error posting provision:", err)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		fmt.Println("POST /provision response:", resp.Status)
		fmt.Println(string(body))
		resp.Body.Close()
	}


	// --- GET /features ---
	getURL := fmt.Sprintf("%s/features", baseURL)
	respList, err := http.Get(getURL)
	if err != nil {
		fmt.Println("Error getting features:", err)
		return
	}
	defer respList.Body.Close()
	listBody, _ := io.ReadAll(respList.Body)
	fmt.Println("\nGET /features response:", respList.Status)
	fmt.Println(string(listBody))

	// --- GET /provisions ---
	provisionsURL := fmt.Sprintf("%s/provisions", baseURL)
	respProv, err := http.Get(provisionsURL)
	if err != nil {
		fmt.Println("Error getting provisions:", err)
		return
	}
	defer respProv.Body.Close()
	provBody, _ := io.ReadAll(respProv.Body)
	fmt.Println("\nGET /provisions response:", respProv.Status)
	fmt.Println(string(provBody))

	
}
