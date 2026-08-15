"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { VendorStatus } from "@/generated/prisma";

export async function createVendor(input: {
  name: string;
  category?: string;
  description?: string;
  website?: string;
  primaryContact?: string;
  email?: string;
  phone?: string;
  status?: VendorStatus;
}) {
  const vendor = await db.vendor.create({ data: input });
  revalidatePath("/vendors");
  return vendor;
}

export async function linkVendorToProject(vendorId: string, projectId: string) {
  await db.vendorProject.create({ data: { vendorId, projectId } });
  revalidatePath(`/vendors/${vendorId}`);
}
