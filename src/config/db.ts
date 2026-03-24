import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Essential for Neon in Node environments
(neonConfig as any).webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);

// @ts-ignore - This bypasses the 'no exported member' error if the generator is still being stubborn
export const prisma = new PrismaClient({ adapter });