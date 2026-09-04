import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required to run seed.")
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

function getAdminCredentials() {
  const email = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
  const name = process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || "Santiago Ramón"

  if (!email || !password) {
    throw new Error(
      "Missing required seed credentials. Please define SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your environment variables."
    )
  }

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters long.")
  }

  return { email, password, name }
}

const EXERCISES: { name: string; primaryMuscle: string; secondaryMuscle: string }[] = [
  { name: "Sentadilla con barra trasera (Back Squat)", primaryMuscle: "Cuádriceps", secondaryMuscle: "Glúteos, aductores, erectores espinales, abdomen" },
  { name: "Sentadilla búlgara", primaryMuscle: "Cuádriceps / Glúteo mayor", secondaryMuscle: "Isquiosurales, aductores, core" },
  { name: "Prensa inclinada a 45°", primaryMuscle: "Cuádriceps", secondaryMuscle: "Glúteo mayor, aductor mayor" },
  { name: "Extensión de piernas en máquina", primaryMuscle: "Cuádriceps", secondaryMuscle: "Ninguno (aislamiento monoarticular)" },
  { name: "Peso muerto rumano (RDL)", primaryMuscle: "Isquiosurales", secondaryMuscle: "Glúteo mayor, erectores espinales, antebrazos" },
  { name: "Curl femoral acostado o sentado", primaryMuscle: "Isquiosurales", secondaryMuscle: "Gemelos (gastrocnemio)" },
  { name: "Empuje de cadera (Hip Thrust)", primaryMuscle: "Glúteo mayor", secondaryMuscle: "Isquiosurales, aductor mayor, erectores espinales" },
  { name: "Elevación de talones de pie", primaryMuscle: "Gemelos (Gastrocnemio)", secondaryMuscle: "Sóleo, tibial posterior" },
  { name: "Elevación de talones sentado", primaryMuscle: "Sóleo", secondaryMuscle: "Gemelos (gastrocnemio)" },
  { name: "Press de banca plano con barra", primaryMuscle: "Pectoral mayor (medio e inferior)", secondaryMuscle: "Deltoides anterior, tríceps braquial" },
  { name: "Press inclinado con mancuernas", primaryMuscle: "Pectoral mayor (haz clavicular / superior)", secondaryMuscle: "Deltoides anterior, tríceps braquial" },
  { name: "Aperturas / Cruce de poleas (Cable Flyes)", primaryMuscle: "Pectoral mayor", secondaryMuscle: "Deltoides anterior, bíceps braquial (cabeza corta)" },
  { name: "Fondos en paralelas (Dips)", primaryMuscle: "Pectoral mayor / Tríceps braquial", secondaryMuscle: "Deltoides anterior, romboides" },
  { name: "Dominadas pronas (Pull-ups)", primaryMuscle: "Dorsal ancho", secondaryMuscle: "Bíceps braquial, braquial anterior, redondo mayor, trapecio medio/inferior" },
  { name: "Remo con barra (Pendlay o 45°)", primaryMuscle: "Espalda media (Dorsal / Romboides)", secondaryMuscle: "Trapecio, deltoides posterior, bíceps braquial, erectores espinales" },
  { name: "Jalón al pecho en polea (Lat Pulldown)", primaryMuscle: "Dorsal ancho", secondaryMuscle: "Bíceps braquial, braquiorradial, redondo mayor" },
  { name: "Remo unilateral con mancuerna", primaryMuscle: "Dorsal ancho", secondaryMuscle: "Romboides, deltoides posterior, bíceps braquial" },
  { name: "Press militar de pie con barra (OHP)", primaryMuscle: "Deltoides anterior", secondaryMuscle: "Deltoides lateral, tríceps braquial, trapecio superior, core" },
  { name: "Elevaciones laterales con mancuernas / polea", primaryMuscle: "Deltoides lateral", secondaryMuscle: "Deltoides anterior, trapecio superior" },
  { name: "Pájaros / Reverse Pec Deck", primaryMuscle: "Deltoides posterior", secondaryMuscle: "Romboides, trapecio medio, infraespinoso" },
  { name: "Press francés con barra Z", primaryMuscle: "Tríceps braquial (énfasis cabeza larga)", secondaryMuscle: "Deltoides anterior, antebrazos" },
  { name: "Extensión de tríceps en polea alta (cuerda)", primaryMuscle: "Tríceps braquial (cabeza lateral y medial)", secondaryMuscle: "Antebrazos" },
  { name: "Curl de bíceps con barra recta", primaryMuscle: "Bíceps braquial", secondaryMuscle: "Braquial anterior, braquiorradial" },
  { name: "Curl martillo con mancuernas", primaryMuscle: "Braquiorradial / Braquial anterior", secondaryMuscle: "Bíceps braquial" },
  { name: "Curl bayesian / en polea detrás del cuerpo", primaryMuscle: "Bíceps braquial (cabeza larga)", secondaryMuscle: "Braquial anterior" },
  { name: "Rueda abdominal (Ab Wheel Rollout)", primaryMuscle: "Recto abdominal", secondaryMuscle: "Dorsal ancho, deltoides anterior, flexores de cadera" },
  { name: "Elevación de piernas colgado", primaryMuscle: "Recto abdominal (porción inferior)", secondaryMuscle: "Flexores de cadera (psoas ilíaco), antebrazos" },
]

async function main() {
  const { email, password, name } = getAdminCredentials()
  const passwordHash = await bcrypt.hash(password, 10)

  // Solo debe existir un trainer (single-coach MVP) — limpia cualquier otro
  // que haya quedado de un seed anterior antes de crear el real.
  await db.trainer.deleteMany({ where: { email: { not: email } } })

  await db.trainer.upsert({
    where: { email },
    update: { passwordHash, name },
    create: {
      email,
      passwordHash,
      name,
    },
  })

  for (const exercise of EXERCISES) {
    await db.exercise.upsert({
      where: { name: exercise.name },
      update: {
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscle: exercise.secondaryMuscle,
      },
      create: exercise,
    })
  }

  console.log(`Seeded trainer: ${email} (${name})`)
  console.log(`Seeded ${EXERCISES.length} exercises`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
