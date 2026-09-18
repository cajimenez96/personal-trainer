import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required to run seed.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function getSuperAdminCredentials() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || "admin@plataforma.com";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "AdminPlatform2026!";
  const name = process.env.SEED_SUPERADMIN_NAME || "SuperAdmin Plataforma";

  if (password.length < 8) {
    throw new Error("SEED_SUPERADMIN_PASSWORD must be at least 8 characters long.");
  }

  return { email, password, name };
}

const EXERCISES: {
  name: string;
  primaryMuscle: string;
  secondaryMuscle: string;
  videoUrl: string;
}[] = [
  {
    name: "Sentadilla con barra trasera (Back Squat)",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, erectores espinales, abdomen",
    videoUrl: "https://www.youtube.com/shorts/bEv6CCg2BC8",
  },
  {
    name: "Sentadilla búlgara",
    primaryMuscle: "Cuádriceps / Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductores, core",
    videoUrl: "https://www.youtube.com/shorts/2C-uNgKwPLE",
  },
  {
    name: "Prensa inclinada a 45°",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteo mayor, aductor mayor",
    videoUrl: "https://www.youtube.com/shorts/sPrDYXaoR0s",
  },
  {
    name: "Extensión de piernas en máquina",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Ninguno (aislamiento monoarticular)",
    videoUrl: "https://www.youtube.com/shorts/m0BgSmkWx3c",
  },
  {
    name: "Peso muerto rumano (RDL)",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Glúteo mayor, erectores espinales, antebrazos",
    videoUrl: "https://www.youtube.com/shorts/_oyxCn2iSjU",
  },
  {
    name: "Curl femoral acostado o sentado",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "https://www.youtube.com/shorts/ELOCsoDSmrg",
  },
  {
    name: "Empuje de cadera (Hip Thrust)",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductor mayor, erectores espinales",
    videoUrl: "https://www.youtube.com/shorts/SEdqd1n0cvg",
  },
  {
    name: "Elevación de talones de pie",
    primaryMuscle: "Gemelos (Gastrocnemio)",
    secondaryMuscle: "Sóleo, tibial posterior",
    videoUrl: "https://www.youtube.com/shorts/3UWi44yN-wE",
  },
  {
    name: "Elevación de talones sentado",
    primaryMuscle: "Sóleo",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "https://www.youtube.com/shorts/JbyjNymZOtE",
  },
  {
    name: "Press de banca plano con barra",
    primaryMuscle: "Pectoral mayor (medio e inferior)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "https://www.youtube.com/shorts/4Y2ZdHCOXok",
  },
  {
    name: "Press inclinado con mancuernas",
    primaryMuscle: "Pectoral mayor (haz clavicular / superior)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "https://www.youtube.com/shorts/8iPEnn-ltC8",
  },
  {
    name: "Aperturas / Cruce de poleas (Cable Flyes)",
    primaryMuscle: "Pectoral mayor",
    secondaryMuscle: "Deltoides anterior, bíceps braquial (cabeza corta)",
    videoUrl: "https://www.youtube.com/shorts/Iwe6AmxVf7o",
  },
  {
    name: "Fondos en paralelas (Dips)",
    primaryMuscle: "Pectoral mayor / Tríceps braquial",
    secondaryMuscle: "Deltoides anterior, romboides",
    videoUrl: "https://www.youtube.com/shorts/2z8JmcrW-As",
  },
  {
    name: "Dominadas pronas (Pull-ups)",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle:
      "Bíceps braquial, braquial anterior, redondo mayor, trapecio medio/inferior",
    videoUrl: "https://www.youtube.com/shorts/eGo4IYlbE5g",
  },
  {
    name: "Remo con barra (Pendlay o 45°)",
    primaryMuscle: "Espalda media (Dorsal / Romboides)",
    secondaryMuscle:
      "Trapecio, deltoides posterior, bíceps braquial, erectores espinales",
    videoUrl: "https://www.youtube.com/shorts/FWJR5Ve8gkY",
  },
  {
    name: "Jalón al pecho en polea (Lat Pulldown)",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps braquial, braquiorradial, redondo mayor",
    videoUrl: "https://www.youtube.com/shorts/CAwf7n6Luuc",
  },
  {
    name: "Remo unilateral con mancuerna",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Romboides, deltoides posterior, bíceps braquial",
    videoUrl: "https://www.youtube.com/shorts/dFzUjzfih7k",
  },
  {
    name: "Press militar de pie con barra (OHP)",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle:
      "Deltoides lateral, tríceps braquial, trapecio superior, core",
    videoUrl: "https://www.youtube.com/shorts/2yjwXTZQDDI",
  },
  {
    name: "Elevaciones laterales con mancuernas / polea",
    primaryMuscle: "Deltoides lateral",
    secondaryMuscle: "Deltoides anterior, trapecio superior",
    videoUrl: "https://www.youtube.com/shorts/3VcKaXpzqRo",
  },
  {
    name: "Pájaros / Reverse Pec Deck",
    primaryMuscle: "Deltoides posterior",
    secondaryMuscle: "Romboides, trapecio medio, infraespinoso",
    videoUrl: "https://www.youtube.com/shorts/5YK4bgzXDp0",
  },
  {
    name: "Press francés con barra Z",
    primaryMuscle: "Tríceps braquial (énfasis cabeza larga)",
    secondaryMuscle: "Deltoides anterior, antebrazos",
    videoUrl: "https://www.youtube.com/shorts/d_KZxkY_0cM",
  },
  {
    name: "Extensión de tríceps en polea alta (cuerda)",
    primaryMuscle: "Tríceps braquial (cabeza lateral y medial)",
    secondaryMuscle: "Antebrazos",
    videoUrl: "https://www.youtube.com/shorts/6SS6K3lAwZ8",
  },
  {
    name: "Curl de bíceps con barra recta",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "https://www.youtube.com/shorts/i1YgFZB6alI",
  },
  {
    name: "Curl martillo con mancuernas",
    primaryMuscle: "Braquiorradial / Braquial anterior",
    secondaryMuscle: "Bíceps braquial",
    videoUrl: "https://www.youtube.com/shorts/zC3nLlEvin4",
  },
  {
    name: "Curl bayesian / en polea detrás del cuerpo",
    primaryMuscle: "Bíceps braquial (cabeza larga)",
    secondaryMuscle: "Braquial anterior",
    videoUrl: "https://www.youtube.com/shorts/x8f2M96JgT0",
  },
  {
    name: "Rueda abdominal (Ab Wheel Rollout)",
    primaryMuscle: "Recto abdominal",
    secondaryMuscle: "Dorsal ancho, deltoides anterior, flexores de cadera",
    videoUrl: "https://www.youtube.com/shorts/rqi9vL_Bf30",
  },
  {
    name: "Elevación de piernas colgado",
    primaryMuscle: "Recto abdominal (porción inferior)",
    secondaryMuscle: "Flexores de cadera (psoas ilíaco), antebrazos",
    videoUrl: "https://www.youtube.com/shorts/hdng3Nm1x_E",
  },
];

