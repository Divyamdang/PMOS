import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { VendorProfile } from "@/components/vendors/vendor-profile";

export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await db.vendor.findUnique({
    where: { id },
    include: {
      projects: { include: { project: true } },
      followUps: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
      tasks: { where: { status: { not: "DONE" } }, include: { project: true } },
    },
  });
  if (!vendor) notFound();
  return <VendorProfile vendor={vendor} />;
}
