package repository

import "backend/internal/domain"

// competitiveGames is a baseline catalogue of titles with established national
// or international esports events. It contains game records only, not sample
// teams, users, tournaments, results, or merchandise.
func competitiveGames() []domain.Game {
	return []domain.Game{
		{Name: "Apex Legends", Slug: "apex-legends", Publisher: "Electronic Arts", Category: "BATTLE_ROYALE", Platform: "PC / CONSOLE", TeamSizeMin: 3, TeamSizeMax: 3, IsActive: true},
		{Name: "Arena of Valor (RoV)", Slug: "rov", Publisher: "Garena", Category: "MOBA", Platform: "MOBILE", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
		{Name: "Chess", Slug: "chess", Publisher: "FIDE / Online platforms", Category: "STRATEGY", Platform: "PC / MOBILE", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Counter-Strike 2", Slug: "counter-strike-2", Publisher: "Valve", Category: "FPS", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "Dota 2", Slug: "dota-2", Publisher: "Valve", Category: "MOBA", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "EA SPORTS FC", Slug: "ea-sports-fc", Publisher: "EA SPORTS", Category: "SPORTS", Platform: "PC / CONSOLE", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "FC Online", Slug: "fc-online", Publisher: "EA SPORTS / Nexon", Category: "SPORTS", Platform: "PC", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Fatal Fury: City of the Wolves", Slug: "fatal-fury-city-of-the-wolves", Publisher: "SNK", Category: "FIGHTING", Platform: "PC / CONSOLE", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Free Fire", Slug: "free-fire", Publisher: "Garena", Category: "BATTLE_ROYALE", Platform: "MOBILE", TeamSizeMin: 4, TeamSizeMax: 4, IsActive: true},
		{Name: "Fortnite", Slug: "fortnite", Publisher: "Epic Games", Category: "BATTLE_ROYALE", Platform: "PC / CONSOLE", TeamSizeMin: 1, TeamSizeMax: 4, IsActive: true},
		{Name: "Honor of Kings", Slug: "honor-of-kings", Publisher: "Tencent / TiMi Studio Group", Category: "MOBA", Platform: "MOBILE", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "League of Legends", Slug: "league-of-legends", Publisher: "Riot Games", Category: "MOBA", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "Mobile Legends: Bang Bang", Slug: "mobile-legends-bang-bang", Publisher: "MOONTON Games", Category: "MOBA", Platform: "MOBILE", TeamSizeMin: 5, TeamSizeMax: 6, IsActive: true},
		{Name: "Overwatch 2", Slug: "overwatch-2", Publisher: "Blizzard Entertainment", Category: "FPS", Platform: "PC / CONSOLE", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "PUBG: Battlegrounds", Slug: "pubg-battlegrounds", Publisher: "KRAFTON", Category: "BATTLE_ROYALE", Platform: "PC / CONSOLE", TeamSizeMin: 4, TeamSizeMax: 4, IsActive: true},
		{Name: "PUBG MOBILE", Slug: "pubg-mobile", Publisher: "KRAFTON / Tencent", Category: "BATTLE_ROYALE", Platform: "MOBILE", TeamSizeMin: 4, TeamSizeMax: 4, IsActive: true},
		{Name: "Rainbow Six Siege", Slug: "rainbow-six-siege", Publisher: "Ubisoft", Category: "FPS", Platform: "PC / CONSOLE", TeamSizeMin: 5, TeamSizeMax: 5, IsActive: true},
		{Name: "Rocket League", Slug: "rocket-league", Publisher: "Psyonix", Category: "SPORTS", Platform: "PC / CONSOLE", TeamSizeMin: 3, TeamSizeMax: 3, IsActive: true},
		{Name: "StarCraft II", Slug: "starcraft-2", Publisher: "Blizzard Entertainment", Category: "STRATEGY", Platform: "PC", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Street Fighter 6", Slug: "street-fighter-6", Publisher: "Capcom", Category: "FIGHTING", Platform: "PC / CONSOLE", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Tekken 8", Slug: "tekken-8", Publisher: "Bandai Namco Entertainment", Category: "FIGHTING", Platform: "PC / CONSOLE", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "Trackmania", Slug: "trackmania", Publisher: "Ubisoft", Category: "RACING", Platform: "PC", TeamSizeMin: 1, TeamSizeMax: 1, IsActive: true},
		{Name: "VALORANT", Slug: "valorant", Publisher: "Riot Games", Category: "FPS", Platform: "PC", TeamSizeMin: 5, TeamSizeMax: 7, IsActive: true},
	}
}
