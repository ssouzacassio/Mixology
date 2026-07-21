package banco

import (
	"log"

	"mixology/mix_back/internal/modelos"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Conectar(urlBancoDados string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(urlBancoDados), &gorm.Config{})
	if err != nil {
		log.Fatalf("falha ao conectar no banco: %v", err)
	}

	err = db.AutoMigrate(
		&modelos.Usuario{},
		&modelos.Produto{},
		&modelos.Insumo{},
		&modelos.ItemReceita{},
		&modelos.Caixa{},
		&modelos.Venda{},
		&modelos.ItemVenda{},
		&modelos.MovimentoEstoque{},
		&modelos.Mesa{},
		&modelos.Boleto{},
		&modelos.GrupoOpcao{},
		&modelos.Opcao{},
		&modelos.ProdutoGrupoOpcao{},
		&modelos.ItemVendaOpcao{},
	)
	if err != nil {
		log.Fatalf("falha ao migrar banco: %v", err)
	}

	return db
}
