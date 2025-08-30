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

// func CreateProvision(db *mongo.Database) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		var p models.Provision
// 		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
// 			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
// 			return
// 		}

// 		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// 		defer cancel()

// 		_, err := db.Collection("provision").InsertOne(ctx, p)
// 		if err != nil {
// 			http.Error(w, "Failed to insert provision: "+err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		w.WriteHeader(http.StatusCreated)
// 		json.NewEncoder(w).Encode(p)
// 	}
// }

func CreateProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)

		// Peek first token → check if object or array
		t, err := decoder.Token()
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		switch t {
		case json.Delim('['): // Array → InsertMany
			var provisions []models.Provision
			if err := decoder.Decode(&provisions); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			docs := make([]interface{}, len(provisions))
			for i, p := range provisions {
				docs[i] = p
			}

			_, err := db.Collection("provisions").InsertMany(context.TODO(), docs)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(provisions)

		default: // Single object → InsertOne
			var provision models.Provision
			if err := decoder.Decode(&provision); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			_, err := db.Collection("provisions").InsertOne(context.TODO(), provision)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(provision)
		}
	}
}

func ListProvisions(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := db.Collection("provision").Find(ctx, map[string]interface{}{})
		if err != nil {
			http.Error(w, "Failed to retrieve provisions: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(ctx)

		var provisions []models.Provision
		if err := cursor.All(ctx, &provisions); err != nil {
			http.Error(w, "Failed to read provisions: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(provisions)
	}
}

func GetProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		provisionID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var p models.Provision
		err = db.Collection("provision").FindOne(ctx, bson.M{"provision_id": provisionID}).Decode(&p)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "Provision not found", http.StatusNotFound)
			} else {
				http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(p)
	}
}

func UpdateProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		provisionID, err := strconv.Atoi(idStr)
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

		res, err := db.Collection("provision").UpdateOne(ctx, bson.M{"provision_id": provisionID}, bson.M{"$set": updateData})
		if err != nil {
			http.Error(w, "Failed to update provision: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if res.MatchedCount == 0 {
			http.Error(w, "Provision not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(updateData)
	}
}

func DeleteProvision(db *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		provisionID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		res, err := db.Collection("provision").DeleteOne(ctx, bson.M{"provision_id": provisionID})
		if err != nil {
			http.Error(w, "Failed to delete provision: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if res.DeletedCount == 0 {
			http.Error(w, "Provision not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Provision deleted successfully"}`))
	}
}
