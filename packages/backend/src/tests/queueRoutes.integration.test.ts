import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getTestApp } from './helpers';
import { cleanupDatabase, createTestUser, getAuthToken } from './setup';
import { prisma } from '../lib/prisma';
import { Role, Priority, PaymentStatus, Status } from '../core/types';
import bcrypt from 'bcrypt';

const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)('Queue Routes Integration', () => {
    let recepcaoToken: string;
    let recepcaoUserId: string;
    let vetToken: string;
    let vetUserId: string;
    let adminToken: string;
    let adminUserId: string;
    let roomId: string;

    beforeAll(async () => {
        await cleanupDatabase();

        // Criar usuário RECEPCAO
        const recepcaoUser = await createTestUser();
        recepcaoUserId = recepcaoUser.id;
        recepcaoToken = await getAuthToken(recepcaoUserId);

        // Criar usuário VET
        const vetUser = await prisma.user.create({
            data: {
                username: 'testvet',
                password: await bcrypt.hash('testpass', 10),
                name: 'Test Vet',
                role: Role.VET,
            },
        });
        vetUserId = vetUser.id;
        vetToken = await getAuthToken(vetUserId);

        // Criar usuário ADMIN
        const adminUser = await prisma.user.create({
            data: {
                username: 'testadmin',
                password: await bcrypt.hash('testpass', 10),
                name: 'Test Admin',
                role: Role.ADMIN,
            },
        });
        adminUserId = adminUser.id;
        adminToken = await getAuthToken(adminUserId);

        // Criar sala para testes
        const room = await prisma.room.create({
            data: {
                name: 'Sala Teste',
                isActive: true,
            },
        });
        roomId = room.id;
    });

    afterEach(async () => {
        await cleanupDatabase();
        // Recriar sala após limpeza
        const room = await prisma.room.create({
            data: {
                name: 'Sala Teste',
                isActive: true,
            },
        });
        roomId = room.id;
    });

    describe('POST /api/queue - Adicionar paciente na fila', () => {
        it('should add patient to queue with valid data', async () => {
            const app = getTestApp();

            const response = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                    priority: Priority.NORMAL,
                })
                .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.patientName).toBe('Rex');
            expect(response.body.tutorName).toBe('João Silva');
            expect(response.body.serviceType).toBe('CONSULTA');
            expect(response.body.priority).toBe(Priority.NORMAL);
            expect(response.body.status).toBe(Status.WAITING);

            // Verificar no banco
            const entry = await prisma.queueEntry.findUnique({
                where: { id: response.body.id },
            });
            expect(entry).toBeTruthy();
            expect(entry?.patientName).toBe('Rex');
        });

        it('should reject queue entry without required fields', async () => {
            const app = getTestApp();

            await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    serviceType: 'CONSULTA',
                })
                .expect(400);
        });

        it('should require authentication', async () => {
            const app = getTestApp();

            await app
                .post('/api/queue')
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(401);
        });
    });

    describe('POST /api/queue/call-next - Chamar próximo paciente', () => {
        it('should call next patient in queue', async () => {
            const app = getTestApp();

            // Criar entrada na fila
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                    priority: Priority.NORMAL,
                })
                .expect(201);

            const entryId = createResponse.body.id;

            // Fazer check-in do vet na sala
            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            // Chamar próximo paciente
            const callResponse = await app
                .post('/api/queue/call-next')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    roomId: roomId,
                })
                .expect(200);

            expect(callResponse.body.id).toBe(entryId);
            expect(callResponse.body.status).toBe(Status.CALLED);
            expect(callResponse.body.calledAt).toBeDefined();
            expect(callResponse.body.roomId).toBe(roomId);

            // Verificar no banco
            const entry = await prisma.queueEntry.findUnique({
                where: { id: entryId },
            });
            expect(entry?.status).toBe(Status.CALLED);
        });

        it('should return message when no patients in queue', async () => {
            const app = getTestApp();

            // Fazer check-in do vet na sala
            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            const response = await app
                .post('/api/queue/call-next')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    roomId: roomId,
                })
                .expect(200);

            expect(response.body.message).toBe('Nenhuma entrada aguardando na fila');
        });

        it('should require vet to be checked in to room', async () => {
            const app = getTestApp();

            // Criar entrada na fila
            await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            // Tentar chamar sem check-in
            await app
                .post('/api/queue/call-next')
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    roomId: roomId,
                })
                .expect(400);
        });
    });

    describe('POST /api/queue/:id/call - Chamar paciente específico', () => {
        it('should call specific patient', async () => {
            const app = getTestApp();

            // Criar entrada na fila
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            // Fazer check-in do vet na sala
            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            // Chamar paciente específico
            const callResponse = await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({
                    roomId: roomId,
                })
                .expect(200);

            expect(callResponse.body.id).toBe(entryId);
            expect(callResponse.body.status).toBe(Status.CALLED);
            expect(callResponse.body.calledAt).toBeDefined();
        });

        it('should reject calling patient that is not waiting', async () => {
            const app = getTestApp();

            // Criar e chamar paciente
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(200);

            // Tentar chamar novamente (já está chamado)
            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(400);
        });
    });

    describe('PATCH /api/queue/:id/start - Iniciar atendimento', () => {
        it('should start service for called patient', async () => {
            const app = getTestApp();

            // Criar e chamar paciente
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(200);

            // Iniciar atendimento
            const startResponse = await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            expect(startResponse.body.status).toBe(Status.IN_PROGRESS);

            // Verificar no banco
            const entry = await prisma.queueEntry.findUnique({
                where: { id: entryId },
            });
            expect(entry?.status).toBe(Status.IN_PROGRESS);
        });

        it('should reject starting service by RECEPCAO', async () => {
            const app = getTestApp();

            // Criar entrada
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            // Tentar iniciar como RECEPCAO (deve falhar)
            await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .expect(400);
        });
    });

    describe('PATCH /api/queue/:id/complete - Finalizar atendimento', () => {
        it('should complete service', async () => {
            const app = getTestApp();

            // Criar, chamar e iniciar atendimento
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(200);

            await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // Finalizar atendimento
            const completeResponse = await app
                .patch(`/api/queue/${entryId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            expect(completeResponse.body.status).toBe(Status.COMPLETED);
            expect(completeResponse.body.completedAt).toBeDefined();

            // Verificar no banco
            const entry = await prisma.queueEntry.findUnique({
                where: { id: entryId },
            });
            expect(entry?.status).toBe(Status.COMPLETED);
            expect(entry?.completedAt).toBeTruthy();
        });
    });

    describe('PATCH /api/queue/:id/payment - Atualizar pagamento', () => {
        it('should update payment for completed entry', async () => {
            const app = getTestApp();

            // Criar e completar atendimento
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(200);

            await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            await app
                .patch(`/api/queue/${entryId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // Atualizar pagamento (requer módulo FINANCIAL)
            const paymentResponse = await app
                .patch(`/api/queue/${entryId}/payment`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    paymentStatus: PaymentStatus.PAID,
                    paymentAmount: '150.00',
                    paymentMethod: 'PIX',
                })
                .expect(200);

            expect(paymentResponse.body.paymentStatus).toBe(PaymentStatus.PAID);
            expect(paymentResponse.body.paymentAmount).toBe('150.00');
            expect(paymentResponse.body.paymentMethod).toBe('PIX');
            expect(paymentResponse.body.paymentReceivedById).toBe(recepcaoUserId);
            expect(paymentResponse.body.paymentReceivedAt).toBeDefined();

            // Verificar no banco
            const entry = await prisma.queueEntry.findUnique({
                where: { id: entryId },
            });
            expect(entry?.paymentStatus).toBe(PaymentStatus.PAID);
        });

        it('should require FINANCIAL module permission', async () => {
            const app = getTestApp();

            // Criar usuário VET sem módulo FINANCIAL
            const vetWithoutFinancial = await prisma.user.create({
                data: {
                    username: 'vetnofinancial',
                    password: await bcrypt.hash('testpass', 10),
                    name: 'Vet No Financial',
                    role: Role.VET,
                },
            });
            const vetNoFinancialToken = await getAuthToken(vetWithoutFinancial.id);

            // Criar e completar atendimento
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await app
                .patch(`/api/queue/${entryId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // Tentar atualizar pagamento sem permissão
            await app
                .patch(`/api/queue/${entryId}/payment`)
                .set('Authorization', `Bearer ${vetNoFinancialToken}`)
                .send({
                    paymentStatus: PaymentStatus.PAID,
                    paymentAmount: '150.00',
                })
                .expect(403);

            // Limpar usuário de teste
            await prisma.user.delete({ where: { id: vetWithoutFinancial.id } });
        });
    });

    describe('POST /api/queue/:id/payments - Adicionar entrada de pagamento', () => {
        it('should add payment entry', async () => {
            const app = getTestApp();

            // Criar e completar atendimento
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await prisma.user.update({
                where: { id: vetUserId },
                data: { currentRoomId: roomId },
            });

            await app
                .post(`/api/queue/${entryId}/call`)
                .set('Authorization', `Bearer ${vetToken}`)
                .send({ roomId: roomId })
                .expect(200);

            await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            await app
                .patch(`/api/queue/${entryId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // Adicionar entrada de pagamento
            const paymentResponse = await app
                .post(`/api/queue/${entryId}/payments`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    amount: 100,
                    paymentMethod: 'PIX',
                    paymentTotal: 150,
                })
                .expect(201);

            expect(paymentResponse.body.paymentStatus).toBe(PaymentStatus.PARTIAL);
            expect(paymentResponse.body.paymentAmount).toBe('150.00');
            expect(paymentResponse.body.paymentMethod).toBe('PIX');
            expect(paymentResponse.body.paymentHistory).toBeDefined();
            expect(paymentResponse.body.paymentHistory?.length).toBe(1);
            expect(paymentResponse.body.paymentHistory?.[0].amount).toBe('100.00');

            // Adicionar segundo pagamento
            const secondPaymentResponse = await app
                .post(`/api/queue/${entryId}/payments`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    amount: 50,
                    paymentMethod: 'CASH',
                })
                .expect(201);

            expect(secondPaymentResponse.body.paymentStatus).toBe(PaymentStatus.PAID);
            expect(secondPaymentResponse.body.paymentHistory?.length).toBe(2);
            expect(secondPaymentResponse.body.paymentMethod).toBe('MULTIPLE');
        });

        it('should reject invalid payment amount', async () => {
            const app = getTestApp();

            // Criar e completar atendimento
            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await app
                .patch(`/api/queue/${entryId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // Tentar adicionar pagamento com valor inválido
            await app
                .post(`/api/queue/${entryId}/payments`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    amount: -10,
                    paymentMethod: 'PIX',
                })
                .expect(400);
        });
    });

    describe('Authentication and Authorization', () => {
        it('should reject requests without token', async () => {
            const app = getTestApp();

            await app
                .post('/api/queue')
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(401);
        });

        it('should reject requests with invalid token', async () => {
            const app = getTestApp();

            await app
                .post('/api/queue')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(401);
        });

        it('should reject RECEPCAO from starting service', async () => {
            const app = getTestApp();

            const createResponse = await app
                .post('/api/queue')
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .send({
                    patientName: 'Rex',
                    tutorName: 'João Silva',
                    serviceType: 'CONSULTA',
                })
                .expect(201);

            const entryId = createResponse.body.id;

            await app
                .patch(`/api/queue/${entryId}/start`)
                .set('Authorization', `Bearer ${recepcaoToken}`)
                .expect(400);
        });
    });
});

