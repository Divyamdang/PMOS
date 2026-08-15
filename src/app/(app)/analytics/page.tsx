import { getAnalyticsData } from "@/lib/queries/analytics";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsView {...data} />;
}
