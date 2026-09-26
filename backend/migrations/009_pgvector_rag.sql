CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_embeddings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id bigint REFERENCES documents(id) ON DELETE CASCADE,
    competition_id bigint REFERENCES competitions(id) ON DELETE CASCADE,
    title text NOT NULL DEFAULT '',
    chunk_index integer NOT NULL DEFAULT 0,
    content text NOT NULL,
    embedding vector(768),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_embeddings_doc_idx ON document_embeddings (document_id);
CREATE INDEX IF NOT EXISTS document_embeddings_comp_idx ON document_embeddings (competition_id);
