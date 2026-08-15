import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AppShell user={{ name: user.name, email: user.email, image: user.image }}>{children}</AppShell>;
}
