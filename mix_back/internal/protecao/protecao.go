package protecao

import (
	"net/http"
	"strings"

	"mixology/mix_back/internal/autenticacao"

	"github.com/gin-gonic/gin"
)

func ExigirAutenticacao(segredoJWT string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cabecalho := c.GetHeader("Authorization")
		if !strings.HasPrefix(cabecalho, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token ausente"})
			return
		}

		tokenTexto := strings.TrimPrefix(cabecalho, "Bearer ")
		reivindicacoes, err := autenticacao.AnalisarToken(segredoJWT, tokenTexto)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			return
		}

		c.Set("usuario_id", reivindicacoes.UsuarioID)
		c.Set("usuario_papel", reivindicacoes.Papel)
		c.Next()
	}
}

func ExigirPapel(papeis ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		papel, existe := c.Get("usuario_papel")
		if !existe {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "não autenticado"})
			return
		}

		papelTexto, _ := papel.(string)
		for _, p := range papeis {
			if p == papelTexto {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permissão negada"})
	}
}
