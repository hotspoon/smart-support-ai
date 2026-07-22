ALTER TABLE "Workspace"
  ADD COLUMN "brandColor" TEXT NOT NULL DEFAULT '#10B981',
  ADD COLUMN "welcomeMessage" TEXT NOT NULL DEFAULT 'Ada yang bisa kami bantu?',
  ADD COLUMN "businessHours" TEXT NOT NULL DEFAULT 'Senin–Jumat, 08.00–17.00 WIB',
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "Conversation"
  ADD COLUMN "lastCustomerMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastAgentReplyAt" TIMESTAMP(3);

UPDATE "Conversation" c
SET "lastCustomerMessageAt" = COALESCE(
  (SELECT MAX(m."createdAt") FROM "Message" m WHERE m."conversationId" = c.id AND m.sender = 'USER'),
  c."createdAt"
),
"lastAgentReplyAt" = (
  SELECT MAX(m."createdAt") FROM "Message" m WHERE m."conversationId" = c.id AND m.sender = 'ADMIN'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationFeedback" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_recipientId_conversationId_key" ON "Notification"("recipientId", "conversationId");
CREATE INDEX "Notification_workspaceId_lastEventAt_idx" ON "Notification"("workspaceId", "lastEventAt");
CREATE INDEX "Notification_recipientId_readAt_lastEventAt_idx" ON "Notification"("recipientId", "readAt", "lastEventAt");
CREATE UNIQUE INDEX "ConversationFeedback_conversationId_key" ON "ConversationFeedback"("conversationId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationFeedback" ADD CONSTRAINT "ConversationFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
