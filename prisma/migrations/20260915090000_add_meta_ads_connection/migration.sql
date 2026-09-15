CREATE TABLE "MetaAdsConnection" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "adAccountId" TEXT NOT NULL,
    "adAccountName" TEXT,
    "accessTokenCipher" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedById" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAdsConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MetaAdsConnection_adAccountId_key" ON "MetaAdsConnection"("adAccountId");
