package manipuladores

import (
	"net/http"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (m *Manipulador) ListarMesas(c *gin.Context) {
	var mesas []modelos.Mesa
	if err := m.DB.Order("nome").Find(&mesas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar mesas"})
		return
	}
	c.JSON(http.StatusOK, mesas)
}

type entradaMesa struct {
	Nome string `json:"nome" binding:"required"`
}

func (m *Manipulador) CriarMesa(c *gin.Context) {
	var entrada entradaMesa
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mesa := modelos.Mesa{Nome: entrada.Nome, Status: "livre"}
	if err := m.DB.Create(&mesa).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "não foi possível criar (nome já em uso?)"})
		return
	}

	c.JSON(http.StatusCreated, mesa)
}

func (m *Manipulador) ExcluirMesa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.Mesa{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover mesa"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (m *Manipulador) OcuparMesa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var mesa modelos.Mesa
	if err := m.DB.First(&mesa, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mesa não encontrada"})
		return
	}

	mesa.Status = "ocupada"
	if err := m.DB.Save(&mesa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar mesa"})
		return
	}

	c.JSON(http.StatusOK, mesa)
}

func (m *Manipulador) LiberarMesa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var mesa modelos.Mesa
	if err := m.DB.First(&mesa, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "mesa não encontrada"})
		return
	}

	mesa.Status = "livre"
	if err := m.DB.Save(&mesa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar mesa"})
		return
	}

	c.JSON(http.StatusOK, mesa)
}
