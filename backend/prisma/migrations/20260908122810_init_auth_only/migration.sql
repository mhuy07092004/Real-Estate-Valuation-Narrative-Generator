-- CreateTable
CREATE TABLE "roles" (
    "role_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local',
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" DATETIME,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("role_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
