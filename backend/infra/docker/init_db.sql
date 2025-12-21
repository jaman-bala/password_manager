-- Initialize database for Password Manager
-- This file is executed when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'Asia/Bishkek';

-- Create initial data if needed
-- This will be populated by Django migrations
