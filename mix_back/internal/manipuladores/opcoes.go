package manipuladores

import (
	"net/http"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ListarGruposOpcao lista todos os grupos de opção (ex: "Base alcoólica",
// "Fruta") já com suas opções, reaproveitáveis entre vários produtos.
func (m *Manipulador) ListarGruposOpcao(c *gin.Context) {
	var grupos []modelos.GrupoOpcao
	if err := m.DB.Preload("Opcoes").Preload("Opcoes.Insumo").Order("nome").Find(&grupos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar grupos de opção"})
		return
	}
	c.JSON(http.StatusOK, grupos)
}

type entradaGrupoOpcao struct {
	Nome string `json:"nome" binding:"required"`
}

func (m *Manipulador) CriarGrupoOpcao(c *gin.Context) {
	var entrada entradaGrupoOpcao
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grupo := modelos.GrupoOpcao{Nome: entrada.Nome}
	if err := m.DB.Create(&grupo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar grupo de opção"})
		return
	}

	c.JSON(http.StatusCreated, grupo)
}

func (m *Manipulador) AtualizarGrupoOpcao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var grupo modelos.GrupoOpcao
	if err := m.DB.First(&grupo, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "grupo de opção não encontrado"})
		return
	}

	var entrada entradaGrupoOpcao
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grupo.Nome = entrada.Nome
	if err := m.DB.Save(&grupo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar grupo de opção"})
		return
	}

	c.JSON(http.StatusOK, grupo)
}

func (m *Manipulador) ExcluirGrupoOpcao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.GrupoOpcao{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover grupo de opção"})
		return
	}

	c.Status(http.StatusNoContent)
}

type entradaOpcao struct {
	Nome       string     `json:"nome" binding:"required"`
	InsumoID   *uuid.UUID `json:"insumo_id"`
	Quantidade float64    `json:"quantidade"`
}

// CriarOpcao cadastra uma opção (ex: "Vodka") dentro de um grupo, ligada a
// um insumo do estoque e à quantidade consumida por unidade vendida — é
// essa ligação que permite abater o insumo certo na hora da venda.
func (m *Manipulador) CriarOpcao(c *gin.Context) {
	grupoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var entrada entradaOpcao
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	opcao := modelos.Opcao{
		GrupoOpcaoID: grupoID,
		Nome:         entrada.Nome,
		InsumoID:     entrada.InsumoID,
		Quantidade:   entrada.Quantidade,
	}
	if err := m.DB.Create(&opcao).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar opção"})
		return
	}

	m.DB.Preload("Insumo").First(&opcao, "id = ?", opcao.ID)
	c.JSON(http.StatusCreated, opcao)
}

func (m *Manipulador) AtualizarOpcao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var opcao modelos.Opcao
	if err := m.DB.First(&opcao, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "opção não encontrada"})
		return
	}

	var entrada entradaOpcao
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	opcao.Nome = entrada.Nome
	opcao.InsumoID = entrada.InsumoID
	opcao.Quantidade = entrada.Quantidade

	if err := m.DB.Save(&opcao).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar opção"})
		return
	}

	m.DB.Preload("Insumo").First(&opcao, "id = ?", opcao.ID)
	c.JSON(http.StatusOK, opcao)
}

func (m *Manipulador) ExcluirOpcao(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.Opcao{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover opção"})
		return
	}

	c.Status(http.StatusNoContent)
}

type entradaProdutoGrupos struct {
	GrupoOpcaoIDs []uuid.UUID `json:"grupo_opcao_ids"`
}

// DefinirGruposOpcaoProduto substitui o conjunto de grupos de opção
// vinculados a um produto (ex: Caipirinha usa "Base alcoólica" e "Fruta").
func (m *Manipulador) DefinirGruposOpcaoProduto(c *gin.Context) {
	produtoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var entrada entradaProdutoGrupos
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = m.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("produto_id = ?", produtoID).Delete(&modelos.ProdutoGrupoOpcao{}).Error; err != nil {
			return err
		}
		for _, grupoID := range entrada.GrupoOpcaoIDs {
			vinculo := modelos.ProdutoGrupoOpcao{ProdutoID: produtoID, GrupoOpcaoID: grupoID}
			if err := tx.Create(&vinculo).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao vincular grupos de opção"})
		return
	}

	c.Status(http.StatusNoContent)
}
