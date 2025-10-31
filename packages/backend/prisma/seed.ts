import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("senha123", 10);

  const recepcao = await prisma.user.upsert({
    where: { username: "recepcao" },
    update: {},
    create: {
      username: "recepcao",
      password: hashedPassword,
      name: "Recepção",
      role: "RECEPCAO",
    },
  });

  const drjoao = await prisma.user.upsert({
    where: { username: "drjoao" },
    update: {},
    create: {
      username: "drjoao",
      password: hashedPassword,
      name: "Dr. João",
      role: "VET",
    },
  });

  console.log("✅ Created users:", { recepcao, drjoao });

  const rooms = [
    { name: "Consultório 1" },
    { name: "Consultório 2" },
    { name: "Consultório 3" },
    { name: "Consultório 4" },
    { name: "Consultório 5" },
    { name: "Cirurgia" },
    { name: "Exames" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
  }

  console.log("✅ Created rooms:", rooms.map((r) => r.name));
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

