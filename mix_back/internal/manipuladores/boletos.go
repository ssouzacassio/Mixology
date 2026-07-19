package manipuladores

import (
	"net/http"
	"time"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (m *Manipulador) ListarBoletos(c *gin.Context) {
	var boletos []modelos.Boleto
	if err := m.DB.Order("vencimento").Find(&boletos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar boletos"})
		return
	}
	c.JSON(http.StatusOK, boletos)
}

type entradaBoleto struct {
	Descricao  string    `json:"descricao" binding:"required"`
	Categoria  string    `json:"categoria"`
	Valor      float64   `json:"valor" binding:"required,gt=0"`
	Vencimento time.Time `json:"vencimento" binding:"required"`
}

func (m *Manipulador) CriarBoleto(c *gin.Context) {
	var entrada entradaBoleto
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	boleto := modelos.Boleto{
		Descricao:  entrada.Descricao,
		Categoria:  entrada.Categoria,
		Valor:      entrada.Valor,
		Vencimento: entrada.Vencimento,
		Status:     "pendente",
		CriadoPor:  usuarioUUID,
	}
	if err := m.DB.Create(&boleto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar boleto"})
		return
	}

	c.JSON(http.StatusCreated, boleto)
}

func (m *Manipulador) AtualizarBoleto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var boleto modelos.Boleto
	if err := m.DB.First(&boleto, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "boleto não encontrado"})
		return
	}

	var entrada entradaBoleto
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	boleto.Descricao = entrada.Descricao
	boleto.Categoria = entrada.Categoria
	boleto.Valor = entrada.Valor
	boleto.Vencimento = entrada.Vencimento
	if err := m.DB.Save(&boleto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar boleto"})
		return
	}

	c.JSON(http.StatusOK, boleto)
}

func (m *Manipulador) MarcarBoletoPago(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var boleto modelos.Boleto
	if err := m.DB.First(&boleto, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "boleto não encontrado"})
		return
	}

	agora := time.Now()
	boleto.Status = "pago"
	boleto.PagoEm = &agora
	if err := m.DB.Save(&boleto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar boleto"})
		return
	}

	c.JSON(http.StatusOK, boleto)
}

func (m *Manipulador) ReabrirBoleto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var boleto modelos.Boleto
	if err := m.DB.First(&boleto, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "boleto não encontrado"})
		return
	}

	boleto.Status = "pendente"
	boleto.PagoEm = nil
	if err := m.DB.Save(&boleto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar boleto"})
		return
	}

	c.JSON(http.StatusOK, boleto)
}

func (m *Manipulador) ExcluirBoleto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.Boleto{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover boleto"})
		return
	}

	c.Status(http.StatusNoContent)
}
