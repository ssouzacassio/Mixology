package manipuladores

import (
	"net/http"
	"time"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// inicioDoDiaUTC retorna a meia-noite UTC de hoje, para comparar com
// Vencimento (sempre gravado como meia-noite UTC pelo frontend).
func inicioDoDiaUTC() time.Time {
	agora := time.Now().UTC()
	return time.Date(agora.Year(), agora.Month(), agora.Day(), 0, 0, 0, 0, time.UTC)
}

// calcularStatusBoleto decide "a_vencer" ou "vencido" a partir da data de
// vencimento; nunca retorna "pago" (isso só acontece via MarcarBoletoPago).
func calcularStatusBoleto(vencimento time.Time) string {
	if vencimento.Before(inicioDoDiaUTC()) {
		return "vencido"
	}
	return "a_vencer"
}

func (m *Manipulador) ListarBoletos(c *gin.Context) {
	hoje := inicioDoDiaUTC()

	// "pendente" é o valor antigo (antes de existir a distinção a_vencer/vencido);
	// migra para o esquema novo junto com o recálculo normal.
	m.DB.Model(&modelos.Boleto{}).
		Where("status IN (?, ?) AND vencimento < ?", "a_vencer", "pendente", hoje).
		Update("status", "vencido")
	m.DB.Model(&modelos.Boleto{}).
		Where("status IN (?, ?) AND vencimento >= ?", "vencido", "pendente", hoje).
		Update("status", "a_vencer")

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
		Status:     calcularStatusBoleto(entrada.Vencimento),
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
	if boleto.Status != "pago" {
		boleto.Status = calcularStatusBoleto(entrada.Vencimento)
	}
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

	boleto.Status = calcularStatusBoleto(boleto.Vencimento)
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
