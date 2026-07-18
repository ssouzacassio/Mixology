package configuracao

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Configuracao struct {
	Porta           string
	URLBancoDados   string
	SegredoJWT      string
	OrigemPermitida string
}

func Carregar() Configuracao {
	if err := godotenv.Load(); err != nil {
		log.Println("nenhum arquivo .env encontrado, usando variáveis de ambiente do sistema")
	}

	return Configuracao{
		Porta:           obterVar("PORTA", "8080"),
		URLBancoDados:   exigirVar("URL_BANCO_DADOS"),
		SegredoJWT:      exigirVar("SEGREDO_JWT"),
		OrigemPermitida: obterVar("ORIGEM_PERMITIDA", "http://localhost:3000"),
	}
}

func obterVar(chave, padrao string) string {
	if v := os.Getenv(chave); v != "" {
		return v
	}
	return padrao
}

func exigirVar(chave string) string {
	v := os.Getenv(chave)
	if v == "" {
		log.Fatalf("variável de ambiente obrigatória não definida: %s", chave)
	}
	return v
}
