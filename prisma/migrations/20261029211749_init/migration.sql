-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stockNo" TEXT,
    "partType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "spec" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "mileage" INTEGER,
    "warranty" TEXT NOT NULL DEFAULT '3 months',
    "condition" TEXT NOT NULL DEFAULT 'Used, tested',
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vin" TEXT,
    "vehicle" TEXT,
    "partType" TEXT,
    "notes" TEXT,
    "contactPrefs" TEXT NOT NULL DEFAULT 'text',
    "smsConsent" BOOLEAN NOT NULL DEFAULT false,
    "sourcePage" TEXT,
    "gclid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "vin" TEXT,
    "vehicle" TEXT,
    "partType" TEXT,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "aiDraft" TEXT,
    "aiDraftNote" TEXT,
    "aiDraftParts" TEXT,
    "aiDraftAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Part_slug_key" ON "Part"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Part_stockNo_key" ON "Part"("stockNo");

-- CreateIndex
CREATE INDEX "Part_year_make_model_partType_idx" ON "Part"("year", "make", "model", "partType");

-- CreateIndex
CREATE INDEX "Part_status_idx" ON "Part"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_phone_key" ON "Conversation"("phone");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
