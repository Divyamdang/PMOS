import { db } from "@/lib/db";
import { VendorsView } from "@/components/vendors/vendors-view";

export default async function VendorsPage() {
  const vendors = await db.vendor.findMany({
    include: { _count: { select: { projects: true, followUps: true } } },
    orderBy: { name: "asc" },
  });
  return <VendorsView vendors={vendors} />;
}
