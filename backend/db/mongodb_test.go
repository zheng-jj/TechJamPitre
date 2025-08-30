package db

import (
	"context"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

func TestMongoConnection(t *testing.T) {
	client := ConnectMongo("mongodb://localhost:27017")
	defer client.Disconnect(nil)

	database := client.Database("compliance_db")
	collection := database.Collection("feature_provision_link")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	doc := bson.M{"feature_id": 1, "provision_id": 2}
	res, err := collection.InsertOne(ctx, doc)
	if err != nil {
		t.Fatal("Insert failed:", err)
	}
	t.Log("Inserted ID:", res.InsertedID)

	// Find test document
	var result bson.M
	err = collection.FindOne(ctx, bson.M{"feature_id": 1}).Decode(&result)
	if err != nil {
		t.Fatal("Find failed:", err)
	}
	t.Log("Found document:", result)

	// Clean up
	_, _ = collection.DeleteOne(ctx, bson.M{"feature_id": 1})
	t.Log("Test document deleted")
}
