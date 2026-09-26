package codeforces

type CFContest struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Type            string `json:"type"`
	Phase           string `json:"phase"`
	DurationSeconds int    `json:"durationSeconds"`
}

type CFProblem struct {
	ContestID int      `json:"contestId"`
	Index     string   `json:"index"`
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	Points    float64  `json:"points"`
	Rating    int      `json:"rating"`
	Tags      []string `json:"tags"`
}

type CFParty struct {
	Members []struct {
		Handle string `json:"handle"`
	} `json:"members"`
}

type CFProblemResult struct {
	Points               float64 `json:"points"`
	RejectedAttemptCount int     `json:"rejectedAttemptCount"`
}

type CFRow struct {
	Party          CFParty           `json:"party"`
	Rank           int               `json:"rank"`
	Points         float64           `json:"points"`
	Penalty        int               `json:"penalty"`
	ProblemResults []CFProblemResult `json:"problemResults"`
}

type CFStandings struct {
	Contest  CFContest   `json:"contest"`
	Problems []CFProblem `json:"problems"`
	Rows     []CFRow     `json:"rows"`
}

type CFUser struct {
	Handle    string `json:"handle"`
	Rank      string `json:"rank"`
	Rating    int    `json:"rating"`
	MaxRank   string `json:"maxRank"`
	MaxRating int    `json:"maxRating"`
	Avatar    string `json:"avatar"`
}
