import { beforeAll, describe, expect, it } from "vitest"
import request from "supertest"

beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test"
  process.env.JWT_SECRET ??= "test-secret-test-secret"
})

describe("API", () => {
  it("reports health", async () => {
    const { app } = await import("../../backend/src/app.js")
    const res = await request(app).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })

  it("rejects unauthenticated access", async () => {
    const { app } = await import("../../backend/src/app.js")
    const res = await request(app).get("/api/auth/me")
    expect(res.status).toBe(401)
  })

  it("validates login input", async () => {
    const { app } = await import("../../backend/src/app.js")
    const res = await request(app).post("/api/auth/login").send({ email: "nope" })
    expect(res.status).toBe(400)
  })
})
