package handlers

import (
	"net/http"
	"time"

	"mixology/mix_back/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type openCashInput struct {
	OpeningAmount float64 `json:"opening_amount"`
}

func (h *Handler) OpenCashRegister(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userUUID, _ := userID.(uuid.UUID)

	var existing models.CashRegister
	if err := h.DB.Where("status = ?", "aberto").First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "já existe um caixa aberto"})
		return
	}

	var input openCashInput
	_ = c.ShouldBindJSON(&input)

	cash := models.CashRegister{
		OpenedBy:      userUUID,
		OpeningAmount: input.OpeningAmount,
		Status:        "aberto",
	}

	if err := h.DB.Create(&cash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao abrir caixa"})
		return
	}

	c.JSON(http.StatusCreated, cash)
}

func (h *Handler) CurrentCashRegister(c *gin.Context) {
	var cash models.CashRegister
	if err := h.DB.Where("status = ?", "aberto").First(&cash).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "nenhum caixa aberto"})
		return
	}
	c.JSON(http.StatusOK, cash)
}

type closeCashInput struct {
	ClosingAmount float64 `json:"closing_amount"`
}

func (h *Handler) CloseCashRegister(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var cash models.CashRegister
	if err := h.DB.First(&cash, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "caixa não encontrado"})
		return
	}

	var input closeCashInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := userID.(uuid.UUID)
	now := time.Now()

	cash.Status = "fechado"
	cash.ClosingAmount = &input.ClosingAmount
	cash.ClosedBy = &userUUID
	cash.ClosedAt = &now

	if err := h.DB.Save(&cash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao fechar caixa"})
		return
	}

	c.JSON(http.StatusOK, cash)
}
