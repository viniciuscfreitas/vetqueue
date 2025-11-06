import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

async function migrateTutors() {
  logger.info("Starting tutor migration");

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      tutorName: true,
      tutorPhone: true,
      tutorEmail: true,
      tutorCpfCnpj: true,
      tutorAddress: true,
    },
  });

  logger.info(`Found ${patients.length} patients to process`);

  const tutorMap = new Map<string, { tutorId: string; patients: string[] }>();

  for (const patient of patients) {
    const key = `${patient.tutorName}|${patient.tutorPhone || ""}`;
    
    if (!tutorMap.has(key)) {
      const tutor = await prisma.tutor.create({
        data: {
          name: patient.tutorName,
          phone: patient.tutorPhone || null,
          email: patient.tutorEmail || null,
          cpfCnpj: patient.tutorCpfCnpj || null,
          address: patient.tutorAddress || null,
        },
      });
      
      tutorMap.set(key, { tutorId: tutor.id, patients: [patient.id] });
      logger.debug(`Created tutor: ${tutor.name} (${tutor.id})`);
    } else {
      const existing = tutorMap.get(key)!;
      existing.patients.push(patient.id);
    }
  }

  logger.info(`Created ${tutorMap.size} tutors`);

  let updatedCount = 0;
  for (const [key, value] of tutorMap.entries()) {
    for (const patientId of value.patients) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { tutorId: value.tutorId },
      });
      updatedCount++;
    }
  }

  logger.info(`Updated ${updatedCount} patients with tutorId`);
  logger.info("Tutor migration completed");
}

if (require.main === module) {
  migrateTutors()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Migration failed", { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    });
}

export { migrateTutors };

