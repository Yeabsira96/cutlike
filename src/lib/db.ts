import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, text, timestamp, integer, real, jsonb } from 'drizzle-orm/pg-core'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// projects table — one per user edit session
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('Untitled project'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// clips table — uploaded footage
export const clips = pgTable('clips', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  filename: text('filename').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  duration: real('duration'),
  width: integer('width'),
  height: integer('height'),
  fps: integer('fps'),
  editingStyle: text('editing_style'),
  energyLevel: text('energy_level'),
  cutsPerMinute: real('cuts_per_minute'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})

// inspirations table — inspo links
export const inspirations = pgTable('inspirations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  url: text('url').notNull(),
  title: text('title'),
  platform: text('platform').notNull(),
  weight: integer('weight').notNull().default(50),
  editingStyle: text('editing_style'),
  energyLevel: text('energy_level'),
  cutsPerMinute: real('cuts_per_minute'),
  avgShotLength: real('avg_shot_length'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})

// timelines table — generated edit plans
export const timelines = pgTable('timelines', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  clips: jsonb('clips').notNull(),
  groqMessage: text('groq_message'),
  createdAt: timestamp('created_at').defaultNow(),
})

// messages table — chat history
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  role: text('role').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})