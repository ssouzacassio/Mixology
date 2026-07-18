package manipuladores

import (
	"net/http"
	"time"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type entradaAberturaCaixa struct {
	ValorAbertura float64 `json:"valor_abertura"`
}

func (m *Manipulador) AbrirCaixa(c *gin.Context) {
	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	var existente modelos.Caixa
	if err := m.DB.Where("status = ?", "aberto").First(&existente).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "já existe um caixa aberto"})
		return
	}

	var entrada entradaAberturaCaixa
	_ = c.ShouldBindJSON(&entrada)

	caixa := modelos.Caixa{
		AbertoPor:     usuarioUUID,
		ValorAbertura: entrada.ValorAbertura,
		Status:        "aberto",
	}

	if err := m.DB.Create(&caixa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao abrir caixa"})
		return
	}

	c.JSON(http.StatusCreated, caixa)
}

func (m *Manipulador) CaixaAtual(c *gin.Context) {
	var caixa modelos.Caixa
	if err := m.DB.Where("status = ?", "aberto").First(&caixa).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "nenhum caixa aberto"})
		return
	}
	c.JSON(http.StatusOK, caixa)
}

type entradaFechamentoCaixa struct {
	ValorFechamento float64 `json:"valor_fechamento"`
}

func (m *Manipulador) FecharCaixa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var caixa modelos.Caixa
	if err := m.DB.First(&caixa, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "caixa não encontrado"})
		return
	}

	var entrada entradaFechamentoCaixa
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)
	agora := time.Now()

	caixa.Status = "fechado"
	caixa.ValorFechamento = &entrada.ValorFechamento
	caixa.FechadoPor = &usuarioUUID
	caixa.FechadoEm = &agora

	if err := m.DB.Save(&caixa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao fechar caixa"})
		return
	}

	c.JSON(http.StatusOK, caixa)
}
