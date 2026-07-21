package manipuladores

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type entradaItemVenda struct {
	ProdutoID  uuid.UUID   `json:"produto_id" binding:"required"`
	Quantidade float64     `json:"quantidade" binding:"required,gt=0"`
	OpcoesIDs  []uuid.UUID `json:"opcoes_ids"`
}

type entradaVenda struct {
	MesaID      uuid.UUID          `json:"mesa_id" binding:"required"`
	VendaID     *uuid.UUID         `json:"venda_id"`
	NomeComanda string             `json:"nome_comanda"`
	Itens       []entradaItemVenda `json:"itens" binding:"required,min=1"`
}

// CriarVenda lança produtos numa comanda de uma mesa. Se vier venda_id,
// lança na comanda aberta específica; se não vier, sempre cria uma
// comanda nova (uma mesa pode ter várias comandas abertas ao mesmo
// tempo, ex: contas separadas por grupo). Soma ao total e abate na hora
// o estoque dos insumos usados na receita de cada produto — quem lança
// é o atendimento. A comanda só é fechada (forma de pagamento definida)
// pelo caixa, em FecharVenda.
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

		var mesa modelos.Mesa
		if err := tx.First(&mesa, "id = ?", entrada.MesaID).Error; err != nil {
			return errors.New("mesa não encontrada")
		}

		if entrada.VendaID != nil {
			if err := tx.Where("id = ? AND mesa_id = ? AND caixa_id = ? AND status = ?",
				*entrada.VendaID, entrada.MesaID, caixa.ID, "aberta").First(&venda).Error; err != nil {
				return errors.New("comanda não encontrada ou já foi fechada")
			}
			if entrada.NomeComanda != "" {
				venda.NomeComanda = entrada.NomeComanda
			}
		} else {
			mesaID := entrada.MesaID
			venda = modelos.Venda{
				CaixaID:     caixa.ID,
				MesaID:      &mesaID,
				NomeComanda: entrada.NomeComanda,
				CriadoPor:   usuarioUUID,
				Status:      "aberta",
			}
			if err := tx.Create(&venda).Error; err != nil {
				return err
			}
		}

		var totalAdicionado float64

		for _, item := range entrada.Itens {
			var produto modelos.Produto
			if err := tx.First(&produto, "id = ?", item.ProdutoID).Error; err != nil {
				return errors.New("produto não encontrado")
			}

			var gruposProduto []modelos.ProdutoGrupoOpcao
			if err := tx.Where("produto_id = ?", produto.ID).Find(&gruposProduto).Error; err != nil {
				return err
			}

			var opcoesEscolhidas []modelos.Opcao
			if len(item.OpcoesIDs) > 0 {
				if err := tx.Where("id IN ?", item.OpcoesIDs).Find(&opcoesEscolhidas).Error; err != nil {
					return err
				}
			}

			if len(gruposProduto) > 0 {
				grupoEscolhido := map[uuid.UUID]bool{}
				for _, opcao := range opcoesEscolhidas {
					grupoEscolhido[opcao.GrupoOpcaoID] = true
				}
				for _, vinculo := range gruposProduto {
					if !grupoEscolhido[vinculo.GrupoOpcaoID] {
						return fmt.Errorf("escolha uma opção obrigatória para %s", produto.Nome)
					}
				}
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
			totalAdicionado += produto.Preco * item.Quantidade

			for _, opcao := range opcoesEscolhidas {
				itemOpcao := modelos.ItemVendaOpcao{ItemVendaID: itemVenda.ID, OpcaoID: opcao.ID}
				if err := tx.Create(&itemOpcao).Error; err != nil {
					return err
				}

				if opcao.InsumoID != nil && opcao.Quantidade > 0 {
					consumido := opcao.Quantidade * item.Quantidade

					if err := tx.Model(&modelos.Insumo{}).
						Where("id = ?", *opcao.InsumoID).
						UpdateColumn("quantidade_estoque", gorm.Expr("quantidade_estoque - ?", consumido)).Error; err != nil {
						return err
					}

					movimento := modelos.MovimentoEstoque{
						InsumoID:           *opcao.InsumoID,
						Tipo:               "saida",
						Quantidade:         consumido,
						Motivo:             "Venda automática (opção: " + opcao.Nome + ")",
						VendaRelacionadaID: &venda.ID,
						CriadoPor:          &usuarioUUID,
					}
					if err := tx.Create(&movimento).Error; err != nil {
						return err
					}
				}
			}

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

		venda.Total += totalAdicionado
		if err := tx.Save(&venda).Error; err != nil {
			return err
		}

		if mesa.Status != "consumacao" {
			if err := tx.Model(&mesa).Update("status", "consumacao").Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m.DB.Preload("Itens.Opcoes.Opcao.GrupoOpcao").Preload("Mesa").First(&venda, "id = ?", venda.ID)
	c.JSON(http.StatusCreated, venda)
}

type entradaFecharVenda struct {
	FormaPagamento string `json:"forma_pagamento" binding:"required,oneof=dinheiro debito credito pix"`
}

// FecharVenda é usado pelo caixa: define a forma de pagamento, marca a
// comanda como fechada e marca a mesa como "finalizada" (paga, mas ainda
// precisa ser liberada — pelo atendimento — antes de aceitar novos clientes).
func (m *Manipulador) FecharVenda(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var venda modelos.Venda
	if err := m.DB.First(&venda, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "conta não encontrada"})
		return
	}

	if venda.Status != "aberta" {
		c.JSON(http.StatusConflict, gin.H{"error": "essa conta já foi fechada"})
		return
	}

	var entrada entradaFecharVenda
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	agora := time.Now()

	err = m.DB.Transaction(func(tx *gorm.DB) error {
		venda.FormaPagamento = entrada.FormaPagamento
		venda.Status = "fechada"
		venda.FechadoEm = &agora
		if err := tx.Save(&venda).Error; err != nil {
			return err
		}

		if venda.MesaID != nil {
			var comandasRestantes int64
			if err := tx.Model(&modelos.Venda{}).
				Where("mesa_id = ? AND caixa_id = ? AND status = ?", *venda.MesaID, venda.CaixaID, "aberta").
				Count(&comandasRestantes).Error; err != nil {
				return err
			}

			if comandasRestantes == 0 {
				if err := tx.Model(&modelos.Mesa{}).
					Where("id = ?", *venda.MesaID).
					Update("status", "finalizada").Error; err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao fechar conta"})
		return
	}

	m.DB.Preload("Itens.Opcoes.Opcao.GrupoOpcao").Preload("Mesa").First(&venda, "id = ?", venda.ID)
	c.JSON(http.StatusOK, venda)
}

func (m *Manipulador) ListarVendas(c *gin.Context) {
	var vendas []modelos.Venda
	if err := m.DB.Preload("Itens.Opcoes.Opcao.GrupoOpcao").Preload("Mesa").Order("criado_em desc").Find(&vendas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar vendas"})
		return
	}
	c.JSON(http.StatusOK, vendas)
}
