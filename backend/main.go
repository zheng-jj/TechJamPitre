package main

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
	"strconv"
	"strings"
)

type Law struct {
    ID          int      `json:"id"`
    Country     string   `json:"country"`
    Region      string   `json:"region"`
    Law         string   `json:"law"`
    Description string   `json:"law_description"`
    Labels      []string `json:"relevant_labels"`
    Source      string   `json:"source"`
}

type Feature struct {
    ID          int      `json:"id"`
    Name        string   `json:"feature_name"`
    Type        string   `json:"feature_type"`
    Description string   `json:"feature_description"`
    Labels      []string `json:"relevant_labels"`
    Source      string   `json:"source"`
}


// Mappings for compliance links
var featureDataset = []Feature{}
var lawDataset = []Law{}


type UploadResponse struct {
	Type     string      `json:"type"`
	Conflict interface{} `json:"conflict"`
	Message  string      `json:"message"`
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(20 << 20) // 20 MB limit
	if err != nil {
		http.Error(w, "Error parsing form: "+err.Error(), http.StatusBadRequest)
		return
	}

	uploadType := r.FormValue("type")
	if uploadType != "law" && uploadType != "feature" {
		http.Error(w, "Invalid type, must be 'law' or 'feature'", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving the file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(handler.Filename), ".pdf") {
		http.Error(w, "Only PDF files allowed", http.StatusBadRequest)
		return
	}

	// save file to ./uploaded_files/<type> locally
	dir := "./uploaded_files/" + uploadType
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		http.Error(w, "Error creating directory", http.StatusInternalServerError)
		return
	}

	filePath := fmt.Sprintf("%s/%s", dir, handler.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error saving file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file: "+err.Error(), http.StatusInternalServerError)
		return
	}

    // forward to FastAPI
	var fastapiURL string
	if uploadType == "law" {
		fastapiURL = "http://localhost:8000/parse/law"
	} else {
		fastapiURL = "http://localhost:8000/parse/feature"
	}

    // reopen saved file
	f, err := os.Open(filePath)
	if err != nil {
		http.Error(w, "Error opening saved file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer f.Close()

	// build multipart request
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		http.Error(w, "Error creating form file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if _, err := io.Copy(part, f); err != nil {
		http.Error(w, "Error copying file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writer.Close()

	// send to FastAPI
	req, err := http.NewRequest("POST", fastapiURL, body)
	if err != nil {
		http.Error(w, "Error creating FastAPI request: "+err.Error(), http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Error calling FastAPI: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// read FastAPI response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error reading FastAPI response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// forward FastAPI JSON back to frontend
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)

	log.Printf("Uploaded %s PDF: %s → parsed by FastAPI\n", uploadType, handler.Filename)


	// // TODO: detect conflicts — currently just empty array
	// resp := UploadResponse{
	// 	Type:     uploadType,
	// 	Conflict: []string{}, 
	// 	Message:  "feature uploaded successfully",
	// }

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(resp)

	// log.Printf("Uploaded %s PDF: %s\n", uploadType, handler.Filename)
}

func uploadLawHandler(w http.ResponseWriter, r *http.Request) {
    uploadHandler(w, r)
}

func uploadFeatureHandler(w http.ResponseWriter, r *http.Request) {
    uploadHandler(w, r)
}



// ====== Feature Handlers ======

func deleteFeatureHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	for i, f := range featureDataset {
		if f.ID == id {
			featureDataset = append(featureDataset[:i], featureDataset[i+1:]...)
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, "Feature %d deleted", id)
			return
		}
	}
	http.Error(w, "Feature not found", http.StatusNotFound)
}

func putFeatureHandler(w http.ResponseWriter, r *http.Request) {
	var updated Feature
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	for i, f := range featureDataset {
		if f.ID == updated.ID {
			featureDataset[i] = updated
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updated)
			return
		}
	}
	http.Error(w, "Feature not found", http.StatusNotFound)
}

func listFeaturesHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(featureDataset)
}

// ====== Law Handlers ======

func deleteLawHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	for i, l := range lawDataset {
		if l.ID == id {
			lawDataset = append(lawDataset[:i], lawDataset[i+1:]...)
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, "Law %d deleted", id)
			return
		}
	}
	http.Error(w, "Law not found", http.StatusNotFound)
}

func putLawHandler(w http.ResponseWriter, r *http.Request) {
	var updated Law
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	for i, l := range lawDataset {
		if l.ID == updated.ID {
			lawDataset[i] = updated
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updated)
			return
		}
	}
	http.Error(w, "Law not found", http.StatusNotFound)
}


func listLawsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lawDataset)
}


func main() {
    http.HandleFunc("/upload/feature", uploadFeatureHandler)
    http.HandleFunc("/upload/law", uploadLawHandler)

    // upload
	http.HandleFunc("/api/upload", uploadHandler)

	// feature CRUD
	http.HandleFunc("/api/feature", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "DELETE":
			deleteFeatureHandler(w, r)
		case "PUT":
			putFeatureHandler(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// law CRUD
	http.HandleFunc("/api/law", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "DELETE":
			deleteLawHandler(w, r)
		case "PUT":
			putLawHandler(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// list endpoints
	http.HandleFunc("/api/features", listFeaturesHandler)
	http.HandleFunc("/api/laws", listLawsHandler)

	// serve static files under /files/
	fs := http.FileServer(http.Dir("./uploaded_files"))
	http.Handle("/files/", http.StripPrefix("/files/", fs))

    log.Println("Server running at :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
