import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { getTestApp } from "./helpers";
import { cleanupDatabase, createTestUser, getAuthToken } from "./setup";

const hasDatabase = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabase)("Auth Routes Integration Tests", () => {
    const app = getTestApp();

    beforeAll(async () => {
        await cleanupDatabase();
    });

    afterEach(async () => {
        await cleanupDatabase();
    });

    describe("POST /api/auth/login", () => {
        it("should login successfully with correct credentials", async () => {
            // Criar usuário de teste
            const testUser = await createTestUser();
            const testPassword = "testpass";

            // Fazer login
            const response = await app
                .post("/api/auth/login")
                .send({
                    username: testUser.username,
                    password: testPassword,
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body).toHaveProperty("user");
            expect(response.body.user.username).toBe(testUser.username);
        });

        it("should fail with incorrect password", async () => {
            const testUser = await createTestUser();

            const response = await app
                .post("/api/auth/login")
                .send({
                    username: testUser.username,
                    password: "wrongpassword",
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Credenciais inválidas");
        });

        it("should fail with non-existent username", async () => {
            const response = await app
                .post("/api/auth/login")
                .send({
                    username: "nonexistent",
                    password: "anypassword",
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Credenciais inválidas");
        });

        it("should handle password with leading/trailing spaces correctly", async () => {
            const testUser = await createTestUser();
            const testPassword = "testpass";

            // Testar com espaços (deve fazer trim)
            const response = await app
                .post("/api/auth/login")
                .send({
                    username: testUser.username,
                    password: `  ${testPassword}  `, // Espaços antes e depois
                });

            // Deve funcionar porque fazemos trim() no schema
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token");
        });

        it("should handle empty password", async () => {
            const testUser = await createTestUser();

            const response = await app
                .post("/api/auth/login")
                .send({
                    username: testUser.username,
                    password: "",
                });

            expect(response.status).toBe(400); // Zod validation error
        });

        it("should handle empty username", async () => {
            const response = await app
                .post("/api/auth/login")
                .send({
                    username: "",
                    password: "anypassword",
                });

            expect(response.status).toBe(400); // Zod validation error
        });
    });

    describe("POST /api/auth/test-bcrypt", () => {
        it("should test bcrypt comparison with correct password", async () => {
            const testUser = await createTestUser();
            const testPassword = "testpass";

            const response = await app
                .post("/api/auth/test-bcrypt")
                .send({
                    username: testUser.username,
                    password: testPassword,
                });

            expect(response.status).toBe(200);
            expect(response.body.compareWithStored).toBe(true);
            expect(response.body.compareWithNew).toBe(true);
        });

        it("should test bcrypt comparison with incorrect password", async () => {
            const testUser = await createTestUser();

            const response = await app
                .post("/api/auth/test-bcrypt")
                .send({
                    username: testUser.username,
                    password: "wrongpassword",
                });

            expect(response.status).toBe(200);
            expect(response.body.compareWithStored).toBe(false);
            expect(response.body.compareWithNew).toBe(true); // Novo hash sempre funciona
        });
    });
});

