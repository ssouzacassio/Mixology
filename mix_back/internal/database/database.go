package database

import (
	"log"

	"mixology/mix_back/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("falha ao conectar no banco: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Ingredient{},
		&models.RecipeItem{},
		&models.CashRegister{},
		&models.Sale{},
		&models.SaleItem{},
		&models.StockMovement{},
	)
	if err != nil {
		log.Fatalf("falha ao migrar banco: %v", err)
	}

	return db
}
