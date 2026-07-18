package handlers

import (
	"net/http"

	"mixology/mix_back/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) ListProducts(c *gin.Context) {
	var products []models.Product
	if err := h.DB.Order("name").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar produtos"})
		return
	}
	c.JSON(http.StatusOK, products)
}

type productInput struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Price       float64 `json:"price" binding:"required,gt=0"`
}

func (h *Handler) CreateProduct(c *gin.Context) {
	var input productInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product := models.Product{
		Name:        input.Name,
		Description: input.Description,
		Category:    input.Category,
		Price:       input.Price,
		IsActive:    true,
	}

	if err := h.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar produto"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var product models.Product
	if err := h.DB.First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produto não encontrado"})
		return
	}

	var input productInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product.Name = input.Name
	product.Description = input.Description
	product.Category = input.Category
	product.Price = input.Price

	if err := h.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar produto"})
		return
	}

	c.JSON(http.StatusOK, product)
}

func (h *Handler) DeleteProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := h.DB.Delete(&models.Product{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover produto"})
		return
	}

	c.Status(http.StatusNoContent)
}

type recipeInput struct {
	Items []struct {
		IngredientID uuid.UUID `json:"ingredient_id" binding:"required"`
		Quantity     float64   `json:"quantity" binding:"required,gt=0"`
	} `json:"items" binding:"required"`
}

func (h *Handler) SetProductRecipe(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var input recipeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", productID).Delete(&models.RecipeItem{}).Error; err != nil {
			return err
		}
		for _, item := range input.Items {
			recipeItem := models.RecipeItem{
				ProductID:    productID,
				IngredientID: item.IngredientID,
				Quantity:     item.Quantity,
			}
			if err := tx.Create(&recipeItem).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao salvar receita"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *Handler) GetProductRecipe(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var items []models.RecipeItem
	if err := h.DB.Preload("Ingredient").Where("product_id = ?", productID).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao buscar receita"})
		return
	}

	c.JSON(http.StatusOK, items)
}
