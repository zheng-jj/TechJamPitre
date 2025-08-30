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

func CreateFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var f models.Feature
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := db.Collection("feature").InsertOne(ctx, f)
		if err != nil {
			http.Error(w, "Failed to insert feature: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(f)
	}
}

func ListFeatures(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := db.Collection("feature").Find(ctx, map[string]interface{}{})
		if err != nil {
			http.Error(w, "Failed to retrieve features: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		var features []models.Feature
		if err := cursor.All(ctx, &features); err != nil {
			http.Error(w, "Failed to read features: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(features)
	}
}

func GetFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		featureID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var f models.Feature
		err = db.Collection("feature").FindOne(ctx, bson.M{"feature_id": featureID}).Decode(&f)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "Feature not found", http.StatusNotFound)
			} else {
				http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(f)
	}
}

func UpdateFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		featureID, err := strconv.Atoi(idStr)
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

		res, err := db.Collection("feature").UpdateOne(ctx, bson.M{"feature_id": featureID}, bson.M{"$set": updateData})
		if err != nil {
			http.Error(w, "Failed to update feature: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if res.MatchedCount == 0 {
			http.Error(w, "Feature not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(updateData)
	}
}

func DeleteFeature(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		featureID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		res, err := db.Collection("feature").DeleteOne(ctx, bson.M{"feature_id": featureID})
		if err != nil {
			http.Error(w, "Failed to delete feature: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if res.DeletedCount == 0 {
			http.Error(w, "Feature not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Feature deleted successfully"}`))
	}
}
