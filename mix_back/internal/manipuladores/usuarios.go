package manipuladores

import (
	"net/http"

	"mixology/mix_back/internal/modelos"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (m *Manipulador) ListarUsuarios(c *gin.Context) {
	var usuarios []modelos.Usuario
	if err := m.DB.Order("nome_completo").Find(&usuarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar usuários"})
		return
	}
	c.JSON(http.StatusOK, usuarios)
}

type entradaPerfil struct {
	NomeCompleto string `json:"nome_completo" binding:"required"`
	NomeUsuario  string `json:"usuario" binding:"required,min=3"`
}

func (m *Manipulador) AtualizarPerfil(c *gin.Context) {
	usuarioID, _ := c.Get("usuario_id")
	id, _ := usuarioID.(uuid.UUID)

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuário não encontrado"})
		return
	}

	var entrada entradaPerfil
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuario.NomeCompleto = entrada.NomeCompleto
	usuario.NomeUsuario = entrada.NomeUsuario

	if err := m.DB.Save(&usuario).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "não foi possível atualizar (usuário já em uso?)"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}

type entradaSenha struct {
	SenhaAtual string `json:"senha_atual" binding:"required"`
	SenhaNova  string `json:"senha_nova" binding:"required,min=6"`
}

func (m *Manipulador) AlterarSenha(c *gin.Context) {
	usuarioID, _ := c.Get("usuario_id")
	id, _ := usuarioID.(uuid.UUID)

	var entrada entradaSenha
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuário não encontrado"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.SenhaHash), []byte(entrada.SenhaAtual)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "senha atual incorreta"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(entrada.SenhaNova), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao processar senha"})
		return
	}

	usuario.SenhaHash = string(hash)
	if err := m.DB.Save(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao atualizar senha"})
		return
	}

	c.Status(http.StatusNoContent)
}

type entradaEditarUsuario struct {
	NomeCompleto string `json:"nome_completo" binding:"required"`
	NomeUsuario  string `json:"usuario" binding:"required,min=3"`
	Papel        string `json:"papel" binding:"required,oneof=atendente estoquista admin"`
	Ativo        bool   `json:"ativo"`
}

// AtualizarUsuario permite que um admin edite qualquer campo de outro
// usuário (nome, usuário, papel, ativo) — diferente de AtualizarPerfil,
// que só permite editar o próprio usuário logado.
func (m *Manipulador) AtualizarUsuario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuário não encontrado"})
		return
	}

	var entrada entradaEditarUsuario
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	usuario.NomeCompleto = entrada.NomeCompleto
	usuario.NomeUsuario = entrada.NomeUsuario
	usuario.Papel = entrada.Papel
	usuario.Ativo = entrada.Ativo

	if err := m.DB.Save(&usuario).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "não foi possível atualizar (usuário já em uso?)"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}

type entradaRedefinirSenha struct {
	SenhaNova string `json:"senha_nova" binding:"required,min=6"`
}

// RedefinirSenhaUsuario permite que um admin defina uma nova senha pra
// outro usuário sem precisar saber a senha atual dele.
func (m *Manipulador) RedefinirSenhaUsuario(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var usuario modelos.Usuario
	if err := m.DB.First(&usuario, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "usuário não encontrado"})
		return
	}

	var entrada entradaRedefinirSenha
	if err := c.ShouldBindJSON(&entrada); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(entrada.SenhaNova), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao processar senha"})
		return
	}

	usuario.SenhaHash = string(hash)
	if err := m.DB.Save(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao redefinir senha"})
		return
	}

	c.Status(http.StatusNoContent)
}
