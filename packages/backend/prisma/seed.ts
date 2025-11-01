import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("senha123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Admin",
      role: "RECEPCAO",
    },
  });

  const alex = await prisma.user.upsert({
    where: { username: "alex" },
    update: {},
    create: {
      username: "alex",
      password: hashedPassword,
      name: "Alex",
      role: "VET",
    },
  });

  console.log("✅ Created users:", { admin, alex });

  const rooms = [
    { name: "Consultório 1" },
    { name: "Consultório 2" },
    { name: "Consultório 3" },
    { name: "Consultório 4" },
    { name: "Consultório 5" },
    { name: "Consultório 6" },
    { name: "Consultório 7" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
  }

  console.log("✅ Created rooms:", rooms.map((r) => r.name));

  const services = [
    { name: "Consulta" },
    { name: "Retorno" },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  console.log("✅ Created services:", services.map((s) => s.name));
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

