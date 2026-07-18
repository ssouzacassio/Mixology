package handlers

import (
	"net/http"

	"mixology/mix_back/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) ListIngredients(c *gin.Context) {
	var ingredients []models.Ingredient
	if err := h.DB.Order("name").Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar insumos"})
		return
	}
	c.JSON(http.StatusOK, ingredients)
}

type ingredientInput struct {
	Name        string  `json:"name" binding:"required"`
	Unit        string  `json:"unit" binding:"required,oneof=ml g un"`
	MinQuantity float64 `json:"min_quantity"`
	CostPerUnit float64 `json:"cost_per_unit"`
}

func (h *Handler) CreateIngredient(c *gin.Context) {
	var input ingredientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ingredient := models.Ingredient{
		Name:        input.Name,
		Unit:        input.Unit,
		MinQuantity: input.MinQuantity,
		CostPerUnit: input.CostPerUnit,
	}

	if err := h.DB.Create(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar insumo"})
		return
	}

	c.JSON(http.StatusCreated, ingredient)
}

func (h *Handler) UpdateIngredient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var ingredient models.Ingredient
	if err := h.DB.First(&ingredient, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "insumo não encontrado"})
		return
	}

	var input ingredientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ingredient.Name = input.Name
	ingredient.Unit = input.Unit
	ingredient.MinQuantity = input.MinQuantity
	ingredient.CostPerUnit = input.CostPerUnit

	if err := h.DB.Save(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar insumo"})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

func (h *Handler) DeleteIngredient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := h.DB.Delete(&models.Ingredient{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover insumo"})
		return
	}

	c.Status(http.StatusNoContent)
}
