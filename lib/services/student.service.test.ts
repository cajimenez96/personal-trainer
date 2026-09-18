import { describe, expect, it } from "vitest"
import {
  DniAlreadyExistsError,
  StudentLimitReachedError,
  StudentService,
} from "./student.service"
import type {
  CreateStudentData,
  IStudentRepository,
  StudentListParams,
  StudentListResult,
  UpdateStudentData,
} from "@/lib/repositories/interfaces"
import type { Student } from "@/app/generated/prisma/client"

class FakeStudentRepository implements IStudentRepository {
  private students: (Student & { trainerId: string })[] = []

  async findMany(params: StudentListParams): Promise<StudentListResult> {
    const items = this.students.filter(
      (s) => !params.trainerId || s.trainerId === params.trainerId,
    )
    return { items: items as any, nextCursor: null }
  }

  async findById(id: string): Promise<Student | null> {
    return (this.students.find((s) => s.id === id) as any) ?? null
  }

  async findByDni(dni: string, trainerId?: string): Promise<Student | null> {
    return (
      (this.students.find(
        (s) => s.dni === dni && (!trainerId || s.trainerId === trainerId),
      ) as any) ?? null
    )
  }

  async create(data: CreateStudentData): Promise<Student> {
    const student: Student & { trainerId: string } = {
      id: `student-${Date.now()}-${Math.random()}`,
      trainerId: data.trainerId ?? "default-trainer-id",
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      email: data.email ?? null,
      phone: data.phone ?? null,
      objetivoId: data.objetivoId ?? null,
      secondaryGoals: data.secondaryGoals ?? null,
      nivel: data.nivel ?? null,
      modalidadId: data.modalidadId ?? null,
      membershipStartsAt: data.membershipStartsAt ?? null,
      paymentExpiresAt: data.paymentExpiresAt ?? null,
      accessOverride: data.accessOverride ?? "auto",
      healthNotes: data.healthNotes ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.students.push(student)
    return student as any
  }

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const s = this.students.find((x) => x.id === id)
    if (!s) throw new Error("not found")
    Object.assign(s, data)
    return s as any
  }

  async deactivate(id: string): Promise<Student> {
    const s = this.students.find((x) => x.id === id)
    if (!s) throw new Error("not found")
    s.isActive = false
    return s as any
  }

  async reactivate(id: string): Promise<Student> {
    const s = this.students.find((x) => x.id === id)
    if (!s) throw new Error("not found")
    s.isActive = true
    return s as any
  }

  async findAllActive(): Promise<Student[]> {
    return this.students.filter((s) => s.isActive) as any
  }

  async countActive(trainerId?: string): Promise<number> {
    return this.students.filter(
      (s) => s.isActive && (!trainerId || s.trainerId === trainerId),
    ).length
  }

  async countExpiringSoon(): Promise<number> {
    return 0
  }
}

describe("StudentService Multi-tenant Isolation", () => {
  it("allows different trainers to have students with the same DNI", async () => {
    const repo = new FakeStudentRepository()
    const service = new StudentService(repo, async () => null)

    const student1 = await service.create({
      trainerId: "trainer-1",
      firstName: "Juan",
      lastName: "Perez",
      dni: "10000001",
    })

    const student2 = await service.create({
      trainerId: "trainer-2",
      firstName: "Carlos",
      lastName: "Gomez",
      dni: "10000001",
    })

    expect(student1.dni).toBe("10000001")
    expect(student2.dni).toBe("10000001")
    expect(student1.id).not.toBe(student2.id)
  })

  it("prevents duplicate DNI for the SAME trainer", async () => {
    const repo = new FakeStudentRepository()
    const service = new StudentService(repo, async () => null)

    await service.create({
      trainerId: "trainer-1",
      firstName: "Juan",
      lastName: "Perez",
      dni: "10000001",
    })

    await expect(
      service.create({
        trainerId: "trainer-1",
        firstName: "Pedro",
        lastName: "Lopez",
        dni: "10000001",
      }),
    ).rejects.toThrow(DniAlreadyExistsError)
  })

  it("enforces maxStudents limit on creation", async () => {
    const repo = new FakeStudentRepository()
    const service = new StudentService(repo, async () => ({ maxStudents: 2 }))

    await service.create({
      trainerId: "trainer-1",
      firstName: "Student 1",
      lastName: "One",
      dni: "10000001",
    })
    await service.create({
      trainerId: "trainer-1",
      firstName: "Student 2",
      lastName: "Two",
      dni: "10000002",
    })

    await expect(
      service.create({
        trainerId: "trainer-1",
        firstName: "Student 3",
        lastName: "Three",
        dni: "10000003",
      }),
    ).rejects.toThrow(StudentLimitReachedError)
  })

  it("enforces maxStudents limit on reactivation", async () => {
    const repo = new FakeStudentRepository()
    const service = new StudentService(repo, async () => ({ maxStudents: 2 }))

    const s1 = await service.create({
      trainerId: "trainer-1",
      firstName: "Student 1",
      lastName: "One",
      dni: "10000001",
    })
    const s2 = await service.create({
      trainerId: "trainer-1",
      firstName: "Student 2",
      lastName: "Two",
      dni: "10000002",
    })

    // Deactivate s1 so active count becomes 1
    await service.deactivate(s1.id)

    // Create s3 so active count is 2 again
    await service.create({
      trainerId: "trainer-1",
      firstName: "Student 3",
      lastName: "Three",
      dni: "10000003",
    })

    // Reactivating s1 should now exceed maxStudents (2)
    await expect(service.reactivate(s1.id)).rejects.toThrow(StudentLimitReachedError)
  })
})
