import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const TEST_TRAINER = {
  email: "trainer@test.com",
  password: "trainer123",
  name: "Trainer de Prueba",
}

async function main() {
  const passwordHash = await bcrypt.hash(TEST_TRAINER.password, 10)

  await db.trainer.upsert({
    where: { email: TEST_TRAINER.email },
    update: {},
    create: {
      email: TEST_TRAINER.email,
      passwordHash,
      name: TEST_TRAINER.name,
    },
  })

  console.log(`Seeded trainer: ${TEST_TRAINER.email} / ${TEST_TRAINER.password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
