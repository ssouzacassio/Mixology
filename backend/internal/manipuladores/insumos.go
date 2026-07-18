package manipuladores

import (
	"net/http"

	"mixology/backend/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (m *Manipulador) ListarInsumos(c *gin.Context) {
	var insumos []modelos.Insumo
	if err := m.DB.Order("nome").Find(&insumos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar insumos"})
		return
	}
	c.JSON(http.StatusOK, insumos)
}

type entradaInsumo struct {
	Nome             string  `json:"nome" binding:"required"`
	Unidade          string  `json:"unidade" binding:"required,oneof=ml g un"`
	QuantidadeMinima float64 `json:"quantidade_minima"`
	CustoPorUnidade  float64 `json:"custo_por_unidade"`
}

func (m *Manipulador) CriarInsumo(c *gin.Context) {
	var entrada entradaInsumo
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	insumo := modelos.Insumo{
		Nome:             entrada.Nome,
		Unidade:          entrada.Unidade,
		QuantidadeMinima: entrada.QuantidadeMinima,
		CustoPorUnidade:  entrada.CustoPorUnidade,
	}

	if err := m.DB.Create(&insumo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar insumo"})
		return
	}

	c.JSON(http.StatusCreated, insumo)
}

func (m *Manipulador) AtualizarInsumo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var insumo modelos.Insumo
	if err := m.DB.First(&insumo, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "insumo não encontrado"})
		return
	}

	var entrada entradaInsumo
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	insumo.Nome = entrada.Nome
	insumo.Unidade = entrada.Unidade
	insumo.QuantidadeMinima = entrada.QuantidadeMinima
	insumo.CustoPorUnidade = entrada.CustoPorUnidade

	if err := m.DB.Save(&insumo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar insumo"})
		return
	}

	c.JSON(http.StatusOK, insumo)
}

func (m *Manipulador) ExcluirInsumo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.Insumo{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover insumo"})
		return
	}

	c.Status(http.StatusNoContent)
}
