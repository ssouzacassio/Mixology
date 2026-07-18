package main

import (
	"log"

	"mixology/mix_back/internal/config"
	"mixology/mix_back/internal/database"
	"mixology/mix_back/internal/handlers"
	"mixology/mix_back/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)
	h := handlers.New(db, cfg.JWTSecret)

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowedOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := router.Group("/api")
	api.POST("/auth/register", h.Register)
	api.POST("/auth/login", h.Login)

	authorized := api.Group("")
	authorized.Use(middleware.RequireAuth(cfg.JWTSecret))

	authorized.GET("/products", h.ListProducts)
	authorized.POST("/products", h.CreateProduct)
	authorized.PUT("/products/:id", h.UpdateProduct)
	authorized.DELETE("/products/:id", middleware.RequireRole("admin"), h.DeleteProduct)
	authorized.GET("/products/:id/recipe", h.GetProductRecipe)
	authorized.PUT("/products/:id/recipe", h.SetProductRecipe)

	authorized.GET("/ingredients", h.ListIngredients)
	authorized.POST("/ingredients", h.CreateIngredient)
	authorized.PUT("/ingredients/:id", h.UpdateIngredient)
	authorized.DELETE("/ingredients/:id", middleware.RequireRole("admin"), h.DeleteIngredient)

	authorized.GET("/stock-movements", h.ListStockMovements)
	authorized.POST("/stock-movements", h.CreateStockMovement)

	authorized.POST("/cash-registers/open", h.OpenCashRegister)
	authorized.GET("/cash-registers/current", h.CurrentCashRegister)
	authorized.POST("/cash-registers/:id/close", h.CloseCashRegister)

	authorized.GET("/sales", h.ListSales)
	authorized.POST("/sales", h.CreateSale)

	log.Printf("API rodando na porta %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("falha ao iniciar servidor: %v", err)
	}
}
