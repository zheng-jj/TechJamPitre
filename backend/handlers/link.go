package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateLink inserts a new feature-provision link
func CreateLink(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var link models.FeatureProvisionLink
		if err := json.NewDecoder(r.Body).Decode(&link); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := db.Collection("feature_provision_link").InsertOne(ctx, link)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				http.Error(w, "Link already exists", http.StatusConflict)
				return
			}
			
			http.Error(w, "Failed to create link: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(link)
	}
}

// GetProvisionsByFeature retrieves all provisions linked to a feature
func GetProvisionsByFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("feature_id")
		if idStr == "" {
			http.Error(w, "Missing feature_id parameter", http.StatusBadRequest)
			return
		}
		featureID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid feature_id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := db.Collection("feature_provision_link").Find(ctx, bson.M{"feature_id": featureID})
		if err != nil {
			http.Error(w, "Failed to query links: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		var results []models.FeatureProvisionLink
		if err := cursor.All(ctx, &results); err != nil {
			http.Error(w, "Failed to read results: "+err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(results)
	}
}

// GetFeaturesByProvision retrieves all features linked to a provision
func GetFeaturesByProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("provision_id")
		if idStr == "" {
			http.Error(w, "Missing provision_id parameter", http.StatusBadRequest)
			return
		}
		provisionID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid provision_id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := db.Collection("feature_provision_link").Find(ctx, bson.M{"provision_id": provisionID})
		if err != nil {
			http.Error(w, "Failed to query links: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		var results []models.FeatureProvisionLink
		if err := cursor.All(ctx, &results); err != nil {
			http.Error(w, "Failed to read results: "+err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(results)
	}
}

// UpdateLink updates an existing link document
func UpdateLink(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		linkID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		var updateData bson.M
		if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		res, err := db.Collection("feature_provision_link").UpdateOne(ctx, bson.M{"_id": linkID}, bson.M{"$set": updateData})
		if err != nil {
			http.Error(w, "Failed to update link: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if res.MatchedCount == 0 {
			http.Error(w, "Link not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(updateData)
	}
}

func DeleteLinksByFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("feature_id")
		if idStr == "" {
			http.Error(w, "Missing feature_id parameter", http.StatusBadRequest)
			return
		}
		featureID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid feature_id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		res, err := db.Collection("feature_provision_link").DeleteMany(ctx, bson.M{"feature_id": featureID})
		if err != nil {
			http.Error(w, "Failed to delete links: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"deleted_count": res.DeletedCount,
			"message":       "Links deleted successfully",
		})
	}
}

func DeleteLinksByProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("provision_id")
		if idStr == "" {
			http.Error(w, "Missing provision_id parameter", http.StatusBadRequest)
			return
		}
		provisionID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid provision_id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		res, err := db.Collection("feature_provision_link").DeleteMany(ctx, bson.M{"provision_id": provisionID})
		if err != nil {
			http.Error(w, "Failed to delete links: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"deleted_count": res.DeletedCount,
			"message":       "Links deleted successfully",
		})
	}
}
