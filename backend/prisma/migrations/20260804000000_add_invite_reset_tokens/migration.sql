-- AlterTable
ALTER TABLE "users" ADD COLUMN "inviteToken" TEXT,
                    ADD COLUMN "inviteExpiry" TIMESTAMP(3),
                    ADD COLUMN "resetToken" TEXT,
                    ADD COLUMN "resetExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_inviteToken_key" ON "users"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");
