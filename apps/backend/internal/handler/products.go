package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"net/url"
	"strings"

	"backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductHandler struct{ db *gorm.DB }

func NewProductHandler(db *gorm.DB) *ProductHandler { return &ProductHandler{db: db} }

type productInput struct {
	Name        string                `json:"name" binding:"required,min=2,max=120"`
	Subtitle    string                `json:"subtitle" binding:"max=160"`
	Description string                `json:"description" binding:"max=5000"`
	Category    string                `json:"category" binding:"required,oneof=jersey apparel accessory other"`
	SKU         string                `json:"sku" binding:"required,max=80"`
	Price       float64               `json:"price" binding:"required,gt=0,lte=10000000"`
	ImageURL    string                `json:"image_url" binding:"omitempty,url,max=2048"`
	Stock       int                   `json:"stock" binding:"gte=0,lte=1000000"`
	Color       string                `json:"color" binding:"max=80"`
	IsActive    bool                  `json:"is_active"`
	Variants    []productVariantInput `json:"variants" binding:"max=8,dive"`
}

type productVariantInput struct {
	Size  string  `json:"size" binding:"required,max=8"`
	Color string  `json:"color" binding:"max=80"`
	SKU   string  `json:"sku" binding:"max=80"`
	Price float64 `json:"price" binding:"gte=0,lte=10000000"`
	Stock int     `json:"stock" binding:"gte=0,lte=1000000"`
}

func (h *ProductHandler) ListPublic(c *gin.Context) {
	var products []domain.Product
	if err := h.db.WithContext(c.Request.Context()).Preload("Variants").Where("is_active = ?", true).Order("created_at DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load products"})
		return
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: products})
}

func (h *ProductHandler) ListAdmin(c *gin.Context) {
	var products []domain.Product
	if err := h.db.WithContext(c.Request.Context()).Preload("Variants").Order("created_at DESC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load products"})
		return
	}
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Data: products})
}

func (h *ProductHandler) Create(c *gin.Context) {
	var input productInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	if !isSecureProductImageURL(input.ImageURL) {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Product image URL must use HTTPS"})
		return
	}
	variants, err := productVariants(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	product := productFromInput(input)
	product.Slug = productSlug(input.Name)
	product.Stock = sumStock(variants, input.Stock)
	err = h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Variants").Create(&product).Error; err != nil {
			return err
		}
		for i := range variants {
			variants[i].ProductID = product.ID
		}
		if len(variants) > 0 {
			if err := tx.Create(&variants).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusConflict, domain.APIResponse{Success: false, Error: "Unable to create product; check that the SKU is unique"})
		return
	}
	h.audit(c, "PRODUCT_CREATED", "PRODUCT", product.ID, nil, product)
	c.JSON(http.StatusCreated, domain.APIResponse{Success: true, Message: "Product created", Data: product})
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, ok := productID(c)
	if !ok {
		return
	}
	var input productInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	if !isSecureProductImageURL(input.ImageURL) {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Product image URL must use HTTPS"})
		return
	}
	var product domain.Product
	if err := h.db.WithContext(c.Request.Context()).Preload("Variants").First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, domain.APIResponse{Success: false, Error: "Product not found"})
		return
	}
	old := product
	variants, err := productVariants(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: err.Error()})
		return
	}
	updated := productFromInput(input)
	updated.Stock = sumStock(variants, input.Stock)
	updated.ID, updated.CreatedAt, updated.Slug = product.ID, product.CreatedAt, product.Slug
	err = h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&product).Select("Name", "Subtitle", "Description", "Category", "SKU", "Price", "ImageURL", "Stock", "Color", "HasSizes", "IsActive").Updates(&updated).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("product_id = ?", id).Delete(&domain.ProductVariant{}).Error; err != nil {
			return err
		}
		for i := range variants {
			variants[i].ProductID = id
		}
		if len(variants) > 0 {
			if err := tx.Create(&variants).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusConflict, domain.APIResponse{Success: false, Error: "Unable to update product; check that the SKU is unique"})
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Preload("Variants").First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to load updated product"})
		return
	}
	h.audit(c, "PRODUCT_UPDATED", "PRODUCT", product.ID, old, product)
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Message: "Product updated", Data: product})
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, ok := productID(c)
	if !ok {
		return
	}
	var product domain.Product
	if err := h.db.WithContext(c.Request.Context()).First(&product, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, domain.APIResponse{Success: false, Error: "Product not found"})
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, domain.APIResponse{Success: false, Error: "Unable to delete product"})
		return
	}
	h.audit(c, "PRODUCT_DELETED", "PRODUCT", product.ID, product, nil)
	c.JSON(http.StatusOK, domain.APIResponse{Success: true, Message: "Product deleted"})
}

