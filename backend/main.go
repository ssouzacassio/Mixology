package main

import (
	"log"

	"mixology/backend/internal/banco"
	"mixology/backend/internal/configuracao"
	"mixology/backend/internal/manipuladores"
	"mixology/backend/internal/protecao"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	conf := configuracao.Carregar()
	db := banco.Conectar(conf.URLBancoDados)
	m := manipuladores.Novo(db, conf.SegredoJWT)

	roteador := gin.Default()
	roteador.Use(cors.New(cors.Config{
		AllowOrigins:     []string{conf.OrigemPermitida},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	roteador.GET("/saude", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := roteador.Group("/api")
	api.POST("/autenticacao/registrar", m.Registrar)
	api.POST("/autenticacao/entrar", m.Entrar)

	autorizado := api.Group("")
	autorizado.Use(protecao.ExigirAutenticacao(conf.SegredoJWT))

	autorizado.GET("/produtos", m.ListarProdutos)
	autorizado.POST("/produtos", m.CriarProduto)
	autorizado.PUT("/produtos/:id", m.AtualizarProduto)
	autorizado.DELETE("/produtos/:id", protecao.ExigirPapel("admin"), m.ExcluirProduto)
	autorizado.GET("/produtos/:id/receita", m.ObterReceitaProduto)
	autorizado.PUT("/produtos/:id/receita", m.DefinirReceitaProduto)

	autorizado.GET("/insumos", m.ListarInsumos)
	autorizado.POST("/insumos", m.CriarInsumo)
	autorizado.PUT("/insumos/:id", m.AtualizarInsumo)
	autorizado.DELETE("/insumos/:id", protecao.ExigirPapel("admin"), m.ExcluirInsumo)

	autorizado.GET("/movimentos-estoque", m.ListarMovimentosEstoque)
	autorizado.POST("/movimentos-estoque", m.CriarMovimentoEstoque)

	autorizado.POST("/caixas/abrir", m.AbrirCaixa)
	autorizado.GET("/caixas/atual", m.CaixaAtual)
	autorizado.POST("/caixas/:id/fechar", m.FecharCaixa)

	autorizado.GET("/vendas", m.ListarVendas)
	autorizado.POST("/vendas", m.CriarVenda)

	log.Printf("API rodando na porta %s", conf.Porta)
	if err := roteador.Run(":" + conf.Porta); err != nil {
		log.Fatalf("falha ao iniciar servidor: %v", err)
	}
}
