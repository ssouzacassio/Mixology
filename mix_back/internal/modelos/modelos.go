package modelos

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Usuario struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	NomeCompleto string    `gorm:"not null" json:"nome_completo"`
	NomeUsuario  string    `gorm:"uniqueIndex;not null" json:"usuario"`
	SenhaHash    string    `gorm:"not null" json:"-"`
	Papel        string    `gorm:"not null;default:atendente" json:"papel"`
	Ativo        bool      `gorm:"not null;default:true" json:"ativo"`
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

func (Usuario) TableName() string { return "usuarios" }

func (u *Usuario) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Produto struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Nome       string    `gorm:"not null" json:"nome"`
	Descricao  string    `json:"descricao"`
	Categoria  string    `json:"categoria"`
	Preco      float64   `gorm:"not null" json:"preco"`
	Ativo      bool      `gorm:"not null;default:true" json:"ativo"`
	CriadoEm   time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

func (Produto) TableName() string { return "produtos" }

func (p *Produto) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type Insumo struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Nome              string    `gorm:"not null" json:"nome"`
	Unidade           string    `gorm:"not null" json:"unidade"`
	QuantidadeEstoque float64   `gorm:"not null;default:0" json:"quantidade_estoque"`
	QuantidadeMinima  float64   `gorm:"not null;default:0" json:"quantidade_minima"`
	CustoPorUnidade   float64   `gorm:"not null;default:0" json:"custo_por_unidade"`
	CriadoEm          time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

func (Insumo) TableName() string { return "insumos" }

func (i *Insumo) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

type ItemReceita struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ProdutoID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_produto_insumo" json:"produto_id"`
	InsumoID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_produto_insumo" json:"insumo_id"`
	Quantidade float64  `gorm:"not null" json:"quantidade"`
	Insumo    *Insumo   `gorm:"foreignKey:InsumoID" json:"insumo,omitempty"`
}

func (ItemReceita) TableName() string { return "itens_receita" }

func (r *ItemReceita) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type Caixa struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	AbertoPor       uuid.UUID  `gorm:"type:uuid;not null" json:"aberto_por"`
	AbertoPorNome   string     `gorm:"not null;default:''" json:"aberto_por_nome"`
	FechadoPor      *uuid.UUID `gorm:"type:uuid" json:"fechado_por,omitempty"`
	FechadoPorNome  string     `json:"fechado_por_nome,omitempty"`
	ValorAbertura   float64    `gorm:"not null;default:0" json:"valor_abertura"`
	ValorFechamento *float64   `json:"valor_fechamento,omitempty"`
	Status          string     `gorm:"not null;default:aberto" json:"status"`
	AbertoEm        time.Time  `gorm:"autoCreateTime" json:"aberto_em"`
	FechadoEm       *time.Time `json:"fechado_em,omitempty"`
}

func (Caixa) TableName() string { return "caixas" }

func (c *Caixa) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type Venda struct {
	ID             uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	CaixaID        uuid.UUID   `gorm:"type:uuid;not null" json:"caixa_id"`
	MesaID         *uuid.UUID  `gorm:"type:uuid" json:"mesa_id,omitempty"`
	Mesa           *Mesa       `gorm:"foreignKey:MesaID;constraint:OnDelete:SET NULL" json:"mesa,omitempty"`
	NomeComanda    string      `json:"nome_comanda,omitempty"`
	CriadoPor      uuid.UUID   `gorm:"type:uuid;not null" json:"criado_por"`
	Total          float64     `gorm:"not null;default:0" json:"total"`
	FormaPagamento string      `gorm:"not null" json:"forma_pagamento"`
	Status         string      `gorm:"not null;default:fechada" json:"status"`
	CriadoEm       time.Time   `gorm:"autoCreateTime" json:"criado_em"`
	FechadoEm      *time.Time  `json:"fechado_em,omitempty"`
	Itens          []ItemVenda `gorm:"foreignKey:VendaID" json:"itens,omitempty"`
}

func (Venda) TableName() string { return "vendas" }

func (v *Venda) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

type ItemVenda struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	VendaID        uuid.UUID `gorm:"type:uuid;not null" json:"venda_id"`
	ProdutoID      uuid.UUID `gorm:"type:uuid;not null" json:"produto_id"`
	Quantidade     float64   `gorm:"not null" json:"quantidade"`
	PrecoUnitario  float64   `gorm:"not null" json:"preco_unitario"`
}

func (ItemVenda) TableName() string { return "itens_venda" }

func (iv *ItemVenda) BeforeCreate(tx *gorm.DB) error {
	if iv.ID == uuid.Nil {
		iv.ID = uuid.New()
	}
	return nil
}

type MovimentoEstoque struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	InsumoID            uuid.UUID  `gorm:"type:uuid;not null" json:"insumo_id"`
	Tipo                string     `gorm:"not null" json:"tipo"`
	Quantidade          float64    `gorm:"not null" json:"quantidade"`
	Motivo              string     `json:"motivo"`
	VendaRelacionadaID  *uuid.UUID `gorm:"type:uuid" json:"venda_relacionada_id,omitempty"`
	CriadoPor           *uuid.UUID `gorm:"type:uuid" json:"criado_por,omitempty"`
	CriadoEm            time.Time  `gorm:"autoCreateTime" json:"criado_em"`
}

func (MovimentoEstoque) TableName() string { return "movimentos_estoque" }

func (m *MovimentoEstoque) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type Mesa struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Nome     string    `gorm:"not null;uniqueIndex" json:"nome"`
	Status   string    `gorm:"not null;default:livre" json:"status"`
	CriadoEm time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

func (Mesa) TableName() string { return "mesas" }

func (m *Mesa) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type Boleto struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Descricao  string     `gorm:"not null" json:"descricao"`
	Categoria  string     `gorm:"not null;default:''" json:"categoria"`
	Valor      float64    `gorm:"not null" json:"valor"`
	Vencimento time.Time  `gorm:"not null" json:"vencimento"`
	Status     string     `gorm:"not null;default:pendente" json:"status"`
	PagoEm     *time.Time `json:"pago_em,omitempty"`
	CriadoPor  uuid.UUID  `gorm:"type:uuid;not null" json:"criado_por"`
	CriadoEm   time.Time  `gorm:"autoCreateTime" json:"criado_em"`
}

func (Boleto) TableName() string { return "boletos" }

func (b *Boleto) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}
