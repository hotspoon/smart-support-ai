-- Add live chat metadata without removing existing data.
CREATE TYPE "ResolutionSource" AS ENUM ('AI', 'ADMIN');

ALTER TABLE "Conversation"
  ADD COLUMN "publicTokenHash" TEXT,
  ADD COLUMN "lastMessageAt" TIMESTAMP(3),
  ADD COLUMN "resolutionSource" "ResolutionSource";

UPDATE "Conversation" SET "lastMessageAt" = "updatedAt" WHERE "lastMessageAt" IS NULL;

ALTER TABLE "Conversation"
  ALTER COLUMN "lastMessageAt" SET NOT NULL,
  ALTER COLUMN "lastMessageAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Message" ADD COLUMN "clientMessageId" TEXT;

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_publicTokenHash_key" ON "Conversation"("publicTokenHash");
CREATE UNIQUE INDEX "Message_conversationId_clientMessageId_key" ON "Message"("conversationId", "clientMessageId");
CREATE UNIQUE INDEX "RateLimitBucket_key_windowStart_key" ON "RateLimitBucket"("key", "windowStart");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
