package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FullName     string    `gorm:"not null" json:"full_name"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Role         string    `gorm:"not null;default:atendente" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Product struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Price       float64   `gorm:"not null" json:"price"`
	IsActive    bool      `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type Ingredient struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name          string    `gorm:"not null" json:"name"`
	Unit          string    `gorm:"not null" json:"unit"`
	StockQuantity float64   `gorm:"not null;default:0" json:"stock_quantity"`
	MinQuantity   float64   `gorm:"not null;default:0" json:"min_quantity"`
	CostPerUnit   float64   `gorm:"not null;default:0" json:"cost_per_unit"`
	CreatedAt     time.Time `json:"created_at"`
}

func (i *Ingredient) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

type RecipeItem struct {
	ID           uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	ProductID    uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_product_ingredient" json:"product_id"`
	IngredientID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_product_ingredient" json:"ingredient_id"`
	Quantity     float64     `gorm:"not null" json:"quantity"`
	Ingredient   *Ingredient `gorm:"foreignKey:IngredientID" json:"ingredient,omitempty"`
}

func (r *RecipeItem) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

type CashRegister struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	OpenedBy      uuid.UUID  `gorm:"type:uuid;not null" json:"opened_by"`
	ClosedBy      *uuid.UUID `gorm:"type:uuid" json:"closed_by,omitempty"`
	OpeningAmount float64    `gorm:"not null;default:0" json:"opening_amount"`
	ClosingAmount *float64   `json:"closing_amount,omitempty"`
	Status        string     `gorm:"not null;default:aberto" json:"status"`
	OpenedAt      time.Time  `json:"opened_at"`
	ClosedAt      *time.Time `json:"closed_at,omitempty"`
}

func (c *CashRegister) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.OpenedAt.IsZero() {
		c.OpenedAt = time.Now()
	}
	return nil
}

type Sale struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	CashRegisterID uuid.UUID  `gorm:"type:uuid;not null" json:"cash_register_id"`
	CreatedBy      uuid.UUID  `gorm:"type:uuid;not null" json:"created_by"`
	Total          float64    `gorm:"not null;default:0" json:"total"`
	PaymentMethod  string     `gorm:"not null" json:"payment_method"`
	CreatedAt      time.Time  `json:"created_at"`
	Items          []SaleItem `gorm:"foreignKey:SaleID" json:"items,omitempty"`
}

func (s *Sale) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

type SaleItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SaleID    uuid.UUID `gorm:"type:uuid;not null" json:"sale_id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null" json:"product_id"`
	Quantity  float64   `gorm:"not null" json:"quantity"`
	UnitPrice float64   `gorm:"not null" json:"unit_price"`
}

func (si *SaleItem) BeforeCreate(tx *gorm.DB) error {
	if si.ID == uuid.Nil {
		si.ID = uuid.New()
	}
	return nil
}

type StockMovement struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	IngredientID  uuid.UUID  `gorm:"type:uuid;not null" json:"ingredient_id"`
	Type          string     `gorm:"not null" json:"type"`
	Quantity      float64    `gorm:"not null" json:"quantity"`
	Reason        string     `json:"reason"`
	RelatedSaleID *uuid.UUID `gorm:"type:uuid" json:"related_sale_id,omitempty"`
	CreatedBy     *uuid.UUID `gorm:"type:uuid" json:"created_by,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (sm *StockMovement) BeforeCreate(tx *gorm.DB) error {
	if sm.ID == uuid.Nil {
		sm.ID = uuid.New()
	}
	return nil
}
