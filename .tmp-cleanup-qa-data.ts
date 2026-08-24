import "dotenv/config"
import { db } from "./lib/db"

const CANONICAL_EXERCISE_NAMES = [
  "Sentadilla con barra trasera (Back Squat)",
  "Sentadilla búlgara",
  "Prensa inclinada a 45°",
  "Extensión de piernas en máquina",
  "Peso muerto rumano (RDL)",
  "Curl femoral acostado o sentado",
  "Empuje de cadera (Hip Thrust)",
  "Elevación de talones de pie",
  "Elevación de talones sentado",
  "Press de banca plano con barra",
  "Press inclinado con mancuernas",
  "Aperturas / Cruce de poleas (Cable Flyes)",
  "Fondos en paralelas (Dips)",
  "Dominadas pronas (Pull-ups)",
  "Remo con barra (Pendlay o 45°)",
  "Jalón al pecho en polea (Lat Pulldown)",
  "Remo unilateral con mancuerna",
  "Press militar de pie con barra (OHP)",
  "Elevaciones laterales con mancuernas / polea",
  "Pájaros / Reverse Pec Deck",
  "Press francés con barra Z",
  "Extensión de tríceps en polea alta (cuerda)",
  "Curl de bíceps con barra recta",
  "Curl martillo con mancuernas",
  "Curl bayesian / en polea detrás del cuerpo",
  "Rueda abdominal (Ab Wheel Rollout)",
  "Elevación de piernas colgado",
]

async function main() {
  await db.$transaction(async (tx) => {
    const progressLogs = await tx.progressLog.deleteMany({})
    const bodyWeightLogs = await tx.bodyWeightLog.deleteMany({})
    const assignedRoutines = await tx.assignedRoutine.deleteMany({})
    const students = await tx.student.deleteMany({})
    const templates = await tx.routineTemplate.deleteMany({})
    const exercises = await tx.exercise.deleteMany({
      where: { name: { notIn: CANONICAL_EXERCISE_NAMES } },
    })

    console.log("progressLogs:", progressLogs.count)
    console.log("bodyWeightLogs:", bodyWeightLogs.count)
    console.log("assignedRoutines:", assignedRoutines.count)
    console.log("students:", students.count)
    console.log("routineTemplates (cascades trainingDays/exerciseBlocks):", templates.count)
    console.log("non-canonical exercises removed:", exercises.count)
  })

  const remainingExercises = await db.exercise.count()
  const remainingStudents = await db.student.count()
  const remainingTemplates = await db.routineTemplate.count()
  console.log(`Final state: ${remainingExercises} exercises, ${remainingStudents} students, ${remainingTemplates} templates`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
