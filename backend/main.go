package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
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
var lawFeatureLinks = map[string][]string{} // lawID -> []feature names

func uploadFeatureHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    var feature Feature
    body, _ := ioutil.ReadAll(r.Body)
    if err := json.Unmarshal(body, &feature); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    featureDataset = append(featureDataset, feature)
    
    // TODO: Call RAG retrieval + agent inference here
    // For now, just respond successfully
    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Feature uploaded and processed!")
	log.Printf("Current features: %+v\n", featureDataset)

}

func uploadLawHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    var law Law
    body, _ := ioutil.ReadAll(r.Body)
    if err := json.Unmarshal(body, &law); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    lawDataset = append(lawDataset, law)
    
    // TODO: Call RAG retrieval + agent inference here
    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Law uploaded and processed!")
	log.Printf("Current laws: %+v\n", lawDataset)
}

func listFeaturesHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(featureDataset)
}

func listLawsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lawDataset)
}

func main() {
    http.HandleFunc("/upload/feature", uploadFeatureHandler)
    http.HandleFunc("/upload/law", uploadLawHandler)
	http.HandleFunc("/features", listFeaturesHandler)
	http.HandleFunc("/laws", listLawsHandler)

    log.Println("Server running at :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
