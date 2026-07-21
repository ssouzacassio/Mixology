package manipuladores

import (
	"net/http"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (m *Manipulador) ListarProdutos(c *gin.Context) {
	var produtos []modelos.Produto
	if err := m.DB.
		Preload("GruposOpcao.GrupoOpcao.Opcoes").
		Order("nome").
		Find(&produtos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar produtos"})
		return
	}
	c.JSON(http.StatusOK, produtos)
}

type entradaProduto struct {
	Nome      string  `json:"nome" binding:"required"`
	Descricao string  `json:"descricao"`
	Categoria string  `json:"categoria"`
	Preco     float64 `json:"preco" binding:"required,gt=0"`
	Ativo     *bool   `json:"ativo"`
}

func (m *Manipulador) CriarProduto(c *gin.Context) {
	var entrada entradaProduto
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	produto := modelos.Produto{
		Nome:      entrada.Nome,
		Descricao: entrada.Descricao,
		Categoria: entrada.Categoria,
		Preco:     entrada.Preco,
		Ativo:     true,
	}

	if err := m.DB.Create(&produto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar produto"})
		return
	}

	c.JSON(http.StatusCreated, produto)
}

func (m *Manipulador) AtualizarProduto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var produto modelos.Produto
	if err := m.DB.First(&produto, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "produto não encontrado"})
		return
	}

	var entrada entradaProduto
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	produto.Nome = entrada.Nome
	produto.Descricao = entrada.Descricao
	produto.Categoria = entrada.Categoria
	produto.Preco = entrada.Preco
	if entrada.Ativo != nil {
		produto.Ativo = *entrada.Ativo
	}

	if err := m.DB.Save(&produto).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar produto"})
		return
	}

	c.JSON(http.StatusOK, produto)
}

func (m *Manipulador) ExcluirProduto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := m.DB.Delete(&modelos.Produto{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao remover produto"})
		return
	}

	c.Status(http.StatusNoContent)
}

type entradaReceita struct {
	Itens []struct {
		InsumoID   uuid.UUID `json:"insumo_id" binding:"required"`
		Quantidade float64   `json:"quantidade" binding:"required,gt=0"`
	} `json:"itens" binding:"required"`
}

func (m *Manipulador) DefinirReceitaProduto(c *gin.Context) {
	produtoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var entrada entradaReceita
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = m.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("produto_id = ?", produtoID).Delete(&modelos.ItemReceita{}).Error; err != nil {
			return err
		}
		for _, item := range entrada.Itens {
			itemReceita := modelos.ItemReceita{
				ProdutoID:  produtoID,
				InsumoID:   item.InsumoID,
				Quantidade: item.Quantidade,
			}
			if err := tx.Create(&itemReceita).Error; err != nil {
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

func (m *Manipulador) ObterReceitaProduto(c *gin.Context) {
	produtoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var itens []modelos.ItemReceita
	if err := m.DB.Preload("Insumo").Where("produto_id = ?", produtoID).Find(&itens).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao buscar receita"})
		return
	}

	c.JSON(http.StatusOK, itens)
}
