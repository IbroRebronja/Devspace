-- AlterTable
ALTER TABLE "GitHubConnection" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "encryptedRefreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenIv" TEXT,
ADD COLUMN     "refreshTokenTag" TEXT;
