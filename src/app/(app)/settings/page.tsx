import { db } from "@/lib/db";
import { getPreferences } from "@/app/actions/settings";
import { getCurrentUser } from "@/lib/current-user";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const [preferences, user, counts] = await Promise.all([
    getPreferences(),
    getCurrentUser(),
    Promise.all([
      db.project.count(),
      db.task.count(),
      db.person.count(),
      db.vendor.count(),
    ]).then(([projects, tasks, people, vendors]) => ({ projects, tasks, people, vendors })),
  ]);

  return <SettingsView preferences={preferences} user={user} counts={counts} aiKeyConfigured={!!process.env.OPENAI_API_KEY} />;
}
