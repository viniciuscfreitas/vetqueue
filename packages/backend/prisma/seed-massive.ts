import { PrismaClient, PaymentStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Configuração - ajuste conforme necessário
const CONFIG = {
  USERS: {
    VETS: 10,
    RECEPCAO: 3,
  },
  TUTORS: 150,
  PATIENTS_PER_TUTOR: { min: 1, max: 3 },
  QUEUE_ENTRIES: {
    TOTAL: 500,
    DAYS_BACK: 90, // Últimos 90 dias
  },
  CONSULTATIONS_RATIO: 0.7, // 70% das entradas completadas têm consulta
  VACCINATIONS_RATIO: 0.3, // 30% dos pacientes têm vacinação
  AUDIT_LOGS: 1000,
};

// Dados de exemplo
const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Julia", "Lucas", "Fernanda",
  "Rafael", "Patricia", "Bruno", "Camila", "Ricardo", "Beatriz", "Marcos",
  "Amanda", "Felipe", "Larissa", "Thiago", "Renata", "Gustavo", "Mariana",
  "Rodrigo", "Isabela", "Andre", "Carolina", "Vinicius", "Tatiana"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Ribeiro", "Carvalho", "Almeida", "Lopes",
  "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Monteiro",
  "Mendes", "Cardoso", "Reis", "Araujo", "Costa", "Martins", "Nunes"
];

const PET_NAMES = [
  "Rex", "Bolinha", "Mel", "Thor", "Luna", "Toby", "Nina", "Max", "Bella",
  "Zeus", "Daisy", "Charlie", "Molly", "Rocky", "Lola", "Buddy", "Sadie",
  "Jack", "Maggie", "Duke", "Lucy", "Bear", "Zoe", "Jake", "Stella", "Bailey",
  "Coco", "Milo", "Rosie", "Cooper", "Lily", "Oscar", "Chloe", "Teddy"
];

const SPECIES = ["Cachorro", "Gato", "Coelho", "Ave", "Hamster"];
const BREEDS = {
  "Cachorro": ["Labrador", "Golden Retriever", "Bulldog", "Poodle", "Beagle", "Pastor Alemão", "Yorkshire", "Shih Tzu"],
  "Gato": ["Persa", "Siamês", "Maine Coon", "British Shorthair", "Ragdoll", "Bengal", "SRD"],
  "Coelho": ["Anão", "Rex", "Angorá"],
  "Ave": ["Canário", "Periquito", "Calopsita"],
  "Hamster": ["Sírio", "Anão"]
};

const SERVICE_TYPES = ["Consulta", "Vacinação", "Cirurgia", "Exame", "Banho e Tosa"];
const PAYMENT_METHODS = ["Dinheiro", "PIX", "Cartão de Débito", "Cartão de Crédito", "Transferência"];
const STATUSES = ["WAITING", "CALLED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES = [1, 2, 3]; // EMERGENCY, HIGH, NORMAL

const DIAGNOSES = [
  "Exame de rotina", "Vacinação anual", "Castração", "Dermatite", "Obesidade",
  "Artrose", "Otite", "Gengivite", "Conjuntivite", "Parasitas externos",
  "Limpeza de tártaro", "Consulta de emergência", "Avaliação pós-operatória"
];

const TREATMENTS = [
  "Medicação oral por 7 dias", "Aplicação tópica", "Dieta especial", "Repouso",
  "Acompanhamento em 15 dias", "Cirurgia agendada", "Vacinação aplicada",
  "Retorno em 30 dias"
];

const VACCINE_NAMES = [
  "V8/V10", "Antirrábica", "Giardia", "Gripe Canina", "Leishmaniose",
  "V4/V5 (Felina)", "Leucemia Felina", "PIF"
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPhone(): string {
  return `(${randomInt(11, 99)}) ${randomInt(90000, 99999)}-${randomInt(1000, 9999)}`;
}

function randomEmail(name: string): string {
  const domains = ["gmail.com", "hotmail.com", "yahoo.com.br", "outlook.com"];
  return `${name.toLowerCase().replace(/\s+/g, ".")}@${randomElement(domains)}`;
}

function randomCPF(): string {
  return `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`;
}

function randomName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

async function createUsers() {
  console.log("📝 Criando usuários...");
  const hashedPassword = await bcrypt.hash("senha123", 10);
  
  const users = [];
  
  // Veterinários
  for (let i = 1; i <= CONFIG.USERS.VETS; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const name = `Dr(a). ${firstName} ${lastName}`;
    const username = `vet${i}`;
    
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: hashedPassword,
        name,
        role: "VET",
      },
    });
    users.push(user);
  }
  
  // Recepção
  for (let i = 1; i <= CONFIG.USERS.RECEPCAO; i++) {
    const name = randomName();
    const username = `recepcao${i}`;
    
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: hashedPassword,
        name,
        role: "RECEPCAO",
      },
    });
    users.push(user);
  }
  
  console.log(`✅ Criados ${users.length} usuários`);
  return users;
}

