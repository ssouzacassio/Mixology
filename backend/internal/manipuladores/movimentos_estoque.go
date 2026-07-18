package manipuladores

import (
	"net/http"

	"mixology/backend/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (m *Manipulador) ListarMovimentosEstoque(c *gin.Context) {
	var movimentos []modelos.MovimentoEstoque
	if err := m.DB.Order("criado_em desc").Find(&movimentos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar movimentações"})
		return
	}
	c.JSON(http.StatusOK, movimentos)
}

type entradaMovimentoEstoque struct {
	InsumoID   uuid.UUID `json:"insumo_id" binding:"required"`
	Tipo       string    `json:"tipo" binding:"required,oneof=entrada saida ajuste"`
	Quantidade float64   `json:"quantidade" binding:"required,gt=0"`
	Motivo     string    `json:"motivo"`
}

func (m *Manipulador) CriarMovimentoEstoque(c *gin.Context) {
	var entrada entradaMovimentoEstoque
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	err := m.DB.Transaction(func(tx *gorm.DB) error {
		var insumo modelos.Insumo
		if err := tx.First(&insumo, "id = ?", entrada.InsumoID).Error; err != nil {
			return err
		}

		delta := entrada.Quantidade
		if entrada.Tipo == "saida" {
			delta = -delta
		}

		if err := tx.Model(&insumo).
			UpdateColumn("quantidade_estoque", gorm.Expr("quantidade_estoque + ?", delta)).Error; err != nil {
			return err
		}

		movimento := modelos.MovimentoEstoque{
			InsumoID:   entrada.InsumoID,
			Tipo:       entrada.Tipo,
			Quantidade: entrada.Quantidade,
			Motivo:     entrada.Motivo,
			CriadoPor:  &usuarioUUID,
		}
		return tx.Create(&movimento).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao registrar movimentação"})
		return
	}

	c.Status(http.StatusCreated)
}