func (h *ProductHandler) audit(c *gin.Context, action, entity string, id uuid.UUID, oldValue, newValue interface{}) {
	userID, _ := uuid.Parse(c.GetString("userID"))
	entry := domain.AuditLog{UserID: &userID, Action: action, Entity: entity, EntityID: id.String(), IPAddress: c.ClientIP(), UserAgent: c.Request.UserAgent()}
	if oldValue != nil {
		if raw, err := json.Marshal(oldValue); err == nil {
			entry.OldValue = string(raw)
		}
	}
	if newValue != nil {
		if raw, err := json.Marshal(newValue); err == nil {
			entry.NewValue = string(raw)
		}
	}
	if err := h.db.WithContext(c.Request.Context()).Create(&entry).Error; err != nil {
		log.Printf("write product audit log: %v", err)
	}
}

func productFromInput(input productInput) domain.Product {
	return domain.Product{
		Name: strings.TrimSpace(input.Name), Subtitle: strings.TrimSpace(input.Subtitle), Description: strings.TrimSpace(input.Description),
		Category: input.Category, SKU: strings.TrimSpace(input.SKU), Price: input.Price, ImageURL: strings.TrimSpace(input.ImageURL),
		Stock: input.Stock, Color: strings.TrimSpace(input.Color), HasSizes: len(input.Variants) > 0, IsActive: input.IsActive,
	}
}

func productVariants(input productInput) ([]domain.ProductVariant, error) {
	if len(input.Variants) > 8 {
		return nil, fmt.Errorf("a product can have up to 8 size variants")
	}
	allowedSizes := map[string]bool{"S": true, "M": true, "L": true, "XL": true, "2XL": true, "3XL": true, "4XL": true, "5XL": true}
	seen := map[string]bool{}
	variants := make([]domain.ProductVariant, 0, len(input.Variants))
	for _, variant := range input.Variants {
		size := strings.ToUpper(strings.TrimSpace(variant.Size))
		color := strings.TrimSpace(variant.Color)
		key := size + "|" + strings.ToLower(color)
		if !allowedSizes[size] || seen[key] {
			return nil, fmt.Errorf("invalid or duplicate product size/color variant")
		}
		if variant.Price < 0 || math.IsNaN(variant.Price) || math.IsInf(variant.Price, 0) {
			return nil, fmt.Errorf("invalid variant price")
		}
		seen[key] = true
		sku := strings.TrimSpace(variant.SKU)
		if sku == "" {
			sku = strings.TrimSpace(input.SKU) + "-" + size + "-" + strings.ReplaceAll(strings.ToUpper(color), " ", "-")
		}
		price := variant.Price
		if price == 0 {
			price = input.Price
		}
		variants = append(variants, domain.ProductVariant{Size: size, Color: color, SKU: sku, Price: price, Stock: variant.Stock})
	}
	return variants, nil
}

func sumStock(variants []domain.ProductVariant, fallback int) int {
	if len(variants) == 0 {
		return fallback
	}
	total := 0
	for _, variant := range variants {
		total += variant.Stock
	}
	return total
}

func productSlug(name string) string {
	base := strings.ToLower(strings.TrimSpace(name))
	base = strings.Join(strings.FieldsFunc(base, func(r rune) bool { return !((r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')) }), "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = "product"
	}
	return base + "-" + uuid.NewString()[:8]
}

func isSecureProductImageURL(raw string) bool {
	if strings.TrimSpace(raw) == "" {
		return true
	}
	parsed, err := url.ParseRequestURI(strings.TrimSpace(raw))
	return err == nil && parsed.Scheme == "https" && parsed.Host != ""
}

func productID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.APIResponse{Success: false, Error: "Invalid product ID"})
		return uuid.Nil, false
	}
	return id, true
}
