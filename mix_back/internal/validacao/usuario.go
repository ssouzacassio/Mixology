package validacao

import (
	"errors"
	"regexp"
	"strings"
)

var padraoNomeUsuario = regexp.MustCompile(`^[A-Z0-9]+$`)

// NormalizarNomeUsuario converte o nome de usuário para maiúsculo e garante
// que só contenha letras (sem acento) e números — sem espaços, acentos ou
// caracteres especiais. Usado no cadastro, na edição e no login, pra que
// "joao", "JOAO" e "João" sejam sempre tratados como o mesmo usuário.
func NormalizarNomeUsuario(bruto string) (string, error) {
	normalizado := strings.ToUpper(strings.TrimSpace(bruto))
	if !padraoNomeUsuario.MatchString(normalizado) {
		return "", errors.New("usuário deve conter só letras e números, sem espaços, acentos ou caracteres especiais")
	}
	return normalizado, nil
}
