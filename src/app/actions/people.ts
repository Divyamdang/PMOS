"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { PersonCategory } from "@/generated/prisma";

export async function createPerson(input: {
  name: string;
  role?: string;
  department?: string;
  company?: string;
  email?: string;
  phone?: string;
  category: PersonCategory;
  notes?: string;
}) {
  const person = await db.person.create({ data: input });
  revalidatePath("/people");
  return person;
}

export async function logInteraction(personId: string, note: string, channel?: string) {
  await db.interaction.create({ data: { personId, note, channel } });
  await db.person.update({ where: { id: personId }, data: { lastInteraction: new Date() } });
  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
}
