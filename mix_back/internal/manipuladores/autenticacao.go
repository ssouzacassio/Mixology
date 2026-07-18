package manipuladores

import (
	"net/http"
	"strings"

	"mixology/mix_back/internal/autenticacao"
	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type entradaRegistro struct {
	NomeCompleto string `json:"nome_completo" binding:"required"`
	NomeUsuario  string `json:"usuario" binding:"required,min=3"`
	Senha        string `json:"senha" binding:"required,min=6"`
	Papel        string `json:"papel"`
}

// Registrar cria um novo usuário. O primeiro usuário do sistema vira admin
// automaticamente (bootstrap); depois disso, só um admin já autenticado
// pode cadastrar novos funcionários.
func (m *Manipulador) Registrar(c *gin.Context) {
	var totalUsuarios int64
	if err := m.DB.Model(&modelos.Usuario{}).Count(&totalUsuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao verificar usuários"})
		return
	}

	primeiroUsuario := totalUsuarios == 0

	if !primeiroUsuario {
		cabecalho := c.GetHeader("Authorization")
		tokenTexto := strings.TrimPrefix(cabecalho, "Bearer ")
		reivindicacoes, err := autenticacao.AnalisarToken(m.SegredoJWT, tokenTexto)
		if !strings.HasPrefix(cabecalho, "Bearer ") || err != nil || reivindicacoes.Papel != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "apenas um administrador pode cadastrar novos usuários"})
			return
		}
	}

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
	if primeiroUsuario {
		papel = "admin"
	}

	usuario := modelos.Usuario{
		NomeCompleto: entrada.NomeCompleto,
		NomeUsuario:  entrada.NomeUsuario,
		SenhaHash:    string(hash),
		Papel:        papel,
		Ativo:        true,
	}

	if err := m.DB.Create(&usuario).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "nome de usuário já cadastrado"})
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
	NomeUsuario string `json:"usuario" binding:"required"`
	Senha       string `json:"senha" binding:"required"`
}

func (m *Manipulador) Entrar(c *gin.Context) {
	var entrada entradaLogin
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.Where("nome_usuario = ?", entrada.NomeUsuario).First(&usuario).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciais inválidas"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.SenhaHash), []byte(entrada.Senha)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciais inválidas"})
		return
	}

	if !usuario.Ativo {
		c.JSON(http.StatusForbidden, gin.H{"error": "usuário desativado"})
		return
	}

	token, err := autenticacao.GerarToken(m.SegredoJWT, usuario.ID, usuario.Papel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "usuario": usuario})
}
