import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LegacyRutinaPage({
  params,
}: {
  params: Promise<{ dni: string }>;
}) {
  const { dni } = await params;
  const defaultCoach = await db.trainer.findFirst({
    where: { role: "COACH", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });

  redirect(`/${defaultCoach?.slug}/rutina/${dni}`);
}
