package manipuladores

import (
	"net/http"

	"mixology/backend/internal/autenticacao"
	"mixology/backend/internal/modelos"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type entradaRegistro struct {
	NomeCompleto string `json:"nome_completo" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Senha        string `json:"senha" binding:"required,min=6"`
	Papel        string `json:"papel"`
}

func (m *Manipulador) Registrar(c *gin.Context) {
	var entrada entradaRegistro
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(entrada.Senha), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao processar senha"})
		return
	}

	papel := entrada.Papel
	if papel == "" {
		papel = "atendente"
	}

	usuario := modelos.Usuario{
		NomeCompleto: entrada.NomeCompleto,
		Email:        entrada.Email,
		SenhaHash:    string(hash),
		Papel:        papel,
	}

	if err := m.DB.Create(&usuario).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "e-mail já cadastrado"})
		return
	}

	token, err := autenticacao.GerarToken(m.SegredoJWT, usuario.ID, usuario.Papel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "usuario": usuario})
}

type entradaLogin struct {
	Email string `json:"email" binding:"required,email"`
	Senha string `json:"senha" binding:"required"`
}

func (m *Manipulador) Entrar(c *gin.Context) {
	var entrada entradaLogin
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.Where("email = ?", entrada.Email).First(&usuario).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciais inválidas"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.SenhaHash), []byte(entrada.Senha)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciais inválidas"})
		return
	}

	token, err := autenticacao.GerarToken(m.SegredoJWT, usuario.ID, usuario.Papel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "usuario": usuario})
}
