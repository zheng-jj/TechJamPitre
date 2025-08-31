package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"backend/models"
)

type UploadLawResponse struct {
	Conflict struct {
		Features []models.ReasoningFeature `json:"features"`
	} `json:"conflict"`
	ParsedLaw string `json:"parsed_law"` // still JSON string, will need unmarshal
}

// ---------------- Helper Function ----------------
// Handles the common logic: parse form, validate PDF, save file locally
func saveUploadedFile(r *http.Request, uploadType string) (string, error) {
	err := r.ParseMultipartForm(20 << 20) // 20 MB limit
	if err != nil {
		return "", fmt.Errorf("error parsing form: %w", err)
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		return "", fmt.Errorf("error retrieving the file: %w", err)
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(handler.Filename), ".pdf") {
		return "", fmt.Errorf("only PDF files allowed")
	}

	dir := "./uploaded_files/" + uploadType
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return "", fmt.Errorf("error creating directory: %w", err)
	}

	filePath := fmt.Sprintf("%s/%s", dir, handler.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("error saving file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("error saving file: %w", err)
	}

	return filePath, nil
}

// ---------------- FastAPI Call Helper ----------------
func forwardToFastAPI(filePath, fastapiURL string) ([]byte, int, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, 0, fmt.Errorf("error opening saved file: %w", err)
	}
	defer f.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, 0, fmt.Errorf("error creating form file: %w", err)
	}
	if _, err := io.Copy(part, f); err != nil {
		return nil, 0, fmt.Errorf("error copying file: %w", err)
	}
	writer.Close()

	req, err := http.NewRequest("POST", fastapiURL, body)
	if err != nil {
		return nil, 0, fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("error calling FastAPI: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("error reading FastAPI response: %w", err)
	}

	return respBody, resp.StatusCode, nil
}

// ---------------- Upload Feature ----------------
func UploadFeatureHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filePath, err := saveUploadedFile(r, "feature")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// respBody
	_, statusCode, err := forwardToFastAPI(filePath, "http://localhost:8000/parse/feature")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Hardcoded features
	feature1 := models.Feature{
		FeatureID:          "1",
		FeatureTitle:       "Login Feature",
		FeatureDescription: "Allows users to log in securely",
		FeatureType:        "Security",
		ProjectName:        "Auth System",
		ReferenceFile:      "login.pdf",
		ProjectID:          "101",
	}
	feature2 := models.Feature{
		FeatureID:          "2",
		FeatureTitle:       "Signup Feature",
		FeatureDescription: "Allows new users to register",
		FeatureType:        "Onboarding",
		ProjectName:        "Auth System",
		ReferenceFile:      "signup.pdf",
		ProjectID:          "101",
	}

	// Hardcoded provisions (for conflicts)
	provision1 := models.ReasoningProvision{
		ProvisionID:    "1",
		ProvisionTitle: "Section 1",
		ProvisionBody:  "User data must be encrypted",
		ProvisionCode:  "LAW101",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"encryption", "security"},
		LawCode:        "PDPA-101",
		ReferenceFile:  "law1.pdf",
		Reasoning:      "Encryption ensures confidentiality",
	}
	provision2 := models.ReasoningProvision{
		ProvisionID:    "2",
		ProvisionTitle: "Section 2",
		ProvisionBody:  "Users must consent to terms",
		ProvisionCode:  "LAW102",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"consent", "privacy"},
		LawCode:        "PDPA-102",
		ReferenceFile:  "law2.pdf",
		Reasoning:      "Consent ensures lawful processing",
	}
	provision3 := models.ReasoningProvision{
		ProvisionID:    "3",
		ProvisionTitle: "Section 3",
		ProvisionBody:  "Store minimal personal data",
		ProvisionCode:  "LAW103",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"data minimization"},
		LawCode:        "PDPA-103",
		ReferenceFile:  "law3.pdf",
		Reasoning:      "Minimization reduces risk",
	}
	provision4 := models.ReasoningProvision{
		ProvisionID:    "4",
		ProvisionTitle: "Section 4",
		ProvisionBody:  "Provide right to data deletion",
		ProvisionCode:  "LAW104",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"right to erasure"},
		LawCode:        "PDPA-104",
		ReferenceFile:  "law4.pdf",
		Reasoning:      "Users must have control of their data",
	}

	// ----- conflict mapping: featureID → provisions -----
	conflictMap := map[string][]models.ReasoningProvision{
		"201": {provision1, provision2}, // feature1 conflicts with provision1/provision2
		"202": {provision3, provision4}, // feature2 conflicts with provision3/provision4
	}

	// Construct response
	response := map[string]interface{}{
		"type":     "feature",
		"features": []models.Feature{feature1, feature2},
		"conflict": []map[string][]models.ReasoningProvision{conflictMap},
		"message":  "feature uploaded successfully",
	}


	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)


	log.Printf("Uploaded feature PDF: %s → parsed by FastAPI\n", filepath.Base(filePath))
}

// ---------------- Upload Law ----------------
func UploadLawHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filePath, err := saveUploadedFile(r, "law")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respBody, statusCode, err := forwardToFastAPI(filePath, "http://localhost:8000/upload/law")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	// Hardcoded provisions 
	provision1 := models.Provision{
		ProvisionID:    1,
		ProvisionTitle: "Section 1",
		ProvisionBody:  "Users must consent before data collection",
		ProvisionCode:  "LAW201",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"consent", "privacy"},
		LawCode:        "PDPA-201",
		ReferenceFile:  "law1.pdf",
	}
	provision2 := models.Provision{
		ProvisionID:    2,
		ProvisionTitle: "Section 2",
		ProvisionBody:  "Data must be stored securely",
		ProvisionCode:  "LAW202",
		Country:        "SG",
		Region:         "APAC",
		RelevantLabels: []string{"security", "storage"},
		LawCode:        "PDPA-202",
		ReferenceFile:  "law2.pdf",
	}

	// Hardcoded features
	feature1 := models.ReasoningFeature{
		FeatureID:          101,
		FeatureTitle:       "Login Feature",
		FeatureDescription: "Secure login with multi-factor authentication",
		FeatureType:        "Security",
		ProjectName:        "Auth System",
		ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
		ProjectID:          1001,
		Reasoning:          "Multi-factor authentication enhances security",
	}
	feature2 := models.ReasoningFeature{
		FeatureID:          102,
		FeatureTitle:       "Signup Feature",
		FeatureDescription: "User registration with email verification",
		FeatureType:        "Onboarding",
		ProjectName:        "Auth System",
		ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
		ProjectID:          1001,
		Reasoning:          "Email verification is essential for account security",
	}
	feature3 := models.ReasoningFeature{
		FeatureID:          103,
		FeatureTitle:       "Profile Feature",
		FeatureDescription: "User profile management and preferences",
		FeatureType:        "User Management",
		ProjectName:        "Auth System",
		ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
		ProjectID:          1001,
		Reasoning:          "User profile management enhances user experience",
	}
	feature4 := models.ReasoningFeature{
		FeatureID:          104,
		FeatureTitle:       "Notification Feature",
		FeatureDescription: "System notifications and alerts",
		FeatureType:        "Communication",
		ProjectName:        "Auth System",
		ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
		ProjectID:          1001,
		Reasoning:          "System notifications keep users informed",
	}

	conflictMap := map[string][]models.ReasoningFeature{
		// keys are provision IDs as strings
		"1": {feature1, feature2}, // provision 1 conflicts with feature1/2
		"2": {feature3, feature4}, // provision 2 conflicts with feature3/4
	}

	// Construct response
	response := map[string]interface{}{
		"type":       "law",
		"provisions": []models.Provision{provision1, provision2},
		"conflict":   []map[string][]models.ReasoningFeature{conflictMap}, // keep as slice for same shape as your spec
		"message":    "law uploaded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
		// return 200 OK with the mocked JSON
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var provisions []models.Provision
	lines := strings.Split(fastResp.ParsedLaw, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var p models.ProvisionRaw
		if err := json.Unmarshal([]byte(line), &p); err != nil {
			log.Printf("warning: failed to unmarshal provision: %v", err)
			continue
		}

		// Convert RelevantLabels from string to []string
		labels := strings.Split(p.RelevantLabels, ",")
		for i := range labels {
			labels[i] = strings.TrimSpace(labels[i])
		}


		provisions = append(provisions, models.Provision{
			ProvisionID:    p.ProvisionID,
			ProvisionTitle: p.ProvisionTitle,
			ProvisionBody:  p.ProvisionBody,
			ProvisionCode:  p.ProvisionCode,
			Country:        p.Country,
			Region:         p.Region,
			RelevantLabels: labels,
			LawCode:        p.LawCode,
			ReferenceFile:  p.ReferenceFile,
		})
	}


	// Collect all conflicted features into one slice
	allFeatures := []models.ReasoningFeature{}
	for _, f := range fastResp.Conflict.Features {
		allFeatures = append(allFeatures, f)
	}

	// Wrap into "0" key
	conflict := []map[string][]models.ReasoningFeature{
		{"0": allFeatures},
	}

	// Build final response
	response := map[string]interface{}{
		"type":       "law",
		"provisions": provisions,
		"conflict":   conflict,
		"message":    "law uploaded successfully",
	}
	

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode response: %v", err)
		return
	}

	log.Printf("Uploaded law PDF: %s → parsed by FastAPI\n", filepath.Base(filePath))

	// // --- Mocked response from FastAPI /upload/law ---
	// mockFastAPIResponse := `{
	// 	"features": [
	// 		{
	// 			"feature_title": "Customer Accounts",
	// 			"feature_description": "Customers will be able to create accounts to store their profiles, contact information, purchase history, and confirm orders. Security methods will ensure that customer accounts remain confidential and resistant to tampering. Customer profiles will also include payment information, such as the ability to store credit card information, and address information.",
	// 			"feature_id": "bb87387c-9abf-4486-968a-ee6062c4396d",
	// 			"feature_type": "System Feature",
	// 			"project_name": "GAMMA-J Web Store",
	// 			"project_id": "d4b6bc22-5511-42cb-ab82-e95099a4501e",
	// 			"reference_file": "feature_dataset/0000 - gamma j.pdf",
	// 			"reasoning": "The law mandates that a third party conducting anonymous age verification 'May not retain personal identifying information used to verify age once the age of an account holder or a person seeking an account has been verified' (2a), 'May not use personal identifying information used to verify age for any other purpose' (2b), and 'Must keep anonymous any personal identifying information used to verify age' (2c). The 'Customer Accounts' feature allows customers to 'store their profiles, contact information, purchase history, and confirm orders' and includes 'payment information' and 'address information'. If any of this stored personal identifying information is used for age verification, the feature's design of retaining and using this data in customer profiles directly conflicts with the law's requirements for non-retention and anonymity of PII used for age verification by a third party."
	// 		}
	// 	]
	// }`
	
	// // Parse the mocked response
	// var fastAPIResp struct {
	// 	Features []models.ReasoningFeature `json:"features"`
	// }
	// if err := json.Unmarshal([]byte(mockFastAPIResponse), &fastAPIResp); err != nil {
	// 	http.Error(w, "Failed to parse mocked FastAPI response: "+err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	// // Hardcoded provisions 
	// provision1 := models.Provision{
	// 	ProvisionID:    1,
	// 	ProvisionTitle: "Section 1",
	// 	ProvisionBody:  "Users must consent before data collection",
	// 	ProvisionCode:  "LAW201",
	// 	Country:        "SG",
	// 	Region:         "APAC",
	// 	RelevantLabels: []string{"consent", "privacy"},
	// 	LawCode:        "PDPA-201",
	// 	ReferenceFile:  "law1.pdf",
	// }
	// provision2 := models.Provision{
	// 	ProvisionID:    2,
	// 	ProvisionTitle: "Section 2",
	// 	ProvisionBody:  "Data must be stored securely",
	// 	ProvisionCode:  "LAW202",
	// 	Country:        "SG",
	// 	Region:         "APAC",
	// 	RelevantLabels: []string{"security", "storage"},
	// 	LawCode:        "PDPA-202",
	// 	ReferenceFile:  "law2.pdf",
	// }

	// // Hardcoded features
	// feature1 := models.ReasoningFeature{
	// 	FeatureID:          101,
	// 	FeatureTitle:       "Login Feature",
	// 	FeatureDescription: "Secure login with multi-factor authentication",
	// 	FeatureType:        "Security",
	// 	ProjectName:        "Auth System",
	// 	ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
	// 	ProjectID:          1001,
	// 	Reasoning:          "Multi-factor authentication enhances security",
	// }
	// feature2 := models.ReasoningFeature{
	// 	FeatureID:          102,
	// 	FeatureTitle:       "Signup Feature",
	// 	FeatureDescription: "User registration with email verification",
	// 	FeatureType:        "Onboarding",
	// 	ProjectName:        "Auth System",
	// 	ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
	// 	ProjectID:          1001,
	// 	Reasoning:          "Email verification is essential for account security",
	// }
	// feature3 := models.ReasoningFeature{
	// 	FeatureID:          103,
	// 	FeatureTitle:       "Profile Feature",
	// 	FeatureDescription: "User profile management and preferences",
	// 	FeatureType:        "User Management",
	// 	ProjectName:        "Auth System",
	// 	ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
	// 	ProjectID:          1001,
	// 	Reasoning:          "User profile management enhances user experience",
	// }
	// feature4 := models.ReasoningFeature{
	// 	FeatureID:          104,
	// 	FeatureTitle:       "Notification Feature",
	// 	FeatureDescription: "System notifications and alerts",
	// 	FeatureType:        "Communication",
	// 	ProjectName:        "Auth System",
	// 	ReferenceFile:      "feature_dataset/0000 - gamma j.pdf",
	// 	ProjectID:          1001,
	// 	Reasoning:          "System notifications keep users informed",
	// }

	// conflictMap := map[string][]models.ReasoningFeature{
	// 	// keys are provision IDs as strings
	// 	"1": {feature1, feature2}, // provision 1 conflicts with feature1/2
	// 	"2": {feature3, feature4}, // provision 2 conflicts with feature3/4
	// }

	// // Construct response
	// response := map[string]interface{}{
	// 	"type":       "law",
	// 	"provisions": []models.Provision{provision1, provision2},
	// 	"conflict":   []map[string][]models.ReasoningFeature{conflictMap}, // keep as slice for same shape as your spec
	// 	"message":    "law uploaded successfully",
	// }

	// w.Header().Set("Content-Type", "application/json")
	// w.WriteHeader(statusCode)
	// 	// return 200 OK with the mocked JSON
	// if err := json.NewEncoder(w).Encode(response); err != nil {
	// 	http.Error(w, "failed to encode response: "+err.Error(), http.StatusInternalServerError)
	// 	return
	// }


	// log.Printf("Uploaded law PDF: %s → parsed by FastAPI\n", filepath.Base(filePath))
}