const OBJETIVOS = [
  "Hipertrofia",
  "Fuerza",
  "Pérdida de Grasa",
  "Salud / Postural",
  "Rendimiento Deportivo",
  "Recomposición Corporal",
];

const MODALIDADES = [
  "Gimnasio",
  "En Casa / Calistenia",
  "Híbrido",
  "Personalizado 1 a 1",
];

async function main() {
  console.log("\n=================================================");
  console.log("🏋️  RESET & SEED DE BASE DE DATOS (SUPERADMIN + MASTER)");
  console.log("=================================================");

  console.log("🧹 Limpiando base de datos completa...");
  // Borrado en orden inverso a dependencias de foreign keys
  await db.payment.deleteMany();
  await db.studentSubscription.deleteMany();
  await db.bodyWeightLog.deleteMany();
  await db.progressLog.deleteMany();
  await db.routineOverride.deleteMany();
  await db.assignedRoutine.deleteMany();
  await db.exerciseBlock.deleteMany();
  await db.trainingDay.deleteMany();
  await db.routineTemplate.deleteMany();
  await db.genericProfile.deleteMany();
  await db.plan.deleteMany();
  await db.student.deleteMany();
  await db.exercise.deleteMany();
  await db.trainer.deleteMany();
  await db.objetivo.deleteMany();
  await db.modalidad.deleteMany();
  console.log("✅ Tablas limpiadas por completo.");

  // 1. SuperAdmin (Dueño de la plataforma)
  const { email, password, name } = getSuperAdminCredentials();
  const superAdminHash = await bcrypt.hash(password, 10);
  const superAdmin = await db.trainer.create({
    data: {
      email,
      passwordHash: superAdminHash,
      name,
      role: "SUPERADMIN",
      slug: "admin-master",
      isActive: true,
      maxPlans: 999,
      maxStudents: 9999,
    },
  });
  console.log(`✅ SuperAdmin creado: ${superAdmin.email}`);

  // 2. Ejercicios (Biblioteca compartida master)
  console.log("📚 Sincronizando catálogo master de ejercicios...");
  for (const exercise of EXERCISES) {
    await db.exercise.create({
      data: {
        ...exercise,
        trainerId: null,
      },
    });
  }
  console.log(`✅ ${EXERCISES.length} ejercicios master sincronizados`);

  // 3. Taxonomías base
  for (const label of OBJETIVOS) {
    await db.objetivo.create({ data: { label } });
  }
  for (const label of MODALIDADES) {
    await db.modalidad.create({ data: { label } });
  }
  console.log(
    `✅ Taxonomías sincronizadas (${OBJETIVOS.length} objetivos, ${MODALIDADES.length} modalidades)`
  );

  console.log("\n=================================================");
  console.log("✨ BASE DE DATOS REINICIADA Y LISTA PARA PRUEBAS");
  console.log("=================================================");
  console.log("📋 DATOS DE ACCESO SUPERADMIN:");
  console.log(`   URL:      http://localhost:3000/login`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Rol:      SUPERADMIN`);
  console.log(`   Destino:  /superadmin (Dashboard SaaS)`);
  console.log("=================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
