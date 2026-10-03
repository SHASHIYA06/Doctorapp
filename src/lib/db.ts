import { PrismaClient } from '@prisma/client'

// Ensure DATABASE_URL points to PostgreSQL, not SQLite
// Next.js loads .env but the shell environment may override with SQLite URL
const NEON_POOLED = 'postgresql://neondb_owner:npg_KXBWMJwH87Uj@ep-floral-sun-b7i8km1j-pooler.c-13.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const NEON_UNPOOLED = 'postgresql://neondb_owner:npg_KXBWMJwH87Uj@ep-floral-sun-b7i8km1j.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = NEON_POOLED
}
if (!process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED.startsWith('file:')) {
  process.env.DATABASE_URL_UNPOOLED = NEON_UNPOOLED
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
