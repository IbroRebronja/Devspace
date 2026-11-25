-- Allow GitHub-authenticated accounts without a local password.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TABLE "GitHubIdentity" (
    "id" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "GitHubIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GitHubIdentity_githubUserId_key" ON "GitHubIdentity"("githubUserId");
CREATE UNIQUE INDEX "GitHubIdentity_userId_key" ON "GitHubIdentity"("userId");

ALTER TABLE "GitHubIdentity" ADD CONSTRAINT "GitHubIdentity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
