package manipuladores

import (
	"net/http"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
)

type totalMensal struct {
	Mes   string  `json:"mes"`
	Total float64 `json:"total"`
}

// TotaisMensais soma o total das vendas fechadas agrupadas por mês de
// fechamento (independe de caixa), pra mostrar o histórico de faturamento
// mês a mês na aba "Total mês" do Financeiro.
func (m *Manipulador) TotaisMensais(c *gin.Context) {
	var totais []totalMensal
	if err := m.DB.Model(&modelos.Venda{}).
		Select("to_char(fechado_em, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as total").
		Where("status = ? AND fechado_em IS NOT NULL", "fechada").
		Group("mes").
		Order("mes desc").
		Scan(&totais).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar totais mensais"})
		return
	}
	c.JSON(http.StatusOK, totais)
}

type itemVendido struct {
	ProdutoID  string  `json:"produto_id"`
	Nome       string  `json:"nome"`
	Quantidade float64 `json:"quantidade"`
	Total      float64 `json:"total"`
}

// ItensVendidos soma, por produto, a quantidade e o valor total vendido em
// todas as comandas já fechadas — alimenta o card "Itens vendidos" do
// Financeiro.
func (m *Manipulador) ItensVendidos(c *gin.Context) {
	var itens []itemVendido
	if err := m.DB.Table("itens_venda AS iv").
		Select("iv.produto_id AS produto_id, p.nome AS nome, COALESCE(SUM(iv.quantidade), 0) AS quantidade, COALESCE(SUM(iv.quantidade * iv.preco_unitario), 0) AS total").
		Joins("JOIN vendas v ON v.id = iv.venda_id").
		Joins("JOIN produtos p ON p.id = iv.produto_id").
		Where("v.status = ?", "fechada").
		Group("iv.produto_id, p.nome").
		Order("quantidade desc").
		Scan(&itens).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar itens vendidos"})
		return
	}
	c.JSON(http.StatusOK, itens)
}
