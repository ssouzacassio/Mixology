package handlers

import (
	"net/http"

	"mixology/mix_back/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) ListStockMovements(c *gin.Context) {
	var movements []models.StockMovement
	if err := h.DB.Order("created_at desc").Find(&movements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar movimentações"})
		return
	}
	c.JSON(http.StatusOK, movements)
}

type stockMovementInput struct {
	IngredientID uuid.UUID `json:"ingredient_id" binding:"required"`
	Type         string    `json:"type" binding:"required,oneof=entrada saida ajuste"`
	Quantity     float64   `json:"quantity" binding:"required,gt=0"`
	Reason       string    `json:"reason"`
}

func (h *Handler) CreateStockMovement(c *gin.Context) {
	var input stockMovementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := userID.(uuid.UUID)

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var ingredient models.Ingredient
		if err := tx.First(&ingredient, "id = ?", input.IngredientID).Error; err != nil {
			return err
		}

		delta := input.Quantity
		if input.Type == "saida" {
			delta = -delta
		}

		if err := tx.Model(&ingredient).
			UpdateColumn("stock_quantity", gorm.Expr("stock_quantity + ?", delta)).Error; err != nil {
			return err
		}

		movement := models.StockMovement{
			IngredientID: input.IngredientID,
			Type:         input.Type,
			Quantity:     input.Quantity,
			Reason:       input.Reason,
			CreatedBy:    &userUUID,
		}
		return tx.Create(&movement).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao registrar movimentação"})
		return
	}

	c.Status(http.StatusCreated)
}
