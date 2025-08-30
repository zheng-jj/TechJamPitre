package db

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupLinkUniqueIndex(database *mongo.Database) {
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "feature_id", Value: 1}, {Key: "provision_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	_, err := database.Collection("feature_provision_link").Indexes().CreateOne(context.Background(), indexModel)
	if err != nil {
		log.Fatal("Failed to create link index:", err)
	}
	log.Println("✅ feature_provision_link unique index created")
}
