ALTER TABLE competitions
    ADD COLUMN stage text NOT NULL DEFAULT 'standalone'
        CHECK (stage IN ('standalone', 'qualification', 'final')),
    ADD COLUMN qualifying_competition_id bigint REFERENCES competitions(id),
    ADD COLUMN qualifying_place_limit integer CHECK (qualifying_place_limit > 0),
    ADD CONSTRAINT competitions_final_has_qualifier
        CHECK ((stage = 'final') = (qualifying_competition_id IS NOT NULL)
            AND (stage = 'final') = (qualifying_place_limit IS NOT NULL));

CREATE INDEX competitions_qualifier_idx ON competitions (qualifying_competition_id)
    WHERE qualifying_competition_id IS NOT NULL;
