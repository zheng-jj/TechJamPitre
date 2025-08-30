package main

import (
	"log"
	"net/http"

	"backend/db"
	"backend/handlers"
)

func main() {
	// Connect to MongoDB
	client := db.ConnectMongo("mongodb://localhost:27017")
	defer client.Disconnect(nil)
	database := client.Database("compliance_db")

	// Setup unique index for links
	db.SetupLinkUniqueIndex(database)

	// Upload endpoints
	http.HandleFunc("/upload/feature", handlers.UploadFeatureHandler)
	http.HandleFunc("/upload/law", handlers.UploadLawHandler)

	// Feature CRUD
	http.HandleFunc("/features", handlers.ListFeatures(database))
	http.HandleFunc("/feature", handlers.CreateFeature(database))
	http.HandleFunc("/feature/get", handlers.GetFeature(database))
	http.HandleFunc("/feature/update", handlers.UpdateFeature(database))
	http.HandleFunc("/feature/delete", handlers.DeleteFeature(database))

	// Provision CRUD
	http.HandleFunc("/provisions", handlers.ListProvisions(database))
	http.HandleFunc("/provision", handlers.CreateProvision(database))
	http.HandleFunc("/provision/get", handlers.GetProvision(database))
	http.HandleFunc("/provision/update", handlers.UpdateProvision(database))
	http.HandleFunc("/provision/delete", handlers.DeleteProvision(database))

	// Feature-Provision Link CRUD
	http.HandleFunc("/link", handlers.CreateLink(database))
	http.HandleFunc("/link/get/provisions", handlers.GetProvisionsByFeature(database))
	http.HandleFunc("/link/get/features", handlers.GetFeaturesByProvision(database))
	http.HandleFunc("/link/update", handlers.UpdateLink(database))
	http.HandleFunc("/link/delete/features", handlers.DeleteLinksByFeature(database))
	http.HandleFunc("/link/delete/provisions", handlers.DeleteLinksByProvision(database))

	// Serve uploaded files
	fs := http.FileServer(http.Dir("./uploaded_files"))
	http.Handle("/files/", http.StripPrefix("/files/", fs))

	log.Println("Server running at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
