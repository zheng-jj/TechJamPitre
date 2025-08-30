package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func uploadFile(url, paramName, path string) (*http.Response, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Create a buffer to write our multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Attach the file
	part, err := writer.CreateFormFile(paramName, file.Name())
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return nil, err
	}

	writer.Close()

	// Create request
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	return client.Do(req)
}

func main() {
	// Example PDF files to upload
	lawPDF := "D:/DownloadsDD/20230SB976_91-1.pdf"
	featurePDF := "D:/DownloadsDD/2009 - model manager.pdf"

	// Upload to /upload/law
	resp, err := uploadFile("http://127.0.0.1:8000/upload/law", "file", lawPDF)
	if err != nil {
		fmt.Println("Error uploading law PDF:", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Law API Response:", resp.Status)
	fmt.Println(string(body))

	// Upload to /upload/feature
	resp2, err := uploadFile("http://127.0.0.1:8000/upload/feature", "file", featurePDF)
	if err != nil {
		fmt.Println("Error uploading feature PDF:", err)
		return
	}
	defer resp2.Body.Close()
	body2, _ := io.ReadAll(resp2.Body)
	fmt.Println("Feature API Response:", resp2.Status)
	fmt.Println(string(body2))
}
