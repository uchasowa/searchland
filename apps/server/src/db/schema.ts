import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const feedbackStatusEnum = pgEnum('feedback_status', [
  'new',
  'reviewing',
  'resolved',
  'archived',
]);

export const feedbackCategoryEnum = pgEnum('feedback_category', [
  'bug',
  'feature',
  'improvement',
  'question',
  'other',
]);

export const feedbackPriorityEnum = pgEnum('feedback_priority', [
  'low',
  'medium',
  'high',
]);

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: feedbackCategoryEnum('category').notNull(),
  status: feedbackStatusEnum('status').notNull().default('new'),
  userName: text('user_name').notNull(),
  userEmail: text('user_email').notNull(),
  priority: feedbackPriorityEnum('priority').notNull().default('medium'),
  company: text('company'),
  phone: text('phone'),
  notes: text('notes'),
  imageUrls: text('image_urls').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
