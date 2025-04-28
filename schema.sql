-- schema.sql
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Automatically generates unique IDs
    date TEXT NOT NULL,                   -- Store date as YYYY-MM-DD string
    author TEXT NOT NULL,
    content TEXT NOT NULL
);

-- Optional: Add an index for faster date lookups if data grows large
-- CREATE INDEX IF NOT EXISTS idx_event_date ON events (date);
