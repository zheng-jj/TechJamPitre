package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/db"
	"backend/models"
	"go.mongodb.org/mongo-driver/mongo"
)

var testDB *mongo.Database

func setupTestDB(t *testing.T) *mongo.Database {
	client := db.ConnectMongo("mongodb://localhost:27017")
	t.Cleanup(func() {
		client.Disconnect(context.Background())
	})

	database := client.Database("test_compliance_db")
	database.Collection("feature_provision_link").Drop(context.Background())
	return database
}

func TestMultipleLinks(t *testing.T) {
	testDB = setupTestDB(t)
	_, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// ---------- 1️⃣ Create multiple links ----------
	links := []models.FeatureProvisionLink{
		{FeatureID: 1, ProvisionID: 101},
		{FeatureID: 1, ProvisionID: 102},
		{FeatureID: 1, ProvisionID: 103},
		{FeatureID: 2, ProvisionID: 101},
		{FeatureID: 3, ProvisionID: 101},
	}

	for _, l := range links {
		body, _ := json.Marshal(l)
		req := httptest.NewRequest("POST", "/link", bytes.NewReader(body))
		w := httptest.NewRecorder()
		CreateLink(testDB)(w, req)
		if w.Result().StatusCode != http.StatusCreated {
			t.Fatalf("Failed to create link %+v, status %d", l, w.Result().StatusCode)
		}
		t.Logf("✅ Created link: %+v", l)
	}

	// ---------- 2️⃣ Get provisions for FeatureID 1 ----------
	req := httptest.NewRequest("GET", "/link/get/provisions?feature_id=1", nil)
	w := httptest.NewRecorder()
	GetProvisionsByFeature(testDB)(w, req)

	var provisions []models.FeatureProvisionLink
	if err := json.NewDecoder(w.Body).Decode(&provisions); err != nil {
		t.Fatalf("Failed to decode GetProvisionsByFeature: %v", err)
	}
	t.Logf("Provisions for FeatureID 1: %+v", provisions)

	if len(provisions) != 3 {
		t.Fatalf("Expected 3 provisions for feature 1, got %d", len(provisions))
	}

	// ---------- 3️⃣ Get features for ProvisionID 101 ----------
	req = httptest.NewRequest("GET", "/link/get/features?provision_id=101", nil)
	w = httptest.NewRecorder()
	GetFeaturesByProvision(testDB)(w, req)

	var features []models.FeatureProvisionLink
	if err := json.NewDecoder(w.Body).Decode(&features); err != nil {
		t.Fatalf("Failed to decode GetFeaturesByProvision: %v", err)
	}
	t.Logf("Features for ProvisionID 101: %+v", features)

	if len(features) != 3 {
		t.Fatalf("Expected 3 features for provision 101, got %d", len(features))
	}

	// ---------- 4️⃣ Delete links by FeatureID 1 ----------
	req = httptest.NewRequest("DELETE", "/link/delete/features?feature_id=1", nil)
	w = httptest.NewRecorder()
	DeleteLinksByFeature(testDB)(w, req)

	var delResp map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&delResp); err != nil {
		t.Fatalf("Failed to decode DeleteLinksByFeature: %v", err)
	}
	t.Logf("Deleted links by FeatureID 1: %+v", delResp)

	if delResp["deleted_count"].(float64) != 3 {
		t.Fatalf("Expected deleted_count 3, got %v", delResp["deleted_count"])
	}

	// ---------- 5️⃣ Delete links by ProvisionID 101 ----------
	req = httptest.NewRequest("DELETE", "/link/delete/provisions?provision_id=101", nil)
	w = httptest.NewRecorder()
	DeleteLinksByProvision(testDB)(w, req)

	if err := json.NewDecoder(w.Body).Decode(&delResp); err != nil {
		t.Fatalf("Failed to decode DeleteLinksByProvision: %v", err)
	}
	t.Logf("Deleted links by ProvisionID 101: %+v", delResp)

	if delResp["deleted_count"].(float64) != 2 {
		t.Fatalf("Expected deleted_count 2, got %v", delResp["deleted_count"])
	}
}
