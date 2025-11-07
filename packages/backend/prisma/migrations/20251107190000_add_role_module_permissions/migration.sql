CREATE TABLE "role_module_permissions" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_module_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_module_permissions_role_module_key"
  ON "role_module_permissions"("role","module");

CREATE INDEX "role_module_permissions_role_idx"
  ON "role_module_permissions"("role");

