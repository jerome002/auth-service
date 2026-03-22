import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing data (Optional - use with caution)
  // await prisma.token.deleteMany();
  // await prisma.user.deleteMany();

  // 2. Create an Admin User
  const adminPassword = await bcrypt.hash("AdminPassword123!", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@finflow.com" },
    update: {},
    create: {
      email: "admin@finflow.com",
      username: "superadmin",
      password: adminPassword,
      firstName: "System",
      lastName: "Admin",
      role: Role.ADMIN,
      isVerified: true, // Admins start verified for testing
      isActive: true,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // 3. Create a Standard Test User
  const userPassword = await bcrypt.hash("UserPassword123!", 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: "tester@example.com" },
    update: {},
    create: {
      email: "tester@example.com",
      username: "test_user",
      password: userPassword,
      firstName: "Test",
      lastName: "Account",
      role: Role.USER,
      isVerified: false, // Useful for testing the verification flow
      isActive: true,
    },
  });

  console.log(`Test user created: ${testUser.email}`);
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });