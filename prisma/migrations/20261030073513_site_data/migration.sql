-- CreateTable
CREATE TABLE "SiteData" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteData_pkey" PRIMARY KEY ("key")
);
