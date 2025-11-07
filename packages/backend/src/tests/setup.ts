import { prisma } from '../lib/prisma';

export async function cleanupDatabase() {
  try {
    await prisma.patient.deleteMany();
    await prisma.tutor.deleteMany();
    await prisma.queueEntry.deleteMany();
    await prisma.consultation.deleteMany();
    await prisma.vaccination.deleteMany();
    await prisma.user.deleteMany({ where: { username: 'testuser' } });
    await prisma.user.deleteMany({ where: { username: 'alex' } });
  } catch (error) {
    console.warn('Cleanup error (might be expected):', error);
  }
}

export async function ensureAdminSeed() {
  const adminUsername = 'alex';
  const adminPassword = 'alex';

  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existing) {
    return existing;
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  return prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });
}

export async function createTestUser() {
  const bcrypt = require('bcrypt');
  return await prisma.user.create({
    data: {
      username: 'testuser',
      password: await bcrypt.hash('testpass', 10),
      name: 'Test User',
      role: 'RECEPCAO',
    },
  });
}

export async function getAuthToken(userId: string): Promise<string> {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ id: userId }, secret);
}

