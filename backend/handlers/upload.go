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
		FeatureID:          1,
		FeatureTitle:       "Login Feature",
		FeatureDescription: "Allows users to log in securely",
		FeatureType:        "Security",
		ProjectName:        "Auth System",
		ReferenceFile:      "login.pdf",
		ProjectID:          101,
	}
	feature2 := models.Feature{
		FeatureID:          2,
		FeatureTitle:       "Signup Feature",
		FeatureDescription: "Allows new users to register",
		FeatureType:        "Onboarding",
		ProjectName:        "Auth System",
		ReferenceFile:      "signup.pdf",
		ProjectID:          101,
	}

	// Hardcoded provisions (for conflicts)
	provision1 := models.ReasoningProvision{
		ProvisionID:    1,
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
		ProvisionID:    2,
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
		ProvisionID:    3,
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
		ProvisionID:    4,
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

	_, statusCode, err := forwardToFastAPI(filePath, "http://localhost:8000/parse/law")
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


	log.Printf("Uploaded law PDF: %s → parsed by FastAPI\n", filepath.Base(filePath))
}
