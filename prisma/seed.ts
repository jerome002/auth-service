import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('P@ssword123', 12);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finflow.com' },
    update: {},
    create: {
      email: 'admin@finflow.com',
      username: 'superadmin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  // 2. Create Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@finflow.com' },
    update: {},
    create: {
      email: 'user@finflow.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: Role.USER,
      isVerified: true,
      isActive: true,
    },
  });

  console.log('Database seeded:');
  console.log({ admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });