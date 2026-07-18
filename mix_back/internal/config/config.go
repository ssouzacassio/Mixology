package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	AllowedOrigin string
}

func Load() Config {
	if err := godotenv.Load(); err != nil {
		log.Println("nenhum arquivo .env encontrado, usando variáveis de ambiente do sistema")
	}

	return Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   mustEnv("DATABASE_URL"),
		JWTSecret:     mustEnv("JWT_SECRET"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("variável de ambiente obrigatória não definida: %s", key)
	}
	return v
}
