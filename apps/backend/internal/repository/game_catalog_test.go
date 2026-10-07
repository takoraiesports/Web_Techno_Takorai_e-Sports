package repository

import "testing"

func TestCompetitiveGameCatalogIsUsable(t *testing.T) {
	catalog := competitiveGames()
	if len(catalog) < 20 {
		t.Fatalf("catalog has %d games; want at least 20 established esports titles", len(catalog))
	}
	seen := make(map[string]bool, len(catalog))
	for _, game := range catalog {
		if game.Name == "" || game.Slug == "" || game.Publisher == "" || game.Category == "" || game.Platform == "" {
			t.Errorf("incomplete game catalog entry: %+v", game)
		}
		if seen[game.Slug] {
			t.Errorf("duplicate game slug %q", game.Slug)
		}
		seen[game.Slug] = true
		if game.TeamSizeMin < 1 || game.TeamSizeMax < game.TeamSizeMin {
			t.Errorf("invalid roster range for %s: %d-%d", game.Name, game.TeamSizeMin, game.TeamSizeMax)
		}
		if !game.IsActive {
			t.Errorf("new catalog game %s should be active", game.Name)
		}
	}
}