async function ensureRoomsAndServices() {
  console.log("📝 Verificando salas e serviços...");
  
  const rooms = [
    { name: "Consultório 1" },
    { name: "Consultório 2" },
    { name: "Consultório 3" },
    { name: "Consultório 4" },
    { name: "Consultório 5" },
    { name: "Cirurgia" },
    { name: "Exames" },
  ];

  const createdRooms = [];
  for (const room of rooms) {
    const r = await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
    createdRooms.push(r);
  }

  const services = [
    { name: "Consulta" },
    { name: "Vacinação" },
    { name: "Cirurgia" },
    { name: "Exame" },
    { name: "Banho e Tosa" },
  ];

  const createdServices = [];
  for (const service of services) {
    const s = await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
    createdServices.push(s);
  }

  console.log(`✅ Salas: ${createdRooms.length}, Serviços: ${createdServices.length}`);
  return { rooms: createdRooms, services: createdServices };
}

async function createTutors() {
  console.log("📝 Criando tutores...");
  const tutors = [];
  
  for (let i = 0; i < CONFIG.TUTORS; i++) {
    const name = randomName();
    const tutor = await prisma.tutor.create({
      data: {
        name,
        phone: Math.random() > 0.1 ? randomPhone() : null,
        email: Math.random() > 0.2 ? randomEmail(name) : null,
        cpfCnpj: Math.random() > 0.3 ? randomCPF() : null,
        address: Math.random() > 0.4 ? `Rua ${randomName()}, ${randomInt(100, 9999)}` : null,
      },
    });
    tutors.push(tutor);
    
    if ((i + 1) % 50 === 0) {
      console.log(`  Progresso: ${i + 1}/${CONFIG.TUTORS}`);
    }
  }
  
  console.log(`✅ Criados ${tutors.length} tutores`);
  return tutors;
}

async function createPatients(tutors: any[]) {
  console.log("📝 Criando pacientes...");
  const patients = [];
  let totalPatients = 0;
  
  for (const tutor of tutors) {
    const numPatients = randomInt(CONFIG.PATIENTS_PER_TUTOR.min, CONFIG.PATIENTS_PER_TUTOR.max);
    
    for (let i = 0; i < numPatients; i++) {
      const species = randomElement(SPECIES);
      const breed = randomElement(BREEDS[species as keyof typeof BREEDS] || BREEDS["Cachorro"]);
      const name = randomElement(PET_NAMES);
      
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - randomInt(0, 15));
      
      const patient = await prisma.patient.create({
        data: {
          name,
          species,
          breed,
          birthDate: Math.random() > 0.1 ? birthDate : null,
          gender: randomElement(["M", "F"]),
          microchip: Math.random() > 0.7 ? `BR${randomInt(100000000000000, 999999999999999)}` : null,
          color: Math.random() > 0.3 ? randomElement(["Preto", "Branco", "Marrom", "Tigrado", "Caramelo", "Cinza"]) : null,
          currentWeight: Math.random() > 0.2 ? parseFloat((randomInt(2, 50) + Math.random()).toFixed(2)) : null,
          allergies: Math.random() > 0.8 ? randomElement(["Nenhuma conhecida", "Ração com frango", "Picadas de pulga"]) : null,
          neutered: Math.random() > 0.4,
          tutorId: tutor.id,
          tutorName: tutor.name,
          tutorPhone: tutor.phone,
          tutorEmail: tutor.email,
          tutorCpfCnpj: tutor.cpfCnpj,
          tutorAddress: tutor.address,
          notes: Math.random() > 0.7 ? "Paciente ansioso, requer cuidado especial" : null,
        },
      });
      
      patients.push(patient);
      totalPatients++;
    }
  }
  
  console.log(`✅ Criados ${totalPatients} pacientes`);
  return patients;
}

