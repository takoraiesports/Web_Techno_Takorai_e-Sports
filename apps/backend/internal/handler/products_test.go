package handler

import (
	"testing"

	"backend/internal/domain"
)

func TestProductVariantsValidation(t *testing.T) {
	base := productInput{SKU: "CLUB-TEE", Price: 450}
	tests := []struct {
		name     string
		variants []productVariantInput
		wantErr  bool
	}{
		{name: "valid size variants", variants: []productVariantInput{{Size: "S", Stock: 2}, {Size: "M", Stock: 3}}},
		{name: "duplicate size and color", variants: []productVariantInput{{Size: "M", Color: "Black"}, {Size: "m", Color: "black"}}, wantErr: true},
		{name: "unsupported size", variants: []productVariantInput{{Size: "XS"}}, wantErr: true},
		{name: "invalid price", variants: []productVariantInput{{Size: "L", Price: -1}}, wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			input := base
			input.Variants = test.variants
			_, err := productVariants(input)
			if (err != nil) != test.wantErr {
				t.Fatalf("productVariants() error = %v, wantErr %v", err, test.wantErr)
			}
		})
	}
}

func TestSumProductStockUsesVariants(t *testing.T) {
	variants := []domain.ProductVariant{{Stock: 2}, {Stock: 5}}
	if got := sumStock(variants, 99); got != 7 {
		t.Fatalf("sumStock() = %d, want 7", got)
	}
	if got := sumStock(nil, 4); got != 4 {
		t.Fatalf("sumStock() fallback = %d, want 4", got)
	}
}

func TestProductImageURLMustUseHTTPS(t *testing.T) {
	for _, test := range []struct {
		url  string
		want bool
	}{
		{"", true},
		{"https://cdn.example.edu/shirt.jpg", true},
		{"http://cdn.example.edu/shirt.jpg", false},
		{"javascript:alert(1)", false},
	} {
		if got := isSecureProductImageURL(test.url); got != test.want {
			t.Errorf("isSecureProductImageURL(%q) = %v, want %v", test.url, got, test.want)
		}
	}
}
