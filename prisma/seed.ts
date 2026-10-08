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
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
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
    secondaryMuscle: "Bíceps braquial, braquial anterior, redondo mayor, trapecio medio/inferior",
    videoUrl: "https://www.youtube.com/shorts/eGo4IYlbE5g",
  },
  {
    name: "Remo con barra (Pendlay o 45°)",
    primaryMuscle: "Espalda media (Dorsal / Romboides)",
    secondaryMuscle: "Trapecio, deltoides posterior, bíceps braquial, erectores espinales",
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
    secondaryMuscle: "Deltoides lateral, tríceps braquial, trapecio superior, core",
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
  {
    name: "Sentadilla frontal con barra",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, abdomen, erectores espinales",
    videoUrl: "",
  },
  {
    name: "Sentadilla con barra alta",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, core",
    videoUrl: "",
  },
  {
    name: "Sentadilla en máquina Smith",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, isquiosurales",
    videoUrl: "",
  },
  {
    name: "Hack squat en máquina",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores",
    videoUrl: "",
  },
  {
    name: "Prensa horizontal",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, isquiosurales",
    videoUrl: "",
  },
  {
    name: "Zancadas caminando con mancuernas",
    primaryMuscle: "Cuádriceps / Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductores, core",
    videoUrl: "",
  },
  {
    name: "Zancada atrás con mancuernas",
    primaryMuscle: "Glúteo mayor / Cuádriceps",
    secondaryMuscle: "Isquiosurales, aductores, core",
    videoUrl: "",
  },
  {
    name: "Step-up con mancuernas",
    primaryMuscle: "Glúteo mayor / Cuádriceps",
    secondaryMuscle: "Isquiosurales, gemelos, core",
    videoUrl: "",
  },
  {
    name: "Peso muerto rumano con mancuernas",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Glúteo mayor, erectores espinales, antebrazos",
    videoUrl: "",
  },
  {
    name: "Peso muerto rumano a una pierna con mancuerna",
    primaryMuscle: "Isquiosurales / Glúteo mayor",
    secondaryMuscle: "Glúteo medio, aductores, core",
    videoUrl: "",
  },
  {
    name: "Buenos días con barra",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Glúteo mayor, erectores espinales",
    videoUrl: "",
  },
  {
    name: "Buenos días en Smith",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Glúteo mayor, erectores espinales",
    videoUrl: "",
  },
  {
    name: "Curl femoral sentado",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "",
  },
  {
    name: "Curl femoral de pie unilateral en máquina",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Gemelos",
    videoUrl: "",
  },
  {
    name: "Curl femoral acostado unilateral",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Gemelos",
    videoUrl: "",
  },
  {
    name: "Aductores en máquina",
    primaryMuscle: "Aductores",
    secondaryMuscle: "Glúteo mayor, pectíneo",
    videoUrl: "",
  },
  {
    name: "Aductores en polea baja",
    primaryMuscle: "Aductores",
    secondaryMuscle: "Pectíneo, gracilis",
    videoUrl: "",
  },
  {
    name: "Abductores en máquina",
    primaryMuscle: "Glúteo medio / Glúteo menor",
    secondaryMuscle: "Tensor de la fascia lata",
    videoUrl: "",
  },
  {
    name: "Abducción de cadera en polea baja",
    primaryMuscle: "Glúteo medio",
    secondaryMuscle: "Glúteo menor, tensor de la fascia lata",
    videoUrl: "",
  },
  {
    name: "Patada de glúteo en polea baja",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, glúteo medio",
    videoUrl: "https://www.youtube.com/watch?v=5iXaaPuR2ko",
  },
  {
    name: "Hip thrust en máquina",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductor mayor",
    videoUrl: "",
  },
  {
    name: "Hip thrust con barra",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductor mayor",
    videoUrl: "",
  },
  {
    name: "Glute bridge con barra",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductores",
    videoUrl: "",
  },
  {
    name: "Pull-through en polea",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, erectores espinales",
    videoUrl: "",
  },
  {
    name: "Elevación de talones en prensa",
    primaryMuscle: "Gemelos (Gastrocnemio)",
    secondaryMuscle: "Sóleo",
    videoUrl: "",
  },
  {
    name: "Elevación de talones en máquina de gemelos",
    primaryMuscle: "Gemelos (Gastrocnemio)",
    secondaryMuscle: "Sóleo",
    videoUrl: "",
  },
  {
    name: "Elevación de talones sentado en máquina",
    primaryMuscle: "Sóleo",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "",
  },
  {
    name: "Press plano en máquina",
    primaryMuscle: "Pectoral mayor",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "https://www.youtube.com/watch?v=RFjvDpDN3ic",
  },
  {
    name: "Press inclinado en máquina",
    primaryMuscle: "Pectoral mayor (haz clavicular)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "",
  },
  {
    name: "Press declinado en máquina",
    primaryMuscle: "Pectoral mayor (medio/inferior)",
    secondaryMuscle: "Tríceps braquial, deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Apertura en máquina (Pec Deck)",
    primaryMuscle: "Pectoral mayor",
    secondaryMuscle: "Deltoides anterior",
    videoUrl: "https://www.youtube.com/watch?v=mrS3x_IaccQ",
  },
  {
    name: "Cruce de poleas alto a bajo",
    primaryMuscle: "Pectoral mayor (fibras esternales/inferiores)",
    secondaryMuscle: "Deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Cruce de poleas bajo a alto",
    primaryMuscle: "Pectoral mayor (haz clavicular)",
    secondaryMuscle: "Deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Press cerrado con barra",
    primaryMuscle: "Tríceps braquial",
    secondaryMuscle: "Pectoral mayor, deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Press inclinado con barra",
    primaryMuscle: "Pectoral mayor (haz clavicular)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "",
  },
  {
    name: "Press con mancuernas plano",
    primaryMuscle: "Pectoral mayor",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "",
  },
  {
    name: "Press con mancuernas declinado",
    primaryMuscle: "Pectoral mayor (fibras inferiores)",
    secondaryMuscle: "Tríceps braquial, deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Press militar con máquina",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle: "Deltoides lateral, tríceps braquial, trapecio superior",
    videoUrl: "https://www.youtube.com/watch?v=6-FxadmQrSM",
  },
  {
    name: "Press Arnold con mancuernas",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle: "Deltoides lateral, tríceps braquial",
    videoUrl: "",
  },
  {
    name: "Press sentado con mancuernas",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle: "Deltoides lateral, tríceps braquial",
    videoUrl: "",
  },
  {
    name: "Elevación lateral unilateral en polea",
    primaryMuscle: "Deltoides lateral",
    secondaryMuscle: "Trapecio superior, deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Elevación lateral en máquina",
    primaryMuscle: "Deltoides lateral",
    secondaryMuscle: "Trapecio superior",
    videoUrl: "",
  },
  {
    name: "Elevación frontal con mancuernas",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle: "Deltoides lateral, trapecio superior",
    videoUrl: "",
  },
  {
    name: "Elevación frontal en polea",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle: "Deltoides lateral, pectoral superior",
    videoUrl: "",
  },
  {
    name: "Reverse fly en máquina",
    primaryMuscle: "Deltoides posterior",
    secondaryMuscle: "Romboides, trapecio medio, infraespinoso",
    videoUrl: "",
  },
  {
    name: "Face pull en polea con cuerda",
    primaryMuscle: "Deltoides posterior",
    secondaryMuscle: "Trapecio medio/inferior, rotadores externos",
    videoUrl: "",
  },
  {
    name: "Remo al mentón con polea",
    primaryMuscle: "Deltoides lateral",
    secondaryMuscle: "Trapecio superior, bíceps",
    videoUrl: "",
  },
  {
    name: "Encogimientos con barra",
    primaryMuscle: "Trapecio superior",
    secondaryMuscle: "Elevador de la escápula, antebrazos",
    videoUrl: "",
  },
  {
    name: "Encogimientos con mancuernas",
    primaryMuscle: "Trapecio superior",
    secondaryMuscle: "Elevador de la escápula, antebrazos",
    videoUrl: "",
  },
  {
    name: "Remo sentado en polea",
    primaryMuscle: "Dorsal ancho / Espalda media",
    secondaryMuscle: "Romboides, trapecio, bíceps",
    videoUrl: "",
  },
  {
    name: "Remo sentado con agarre neutro",
    primaryMuscle: "Dorsal ancho / Romboides",
    secondaryMuscle: "Trapecio medio, bíceps",
    videoUrl: "",
  },
  {
    name: "Remo en máquina con pecho apoyado",
    primaryMuscle: "Espalda media",
    secondaryMuscle: "Dorsal ancho, romboides, deltoides posterior, bíceps",
    videoUrl: "",
  },
  {
    name: "Remo unilateral en máquina",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Romboides, trapecio, bíceps",
    videoUrl: "",
  },
  {
    name: "Jalón al pecho agarre neutro",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps, braquial, redondo mayor",
    videoUrl: "",
  },
  {
    name: "Jalón al pecho agarre supino",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps braquial, braquial anterior",
    videoUrl: "",
  },
  {
    name: "Jalón unilateral en polea",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps, redondo mayor",
    videoUrl: "",
  },
  {
    name: "Pullover en polea alta con cuerda",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Redondo mayor, tríceps (cabeza larga)",
    videoUrl: "",
  },
  {
    name: "Pullover en máquina",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Redondo mayor, tríceps (cabeza larga)",
    videoUrl: "",
  },
  {
    name: "Dominadas asistidas en máquina",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps, redondo mayor, trapecio",
    videoUrl: "",
  },
  {
    name: "Extensión de tríceps sobre la cabeza con cuerda",
    primaryMuscle: "Tríceps braquial (cabeza larga)",
    secondaryMuscle: "Ancóneo, antebrazos",
    videoUrl: "",
  },
  {
    name: "Extensión de tríceps unilateral en polea",
    primaryMuscle: "Tríceps braquial",
    secondaryMuscle: "Ancóneo, antebrazos",
    videoUrl: "",
  },
  {
    name: "Extensión de tríceps con barra recta en polea",
    primaryMuscle: "Tríceps braquial (cabezas lateral y medial)",
    secondaryMuscle: "Antebrazos",
    videoUrl: "",
  },
  {
    name: "Fondos asistidos en máquina",
    primaryMuscle: "Tríceps braquial / Pectoral mayor",
    secondaryMuscle: "Deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Press de tríceps en máquina",
    primaryMuscle: "Tríceps braquial",
    secondaryMuscle: "Pectoral mayor, deltoides anterior",
    videoUrl: "",
  },
  {
    name: "Bíceps Scott en máquina",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl Scott con barra Z",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl de pie en polea baja con barra recta",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl de pie en polea baja con cuerda",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl martillo con soga en polea baja",
    primaryMuscle: "Braquial / Braquiorradial",
    secondaryMuscle: "Bíceps braquial",
    videoUrl: "https://www.youtube.com/watch?v=QsFmiZAEZG0",
  },
  {
    name: "Curl unilateral en polea baja",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl concentrado con mancuerna",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior",
    videoUrl: "",
  },
  {
    name: "Curl inclinado con mancuernas",
    primaryMuscle: "Bíceps braquial (cabeza larga)",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
  },
  {
    name: "Curl predicador con mancuernas",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "",
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
  console.log("🌱 SINCRONIZACIÓN Y SEED DE PLATAFORMA (IDEMPOTENTE)");
  console.log("=================================================");

  // 1. SuperAdmin (Dueño de la plataforma)
  const { email, password, name } = getSuperAdminCredentials();
  const superAdminHash = await bcrypt.hash(password, 10);
  const superAdmin = await db.trainer.upsert({
    where: { email },
    update: {
      name,
      role: "SUPERADMIN",
      isActive: true,
      maxPlans: 999,
      maxStudents: 9999,
    },
    create: {
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
  console.log(`✅ SuperAdmin sincronizado: ${superAdmin.email}`);

  // 2. Planes de Plataforma (SaaS Tiers para Entrenadores)
  console.log("💼 Sincronizando planes de plataforma...");
  const PLATFORM_PLANS = [
    {
      name: "Plan Inicial",
      description: "Ideal para entrenadores que recién comienzan a digitalizar sus alumnos.",
      price: 15000,
      durationDays: 30,
      trialDays: 7,
      maxStudents: 15,
      maxPlans: 2,
      maxGenericProfiles: 3,
    },
    {
      name: "Plan Pro",
      description: "Para entrenadores activos con cartera consolidada de alumnos.",
      price: 30000,
      durationDays: 30,
      trialDays: 7,
      maxStudents: 50,
      maxPlans: 10,
      maxGenericProfiles: 10,
    },
    {
      name: "Plan Elite / Gimnasio",
      description: "Para centros de entrenamiento y coaches de alto volumen.",
      price: 60000,
      durationDays: 30,
      trialDays: 14,
      maxStudents: 200,
      maxPlans: 50,
      maxGenericProfiles: 30,
    },
  ];

  let planPro = null;
  for (const plan of PLATFORM_PLANS) {
    const saved = await db.platformPlan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        durationDays: plan.durationDays,
        trialDays: plan.trialDays,
        maxStudents: plan.maxStudents,
        maxPlans: plan.maxPlans,
        maxGenericProfiles: plan.maxGenericProfiles,
      },
      create: plan,
    });
    if (saved.name === "Plan Pro") planPro = saved;
  }
  console.log("✅ Planes de plataforma sincronizados (Inicial, Pro, Elite)");

  // 3. Taxonomías base (Objetivos y Modalidades)
  console.log("🏷️ Sincronizando taxonomías base...");
  const objetivosCreated = [];
  for (const label of OBJETIVOS) {
    const o = await db.objetivo.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    objetivosCreated.push(o);
  }

  const modalidadesCreated = [];
  for (const label of MODALIDADES) {
    const m = await db.modalidad.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    modalidadesCreated.push(m);
  }
  console.log(`✅ Taxonomías sincronizadas (${OBJETIVOS.length} objetivos, ${MODALIDADES.length} modalidades)`);

  // 4. Ejercicios (Biblioteca compartida master)
  console.log("📚 Sincronizando catálogo master de ejercicios...");
  let createdCount = 0;
  let updatedCount = 0;
  for (const exercise of EXERCISES) {
    const existing = await db.exercise.findFirst({
      where: { name: exercise.name, trainerId: null },
    });

    if (!existing) {
      await db.exercise.create({
        data: {
          ...exercise,
          trainerId: null,
        },
      });
      createdCount++;
    } else {
      await db.exercise.update({
        where: { id: existing.id },
        data: {
          primaryMuscle: exercise.primaryMuscle,
          secondaryMuscle: exercise.secondaryMuscle,
          videoUrl: exercise.videoUrl || existing.videoUrl,
        },
      });
      updatedCount++;
    }
  }
  console.log(`✅ ${EXERCISES.length} ejercicios master sincronizados (${createdCount} nuevos, ${updatedCount} actualizados)`);

  // 5. Entrenador Demo opcional para pruebas locales (Solo si no existe)
  if (planPro) {
    const existingDemoCoach = await db.trainer.findUnique({
      where: { email: "demo@coach.com" },
    });

    if (!existingDemoCoach) {
      console.log("👤 Creando entrenador demo de pruebas (primera vez)...");
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 30);
      const demoCoachHash = await bcrypt.hash("CoachDemo2026!", 10);

      const demoCoach = await db.trainer.create({
        data: {
          email: "demo@coach.com",
          passwordHash: demoCoachHash,
          name: "Profesor Demo",
          role: "COACH",
          slug: "coach-demo",
          businessName: "Demo Fitness Lab",
          whatsappNumber: "+5491199887766",
          platformPlanId: planPro.id,
          maxStudents: planPro.maxStudents,
          maxPlans: planPro.maxPlans,
          maxGenericProfiles: planPro.maxGenericProfiles,
          membershipExpiresAt: expiresDate,
          isActive: true,
        },
      });

      const subDemo = await db.trainerSubscription.create({
        data: {
          trainerId: demoCoach.id,
          planId: planPro.id,
          priceSnapshot: planPro.price,
          startDate: new Date(),
          expiresAt: expiresDate,
          status: "ACTIVE",
        },
      });

      await db.trainerPayment.create({
        data: {
          trainerId: demoCoach.id,
          subscriptionId: subDemo.id,
          amount: planPro.price,
          paidAt: new Date(),
          paymentMethod: "Efectivo",
          notes: "Suscripción Demo de pruebas",
        },
      });

      // Planes para sus alumnos
      const coachPlanMensual = await db.plan.create({
        data: {
          trainerId: demoCoach.id,
          name: "Plan Mensual Estándar",
          description: "Seguimiento personalizado, rutina mensual y soporte vía WhatsApp.",
          price: 25000,
          durationDays: 30,
          isActive: true,
        },
      });

      const coachPlanTrimestral = await db.plan.create({
        data: {
          trainerId: demoCoach.id,
          name: "Plan Trimestral Avanzado",
          description: "Plan de 12 semanas con ajustes quincenales y evaluación antropométrica.",
          price: 65000,
          durationDays: 90,
          isActive: true,
        },
      });

      // Plantilla de Rutina demo
      const routineTemplate = await db.routineTemplate.create({
        data: {
          trainerId: demoCoach.id,
          name: "Hipertrofia Torso-Pierna (4 Días)",
          description: "Rutina dividida en 4 días enfocada en sobrecarga progresiva y desarrollo muscular.",
          durationWeeks: 4,
        },
      });

      const masterExercises = await db.exercise.findMany({ take: 6 });
      if (masterExercises.length >= 3) {
        const day1 = await db.trainingDay.create({
          data: {
            templateId: routineTemplate.id,
            label: "Día 1 – Torso Fuerza e Hipertrofia",
            dayOrder: 1,
          },
        });

        const day2 = await db.trainingDay.create({
          data: {
            templateId: routineTemplate.id,
            label: "Día 2 – Pierna y Core",
            dayOrder: 2,
          },
        });

        await db.exerciseBlock.create({
          data: {
            trainingDayId: day1.id,
            exerciseId: masterExercises[0].id,
            sets: 4,
            reps: 8,
            restSecs: 90,
            blockOrder: 1,
            trainerNotes: "Controlar el tempo 3-0-1-0.",
          },
        });

        await db.exerciseBlock.create({
          data: {
            trainingDayId: day2.id,
            exerciseId: masterExercises[1].id,
            sets: 4,
            reps: 10,
            restSecs: 120,
            blockOrder: 1,
          },
        });
      }

      // Alumnos demo
      const objHipertrofia = objetivosCreated.find((o) => o.label === "Hipertrofia")?.id;
      const objGrasa = objetivosCreated.find((o) => o.label === "Pérdida de Grasa")?.id;
      const objFuerza = objetivosCreated.find((o) => o.label === "Fuerza")?.id;
      const modGimnasio = modalidadesCreated.find((m) => m.label === "Gimnasio")?.id;
      const modHibrido = modalidadesCreated.find((m) => m.label === "Híbrido")?.id;

      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 25);

      const alumno1 = await db.student.create({
        data: {
          trainerId: demoCoach.id,
          dni: "38123456",
          firstName: "Juan",
          lastName: "Pérez",
          email: "juan.perez@gmail.com",
          phone: "+5491122334455",
          objetivoId: objHipertrofia,
          secondaryGoals: "Aumentar masa en brazos y hombros",
          nivel: "intermedio",
          modalidadId: modGimnasio,
          membershipStartsAt: hoy,
          paymentExpiresAt: en30Dias,
          height: 178,
          age: 28,
          healthNotes: "Molestia leve en rodilla izquierda.",
          isActive: true,
        },
      });

      const subAlumno1 = await db.studentSubscription.create({
        data: {
          studentId: alumno1.id,
          planId: coachPlanMensual.id,
          priceSnapshot: coachPlanMensual.price,
          startDate: hoy,
          expiresAt: en30Dias,
        },
      });

      await db.payment.create({
        data: {
          studentId: alumno1.id,
          subscriptionId: subAlumno1.id,
          amount: coachPlanMensual.price,
          paidAt: hoy,
          notes: "Pago del mes en efectivo",
        },
      });

      await db.assignedRoutine.create({
        data: {
          studentId: alumno1.id,
          templateId: routineTemplate.id,
          status: "active",
          assignedAt: hoy,
        },
      });

      const alumno2 = await db.student.create({
        data: {
          trainerId: demoCoach.id,
          dni: "40987654",
          firstName: "Martina",
          lastName: "Giménez",
          email: "martina.gimenez@hotmail.com",
          phone: "+5491155667788",
          objetivoId: objGrasa,
          nivel: "principiante",
          modalidadId: modGimnasio,
          membershipStartsAt: hoy,
          paymentExpiresAt: en30Dias,
          height: 165,
          age: 24,
          isActive: true,
        },
      });

      const subAlumno2 = await db.studentSubscription.create({
        data: {
          studentId: alumno2.id,
          planId: coachPlanTrimestral.id,
          priceSnapshot: coachPlanTrimestral.price,
          startDate: hoy,
          expiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        },
      });

      await db.payment.create({
        data: {
          studentId: alumno2.id,
          subscriptionId: subAlumno2.id,
          amount: coachPlanTrimestral.price,
          paidAt: hoy,
        },
      });

      const alumno3 = await db.student.create({
        data: {
          trainerId: demoCoach.id,
          dni: "35444333",
          firstName: "Lucas",
          lastName: "Díaz",
          email: "lucas.diaz@outlook.com",
          phone: "+5491188990011",
          objetivoId: objFuerza,
          nivel: "avanzado",
          modalidadId: modHibrido,
          membershipStartsAt: hoy,
          paymentExpiresAt: en30Dias,
          height: 182,
          age: 33,
          isActive: true,
        },
      });

      console.log(`✅ Entrenador demo creado para testing con datos mock: ${demoCoach.email}`);
    } else {
      console.log("ℹ️ Entrenador demo ya existe, conservando sus datos existentes.");
    }
  }

  console.log("\n=================================================");
  console.log("✨ BASE DE DATOS SINCRONIZADA SIN PÉRDIDA DE DATOS");
  console.log("=================================================");
  console.log("📋 DATOS DE ACCESO SUPERADMIN:");
  console.log(`   URL:      http://localhost:3000/login`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Rol:      SUPERADMIN`);
  console.log(`   Destino:  /superadmin y /superadmin/planes`);
  console.log("-------------------------------------------------");
  console.log("📋 DATOS DE ACCESO COACH DEMO (Si fue inicializado):");
  console.log(`   Email:    demo@coach.com`);
  console.log(`   Password: CoachDemo2026!`);
  console.log(`   Alumnos:  Juan Pérez, Martina Giménez, Lucas Díaz`);
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
