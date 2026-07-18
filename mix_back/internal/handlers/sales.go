package handlers

import (
	"errors"
	"net/http"

	"mixology/mix_back/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type saleItemInput struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Quantity  float64   `json:"quantity" binding:"required,gt=0"`
}

type saleInput struct {
	PaymentMethod string          `json:"payment_method" binding:"required,oneof=dinheiro debito credito pix"`
	Items         []saleItemInput `json:"items" binding:"required,min=1"`
}

// CreateSale registra uma venda, seus itens, e abate automaticamente do
// estoque os insumos usados na receita de cada produto vendido.
func (h *Handler) CreateSale(c *gin.Context) {
	var input saleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := userID.(uuid.UUID)

	var sale models.Sale

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var cash models.CashRegister
		if err := tx.Where("status = ?", "aberto").First(&cash).Error; err != nil {
			return errors.New("nenhum caixa aberto")
		}

		sale = models.Sale{
			CashRegisterID: cash.ID,
			CreatedBy:      userUUID,
			PaymentMethod:  input.PaymentMethod,
		}
		if err := tx.Create(&sale).Error; err != nil {
			return err
		}

		var total float64

		for _, item := range input.Items {
			var product models.Product
			if err := tx.First(&product, "id = ?", item.ProductID).Error; err != nil {
				return errors.New("produto não encontrado")
			}

			saleItem := models.SaleItem{
				SaleID:    sale.ID,
				ProductID: product.ID,
				Quantity:  item.Quantity,
				UnitPrice: product.Price,
			}
			if err := tx.Create(&saleItem).Error; err != nil {
				return err
			}
			total += product.Price * item.Quantity

			var recipeItems []models.RecipeItem
			if err := tx.Where("product_id = ?", product.ID).Find(&recipeItems).Error; err != nil {
				return err
			}

			for _, recipeItem := range recipeItems {
				consumed := recipeItem.Quantity * item.Quantity

				if err := tx.Model(&models.Ingredient{}).
					Where("id = ?", recipeItem.IngredientID).
					UpdateColumn("stock_quantity", gorm.Expr("stock_quantity - ?", consumed)).Error; err != nil {
					return err
				}

				movement := models.StockMovement{
					IngredientID:  recipeItem.IngredientID,
					Type:          "saida",
					Quantity:      consumed,
					Reason:        "Venda automática",
					RelatedSaleID: &sale.ID,
					CreatedBy:     &userUUID,
				}
				if err := tx.Create(&movement).Error; err != nil {
					return err
				}
			}
		}

		sale.Total = total
		return tx.Save(&sale).Error
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.Preload("Items").First(&sale, "id = ?", sale.ID)
	c.JSON(http.StatusCreated, sale)
}

func (h *Handler) ListSales(c *gin.Context) {
	var sales []models.Sale
	if err := h.DB.Preload("Items").Order("created_at desc").Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar vendas"})
		return
	}
	c.JSON(http.StatusOK, sales)
}
