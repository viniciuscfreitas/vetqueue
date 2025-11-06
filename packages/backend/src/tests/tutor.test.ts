import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getTestApp } from './helpers';
import { cleanupDatabase, createTestUser, getAuthToken } from './setup';

const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)('Tutor API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await cleanupDatabase();
    const user = await createTestUser();
    userId = user.id;
    authToken = await getAuthToken(userId);
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  it('should create tutor, create patient with tutorId, and list pets', async () => {
    const app = getTestApp();

    const createTutorResponse = await app
      .post('/api/tutors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@example.com',
      })
      .expect(201);

    const tutor = createTutorResponse.body;
    expect(tutor.id).toBeDefined();
    expect(tutor.name).toBe('João Silva');

    const createPatientResponse = await app
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Rex',
        species: 'Cão',
        breed: 'Labrador',
        tutorId: tutor.id,
      })
      .expect(201);

    const patient = createPatientResponse.body;
    expect(patient.id).toBeDefined();
    expect(patient.name).toBe('Rex');
    expect(patient.tutorId).toBe(tutor.id);

    const listPetsResponse = await app
      .get(`/api/tutors/${tutor.id}/patients`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const pets = listPetsResponse.body;
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe(patient.id);
    expect(pets[0].name).toBe('Rex');
  });

  it('should create patient with tutor data and automatically create/find tutor', async () => {
    const app = getTestApp();

    const createPatientResponse = await app
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Bella',
        species: 'Gato',
        tutorName: 'Maria Santos',
        tutorPhone: '11888888888',
        tutorEmail: 'maria@example.com',
      })
      .expect(201);

    const patient = createPatientResponse.body;
    expect(patient.id).toBeDefined();
    expect(patient.name).toBe('Bella');
    expect(patient.tutorId).toBeDefined();
    expect(patient.tutorName).toBe('Maria Santos');

    const tutorResponse = await app
      .get(`/api/tutors/${patient.tutorId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const tutor = tutorResponse.body;
    expect(tutor.name).toBe('Maria Santos');
    expect(tutor.phone).toBe('11888888888');

    const createSecondPatientResponse = await app
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Luna',
        species: 'Gato',
        tutorName: 'Maria Santos',
        tutorPhone: '11888888888',
      })
      .expect(201);

    const secondPatient = createSecondPatientResponse.body;
    expect(secondPatient.tutorId).toBe(patient.tutorId);
  });

  it('should not allow deleting tutor with pets', async () => {
    const app = getTestApp();

    const createTutorResponse = await app
      .post('/api/tutors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Pedro Costa',
        phone: '11777777777',
      })
      .expect(201);

    const tutor = createTutorResponse.body;

    await app
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Max',
        species: 'Cão',
        tutorId: tutor.id,
      })
      .expect(201);

    await app
      .delete(`/api/tutors/${tutor.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    const tutorStillExists = await app
      .get(`/api/tutors/${tutor.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(tutorStillExists.body.id).toBe(tutor.id);
  });
});

