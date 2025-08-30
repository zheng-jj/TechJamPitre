package handlers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

	respBody, statusCode, err := forwardToFastAPI(filePath, "http://localhost:8000/parse/feature")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(respBody)

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

	respBody, statusCode, err := forwardToFastAPI(filePath, "http://localhost:8000/parse/law")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(respBody)

	log.Printf("Uploaded law PDF: %s → parsed by FastAPI\n", filepath.Base(filePath))
}
