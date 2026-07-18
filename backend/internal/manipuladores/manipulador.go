package manipuladores

import "gorm.io/gorm"

type Manipulador struct {
	DB         *gorm.DB
	SegredoJWT string
}

func Novo(db *gorm.DB, segredoJWT string) *Manipulador {
	return &Manipulador{DB: db, SegredoJWT: segredoJWT}
}
