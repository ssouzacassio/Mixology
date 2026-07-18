package autenticacao

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Reivindicacoes struct {
	UsuarioID uuid.UUID `json:"usuario_id"`
	Papel     string    `json:"papel"`
	jwt.RegisteredClaims
}

func GerarToken(segredo string, usuarioID uuid.UUID, papel string) (string, error) {
	reivindicacoes := Reivindicacoes{
		UsuarioID: usuarioID,
		Papel:     papel,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, reivindicacoes)
	return token.SignedString([]byte(segredo))
}

func AnalisarToken(segredo, tokenTexto string) (*Reivindicacoes, error) {
	reivindicacoes := &Reivindicacoes{}
	token, err := jwt.ParseWithClaims(tokenTexto, reivindicacoes, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de assinatura inesperado")
		}
		return []byte(segredo), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return reivindicacoes, nil
}
