package manipuladores

import (
	"net/http"
	"time"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type entradaAberturaCaixa struct {
	ValorAbertura float64 `json:"valor_abertura"`
}

func (m *Manipulador) AbrirCaixa(c *gin.Context) {
	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	var existente modelos.Caixa
	if err := m.DB.Where("status = ?", "aberto").First(&existente).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "já existe um caixa aberto"})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", usuarioUUID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao identificar usuário"})
		return
	}

	var entrada entradaAberturaCaixa
	_ = c.ShouldBindJSON(&entrada)

	caixa := modelos.Caixa{
		AbertoPor:     usuarioUUID,
		AbertoPorNome: usuario.NomeCompleto,
		ValorAbertura: entrada.ValorAbertura,
		Status:        "aberto",
	}

	if err := m.DB.Create(&caixa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao abrir caixa"})
		return
	}

	c.JSON(http.StatusCreated, caixa)
}

// ListarCaixas devolve o histórico de todos os caixas (abertos e
// fechados), do mais recente pro mais antigo — usado na tela de
// Financeiro pra conferir valores de abertura/fechamento passados.
func (m *Manipulador) ListarCaixas(c *gin.Context) {
	var caixas []modelos.Caixa
	if err := m.DB.Order("aberto_em desc").Find(&caixas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar caixas"})
		return
	}
	c.JSON(http.StatusOK, caixas)
}

func (m *Manipulador) CaixaAtual(c *gin.Context) {
	var caixa modelos.Caixa
	if err := m.DB.Where("status = ?", "aberto").First(&caixa).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "nenhum caixa aberto"})
		return
	}
	c.JSON(http.StatusOK, caixa)
}

// UltimoCaixaFechado devolve o caixa fechado mais recente, usado pra
// sugerir o valor de abertura do próximo caixa (evita ter que contar o
// dinheiro de novo toda vez).
func (m *Manipulador) UltimoCaixaFechado(c *gin.Context) {
	var caixa modelos.Caixa
	if err := m.DB.Where("status = ?", "fechado").Order("fechado_em desc").First(&caixa).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "nenhum caixa fechado anteriormente"})
		return
	}
	c.JSON(http.StatusOK, caixa)
}

type resumoFormaPagamento struct {
	FormaPagamento string  `json:"forma_pagamento"`
	Total          float64 `json:"total"`
}

// ResumoCaixa soma o total vendido em cada forma de pagamento dentro de
// um caixa específico.
func (m *Manipulador) ResumoCaixa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var resumo []resumoFormaPagamento
	if err := m.DB.Model(&modelos.Venda{}).
		Select("forma_pagamento, COALESCE(SUM(total), 0) as total").
		Where("caixa_id = ?", id).
		Group("forma_pagamento").
		Scan(&resumo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar resumo"})
		return
	}

	c.JSON(http.StatusOK, resumo)
}

type entradaFechamentoCaixa struct {
	ValorFechamento float64 `json:"valor_fechamento"`
}

func (m *Manipulador) FecharCaixa(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var caixa modelos.Caixa
	if err := m.DB.First(&caixa, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "caixa não encontrado"})
		return
	}

	var entrada entradaFechamentoCaixa
	_ = c.ShouldBindJSON(&entrada)

	usuarioID, _ := c.Get("usuario_id")
	usuarioUUID, _ := usuarioID.(uuid.UUID)

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", usuarioUUID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao identificar usuário"})
		return
	}

	agora := time.Now()

	caixa.Status = "fechado"
	caixa.ValorFechamento = &entrada.ValorFechamento
	caixa.FechadoPor = &usuarioUUID
	caixa.FechadoPorNome = usuario.NomeCompleto
	caixa.FechadoEm = &agora

	if err := m.DB.Save(&caixa).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao fechar caixa"})
		return
	}

	c.JSON(http.StatusOK, caixa)
}
