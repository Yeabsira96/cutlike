import { neon } from '@neondatabase/serverless'

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Untitled project',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      duration REAL,
      width INTEGER,
      height INTEGER,
      fps INTEGER,
      editing_style TEXT,
      energy_level TEXT,
      cuts_per_minute REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      platform TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 50,
      editing_style TEXT,
      energy_level TEXT,
      cuts_per_minute REAL,
      avg_shot_length REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS timelines (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      clips JSONB NOT NULL,
      groq_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  console.log('✓ Database tables created')
}

migrate().catch(console.error)