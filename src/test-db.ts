import { prisma } from "./config/db.js";

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log("DB connected! Users:", users.length);
  } catch (err) {
    console.error("DB connection failed", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();