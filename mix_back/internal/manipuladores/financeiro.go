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
