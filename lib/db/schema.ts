import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from '@vercel/postgres';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('chats', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  visibility: varchar('visibility', { enum: ['private', 'public'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('messages', {
  id: varchar('id').primaryKey(),
  chatId: varchar('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  role: varchar('role', { enum: ['user', 'assistant'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable('votes', {
  id: varchar('id').primaryKey(),
  chatId: varchar('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  messageId: varchar('message_id')
    .notNull()
    .references(() => message.id, { onDelete: 'cascade' }),
  type: varchar('type', { enum: ['up', 'down'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
