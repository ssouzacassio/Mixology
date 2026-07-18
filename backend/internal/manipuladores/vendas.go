package manipuladores

import (
	"errors"
	"net/http"

	"mixology/backend/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type entradaItemVenda struct {
	ProdutoID  uuid.UUID `json:"produto_id" binding:"required"`
	Quantidade float64   `json:"quantidade" binding:"required,gt=0"`
}

type entradaVenda struct {
	FormaPagamento string             `json:"forma_pagamento" binding:"required,oneof=dinheiro debito credito pix"`
	Itens          []entradaItemVenda `json:"itens" binding:"required,min=1"`
}

// CriarVenda registra uma venda, seus itens, e abate automaticamente do
// estoque os insumos usados na receita de cada produto vendido.
func (m *Manipulador) CriarVenda(c *gin.Context) {
	var entrada entradaVenda
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	var venda modelos.Venda

	err := m.DB.Transaction(func(tx *gorm.DB) error {
		var caixa modelos.Caixa
		if err := tx.Where("status = ?", "aberto").First(&caixa).Error; err != nil {
			return errors.New("nenhum caixa aberto")
		}

		venda = modelos.Venda{
			CaixaID:        caixa.ID,
			CriadoPor:      usuarioUUID,
			FormaPagamento: entrada.FormaPagamento,
		}
		if err := tx.Create(&venda).Error; err != nil {
			return err
		}

		var total float64

		for _, item := range entrada.Itens {
			var produto modelos.Produto
			if err := tx.First(&produto, "id = ?", item.ProdutoID).Error; err != nil {
				return errors.New("produto não encontrado")
			}

			itemVenda := modelos.ItemVenda{
				VendaID:       venda.ID,
				ProdutoID:     produto.ID,
				Quantidade:    item.Quantidade,
				PrecoUnitario: produto.Preco,
			}
			if err := tx.Create(&itemVenda).Error; err != nil {
				return err
			}
			total += produto.Preco * item.Quantidade

			var itensReceita []modelos.ItemReceita
			if err := tx.Where("produto_id = ?", produto.ID).Find(&itensReceita).Error; err != nil {
				return err
			}

			for _, itemReceita := range itensReceita {
				consumido := itemReceita.Quantidade * item.Quantidade

				if err := tx.Model(&modelos.Insumo{}).
					Where("id = ?", itemReceita.InsumoID).
					UpdateColumn("quantidade_estoque", gorm.Expr("quantidade_estoque - ?", consumido)).Error; err != nil {
					return err
				}

				movimento := modelos.MovimentoEstoque{
					InsumoID:           itemReceita.InsumoID,
					Tipo:               "saida",
					Quantidade:         consumido,
					Motivo:             "Venda automática",
					VendaRelacionadaID: &venda.ID,
					CriadoPor:          &usuarioUUID,
				}
				if err := tx.Create(&movimento).Error; err != nil {
					return err
				}
			}
		}

		venda.Total = total
		return tx.Save(&venda).Error
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m.DB.Preload("Itens").First(&venda, "id = ?", venda.ID)
	c.JSON(http.StatusCreated, venda)
}

func (m *Manipulador) ListarVendas(c *gin.Context) {
	var vendas []modelos.Venda
	if err := m.DB.Preload("Itens").Order("criado_em desc").Find(&vendas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar vendas"})
		return
	}
	c.JSON(http.StatusOK, vendas)
}
