import { getMyDayData } from "@/lib/queries/my-day";
import { MyDayView } from "@/components/my-day/my-day-view";

export default async function MyDayPage() {
  const data = await getMyDayData();
  return <MyDayView {...data} />;
}
