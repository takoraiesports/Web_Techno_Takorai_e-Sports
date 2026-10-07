package domain

import (
	"github.com/google/uuid"
	"testing"
)

func TestValidateMatchResult(t *testing.T) {
	winner := uuid.New()
	tests := []struct {
		name           string
		score1, score2 int
		winner         *uuid.UUID
		status         MatchStatus
		wantErr        bool
	}{
		{"scheduled without winner", 0, 0, nil, MatchScheduled, false},
		{"completed winner", 2, 1, &winner, MatchCompleted, false},
		{"negative score", -1, 0, nil, MatchLive, true},
		{"completed missing winner", 1, 0, nil, MatchCompleted, true},
		{"completed tie", 1, 1, &winner, MatchCompleted, true},
		{"winner before completion", 1, 0, &winner, MatchLive, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateMatchResult(tc.score1, tc.score2, tc.winner, tc.status)
			if (err != nil) != tc.wantErr {
				t.Fatalf("error = %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}
