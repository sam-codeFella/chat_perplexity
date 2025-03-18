import { sql } from '@vercel/postgres';
import { db } from '../lib/db';
import { chat, message, vote } from '../lib/db/schema';

async function main() {
  console.log('Creating database tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      visibility VARCHAR(255) NOT NULL DEFAULT 'private'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      chat_id VARCHAR(255) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      role VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id VARCHAR(255) PRIMARY KEY,
      chat_id VARCHAR(255) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      message_id VARCHAR(255) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      type VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('Database tables created successfully!');
}

main()
  .catch((err) => {
    console.error('Error initializing database:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  }); 