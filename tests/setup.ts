import { beforeEach, afterAll } from 'vitest';
import { prisma } from "../src/config/db.js";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});