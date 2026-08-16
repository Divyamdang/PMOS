import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { fetchNotifications } from "@/app/actions/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Both in one wave. The notification bell used to fetch its own count from
  // the client after hydration; resolving it here costs nothing extra (it runs
  // alongside the user lookup, and alongside the page's own queries) and saves
  // a round-trip on every page load.
  const [user, notifications] = await Promise.all([getCurrentUser(), fetchNotifications()]);
  return (
    <AppShell
      user={{ name: user.name, email: user.email, image: user.image }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
