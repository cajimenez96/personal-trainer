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
  await db.trainerPayment.deleteMany();
  await db.trainerSubscription.deleteMany();
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
  await db.platformPlan.deleteMany();
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

  // 2. Planes de Plataforma (SaaS Tiers para Entrenadores)
  console.log("💼 Creando planes de plataforma...");
  const planBasico = await db.platformPlan.create({
    data: {
      name: "Plan Inicial",
      description: "Ideal para entrenadores que recién comienzan a digitalizar sus alumnos.",
      price: 15000,
      durationDays: 30,
      trialDays: 7,
      maxStudents: 15,
      maxPlans: 2,
      maxGenericProfiles: 3,
    },
  });

  const planPro = await db.platformPlan.create({
    data: {
      name: "Plan Pro",
      description: "Para entrenadores activos con cartera consolidada de alumnos.",
      price: 30000,
      durationDays: 30,
      trialDays: 7,
      maxStudents: 50,
      maxPlans: 10,
      maxGenericProfiles: 10,
    },
  });

  const planElite = await db.platformPlan.create({
    data: {
      name: "Plan Elite / Gimnasio",
      description: "Para centros de entrenamiento y coaches de alto volumen.",
      price: 60000,
      durationDays: 30,
      trialDays: 14,
      maxStudents: 200,
      maxPlans: 50,
      maxGenericProfiles: 30,
    },
  });
  console.log("✅ 3 planes de plataforma creados con períodos de prueba (Inicial, Pro, Elite)");

  // 3. Entrenador Principal (Santiago Ramón — Cuenta limpia sin mock data)
  const coachEmail = process.env.SEED_ADMIN_EMAIL || "sramon@coach.com";
  const coachPassword = process.env.SEED_ADMIN_PASSWORD || "SRamon2026";
  const coachName = process.env.SEED_ADMIN_NAME || "Santiago Ramón";
  const coachHash = await bcrypt.hash(coachPassword, 10);

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 30);

  const santiagoCoach = await db.trainer.create({
    data: {
      email: coachEmail,
      passwordHash: coachHash,
      name: coachName,
      role: "COACH",
      slug: "santiago-ramon",
      businessName: "SR Fitness Coaching",
      whatsappNumber: "+5491144556677",
      platformPlanId: planPro.id,
      maxStudents: planPro.maxStudents,
      maxPlans: planPro.maxPlans,
      maxGenericProfiles: planPro.maxGenericProfiles,
      membershipExpiresAt: expiresDate,
      isActive: true,
    },
  });

  const subSantiago = await db.trainerSubscription.create({
    data: {
      trainerId: santiagoCoach.id,
      planId: planPro.id,
      priceSnapshot: planPro.price,
      startDate: new Date(),
      expiresAt: expiresDate,
      status: "ACTIVE",
    },
  });

  await db.trainerPayment.create({
    data: {
      trainerId: santiagoCoach.id,
      subscriptionId: subSantiago.id,
      amount: planPro.price,
      paidAt: new Date(),
      paymentMethod: "Transferencia Bancaria",
      notes: "Pago de suscripción Plan Pro",
    },
  });
  console.log(`✅ Entrenador principal creado sin datos mock: ${santiagoCoach.email}`);

  // 3.1. Entrenador Demo para Pruebas (Aislado de la cuenta de Santiago)
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
  console.log(`✅ Entrenador demo creado para testing con datos mock: ${demoCoach.email}`);

  // 4. Ejercicios (Biblioteca compartida master)
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

  // 5. Taxonomías base
  const objetivosCreated = [];
  for (const label of OBJETIVOS) {
    const o = await db.objetivo.create({ data: { label } });
    objetivosCreated.push(o);
  }
  const modalidadesCreated = [];
  for (const label of MODALIDADES) {
    const m = await db.modalidad.create({ data: { label } });
    modalidadesCreated.push(m);
  }
  console.log(
    `✅ Taxonomías sincronizadas (${OBJETIVOS.length} objetivos, ${MODALIDADES.length} modalidades)`
  );

  // 6. Planes de entrenamiento creados por el Coach para sus alumnos
  console.log("📋 Creando planes de entrenamiento para el coach demo...");
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
  console.log("✅ 2 planes de entrenamiento del coach creados");

  // 7. Plantilla de Rutina de ejemplo para el Coach
  console.log("📋 Creando plantilla de rutina para el coach demo...");
  const routineTemplate = await db.routineTemplate.create({
    data: {
      trainerId: demoCoach.id,
      name: "Hipertrofia Torso-Pierna (4 Días)",
      description: "Rutina dividida en 4 días enfocada en sobrecarga progresiva y desarrollo muscular.",
      durationWeeks: 4,
    },
  });

  const masterExercises = await db.exercise.findMany({ take: 6 });
  if (masterExercises.length >= 4) {
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
        trainerNotes: "Controlar el tempo 3-0-1-0 y mantener escápulas retraídas.",
      },
    });

    await db.exerciseBlock.create({
      data: {
        trainingDayId: day1.id,
        exerciseId: masterExercises[1].id,
        sets: 3,
        reps: 10,
        restSecs: 60,
        blockOrder: 2,
      },
    });

    await db.exerciseBlock.create({
      data: {
        trainingDayId: day2.id,
        exerciseId: masterExercises[2].id,
        sets: 4,
        reps: 10,
        restSecs: 120,
        blockOrder: 1,
        trainerNotes: "Profundidad paralela, activación de glúteo.",
      },
    });
  }
  console.log("✅ Plantilla de rutina con días y bloques de ejercicios creada");

  // 8. Alumnos Demo del Coach
  console.log("👥 Creando alumnos demo para el coach...");
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
      healthNotes: "Molestia leve en rodilla izquierda al flexionar más de 90°.",
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

  await db.bodyWeightLog.create({
    data: {
      studentId: alumno1.id,
      loggedDate: hoy,
      weightKg: 78.5,
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
      secondaryGoals: "Tonificación general y mejora aeróbica",
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
      notes: "Transferencia bancaria comprobante #9412",
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

  console.log(`✅ 3 alumnos demo creados con rutinas, suscripciones y pagos para ${demoCoach.name}`);

  console.log("\n=================================================");
  console.log("✨ BASE DE DATOS LOCAL REINICIADA Y LISTA PARA PRUEBAS");
  console.log("=================================================");
  console.log("📋 DATOS DE ACCESO SUPERADMIN:");
  console.log(`   URL:      http://localhost:3000/login`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Rol:      SUPERADMIN`);
  console.log(`   Destino:  /superadmin y /superadmin/planes`);
  console.log("-------------------------------------------------");
  console.log("📋 ENTRENADOR PRINCIPAL (Santiago Ramón):");
  console.log(`   Email:    ${coachEmail}`);
  console.log(`   Password: ${coachPassword}`);
  console.log(`   Estado:   Cuenta limpia, lista para operar`);
  console.log("-------------------------------------------------");
  console.log("📋 ENTRENADOR DEMO (Para pruebas):");
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
