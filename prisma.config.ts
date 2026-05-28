import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;
console.log(
  "[prisma.config.ts] DATABASE_URL:",
  databaseUrl ? `set (length=${databaseUrl.length})` : "UNDEFINED"
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseUrl ?? "" },
});