async function createQueueEntries(
  users: any[],
  rooms: any[],
  patients: any[],
  services: any[]
) {
  console.log("📝 Criando entradas de fila...");
  
  const vets = users.filter(u => u.role === "VET");
  const recepcao = users.filter(u => u.role === "RECEPCAO");
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - CONFIG.QUEUE_ENTRIES.DAYS_BACK);
  
  const entries = [];
  const serviceNames = services.map(s => s.name);
  
  for (let i = 0; i < CONFIG.QUEUE_ENTRIES.TOTAL; i++) {
    const createdAt = randomDate(startDate, now);
    const patient = randomElement(patients);
    const serviceType = randomElement(serviceNames);
    const status = randomElement(STATUSES);
    const priority = randomElement(PRIORITIES);
    
    let calledAt: Date | null = null;
    let completedAt: Date | null = null;
    let assignedVet: any = null;
    let room: any = null;
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let paymentAmount: number | null = null;
    let paymentReceivedBy: any = null;
    let paymentReceivedAt: Date | null = null;
    let paymentMethod: string | null = null;
    
    if (status !== "WAITING" && status !== "CANCELLED") {
      assignedVet = randomElement(vets);
      room = randomElement(rooms);
      calledAt = new Date(createdAt);
      calledAt.setMinutes(calledAt.getMinutes() + randomInt(5, 60));
    }
    
    if (status === "COMPLETED") {
      completedAt = new Date(calledAt || createdAt);
      completedAt.setMinutes(completedAt.getMinutes() + randomInt(15, 120));
      
      // Adiciona dados financeiros para entradas completadas
      if (Math.random() > 0.15) { // 85% têm pagamento
        paymentAmount = parseFloat((randomInt(50, 500) + Math.random() * 100).toFixed(2));
        paymentReceivedBy = randomElement(recepcao);
        paymentReceivedAt = new Date(completedAt);
        paymentReceivedAt.setMinutes(paymentReceivedAt.getMinutes() + randomInt(0, 30));
        paymentMethod = randomElement(PAYMENT_METHODS);
        
        if (Math.random() > 0.2) {
          paymentStatus = PaymentStatus.PAID;
        } else {
          paymentStatus = Math.random() > 0.5 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING;
        }
      }
    }
    
    const hasScheduledAppointment = Math.random() > 0.6;
    const scheduledAt = hasScheduledAppointment ? new Date(createdAt.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000) : null;
    
    const entry = await prisma.queueEntry.create({
      data: {
        patientName: patient.name,
        tutorName: patient.tutorName,
        serviceType,
        priority,
        status,
        createdAt,
        calledAt,
        completedAt,
        assignedVetId: assignedVet?.id,
        roomId: room?.id,
        patientId: patient.id,
        hasScheduledAppointment,
        scheduledAt,
        paymentStatus,
        paymentAmount: paymentAmount ? paymentAmount.toString() : null,
        paymentReceivedById: paymentReceivedBy?.id,
        paymentReceivedAt,
        paymentMethod,
        paymentNotes: paymentStatus === PaymentStatus.PARTIAL ? "Pagamento parcial realizado" : null,
      },
    });
    
    entries.push(entry);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Progresso: ${i + 1}/${CONFIG.QUEUE_ENTRIES.TOTAL}`);
    }
  }
  
  console.log(`✅ Criadas ${entries.length} entradas de fila`);
  return entries;
}

async function createConsultations(entries: any[], vets: any[]) {
  console.log("📝 Criando consultas...");
  
  const completedEntries = entries.filter(e => e.status === "COMPLETED" && e.serviceType === "Consulta");
  const numConsultations = Math.floor(completedEntries.length * CONFIG.CONSULTATIONS_RATIO);
  const selectedEntries = completedEntries.slice(0, numConsultations);
  
  const consultations = [];
  
  for (const entry of selectedEntries) {
    const consultation = await prisma.consultation.create({
      data: {
        patientId: entry.patientId!,
        queueEntryId: entry.id,
        vetId: entry.assignedVetId || randomElement(vets).id,
        diagnosis: randomElement(DIAGNOSES),
        treatment: randomElement(TREATMENTS),
        prescription: Math.random() > 0.5 ? "Medicação prescrita conforme diagnóstico" : null,
        weightInKg: Math.random() > 0.3 ? parseFloat((randomInt(2, 50) + Math.random()).toFixed(2)) : null,
        notes: Math.random() > 0.6 ? "Paciente respondeu bem ao tratamento" : null,
        date: entry.completedAt || entry.createdAt,
      },
    });
    
    consultations.push(consultation);
  }
  
  console.log(`✅ Criadas ${consultations.length} consultas`);
  return consultations;
}

async function createVaccinations(patients: any[], vets: any[]) {
  console.log("📝 Criando vacinações...");
  
  const numVaccinations = Math.floor(patients.length * CONFIG.VACCINATIONS_RATIO);
  const selectedPatients = patients.slice(0, numVaccinations);
  
  const vaccinations = [];
  
  for (const patient of selectedPatients) {
    const appliedDate = randomDate(
      new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
      new Date()
    );
    
    const vaccination = await prisma.vaccination.create({
      data: {
        patientId: patient.id,
        vaccineName: randomElement(VACCINE_NAMES),
        appliedDate,
        batchNumber: `LOT${randomInt(10000, 99999)}`,
        vetId: randomElement(vets).id,
        nextDoseDate: Math.random() > 0.3 ? new Date(appliedDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
        notes: Math.random() > 0.5 ? "Vacina aplicada sem intercorrências" : null,
      },
    });
    
    vaccinations.push(vaccination);
  }
  
  console.log(`✅ Criadas ${vaccinations.length} vacinações`);
  return vaccinations;
}

async function createAuditLogs(users: any[], entries: any[]) {
  console.log("📝 Criando logs de auditoria...");
  
  const actions = [
    "CREATE_ENTRY", "UPDATE_ENTRY", "DELETE_ENTRY", "CALL_PATIENT",
    "COMPLETE_ENTRY", "ASSIGN_VET", "PAYMENT_RECEIVED", "UPDATE_STATUS"
  ];
  
  const logs = [];
  
  for (let i = 0; i < CONFIG.AUDIT_LOGS; i++) {
    const user = randomElement(users);
    const action = randomElement(actions);
    const entry = randomElement(entries);
    
    const timestamp = randomDate(
      new Date(new Date().setDate(new Date().getDate() - CONFIG.QUEUE_ENTRIES.DAYS_BACK)),
      new Date()
    );
    
    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action,
        entityType: "QueueEntry",
        entityId: entry.id,
        metadata: {
          previousStatus: randomElement(STATUSES),
          newStatus: randomElement(STATUSES),
        },
        timestamp,
      },
    });
    
    logs.push(log);
  }
  
  console.log(`✅ Criados ${logs.length} logs de auditoria`);
  return logs;
}

async function main() {
  console.log("🚀 Iniciando seed massivo...\n");
  
  try {
    // 1. Criar usuários
    const users = await createUsers();
    const vets = users.filter(u => u.role === "VET");
    
    // 2. Garantir salas e serviços
    const { rooms, services } = await ensureRoomsAndServices();
    
    // 3. Criar tutores
    const tutors = await createTutors();
    
    // 4. Criar pacientes
    const patients = await createPatients(tutors);
    
    // 5. Criar entradas de fila
    const entries = await createQueueEntries(users, rooms, patients, services);
    
    // 6. Criar consultas
    const consultations = await createConsultations(entries, vets);
    
    // 7. Criar vacinações
    const vaccinations = await createVaccinations(patients, vets);
    
    // 8. Criar logs de auditoria
    const auditLogs = await createAuditLogs(users, entries);
    
    console.log("\n✅ Seed massivo concluído!");
    console.log("\n📊 Resumo:");
    console.log(`   Usuários: ${users.length}`);
    console.log(`   Tutores: ${tutors.length}`);
    console.log(`   Pacientes: ${patients.length}`);
    console.log(`   Entradas de Fila: ${entries.length}`);
    console.log(`   Consultas: ${consultations.length}`);
    console.log(`   Vacinações: ${vaccinations.length}`);
    console.log(`   Logs de Auditoria: ${auditLogs.length}`);
    
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

