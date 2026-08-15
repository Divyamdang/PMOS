import { db } from "@/lib/db";
import { getSettings } from "@/app/actions/settings";
import { listBackups } from "@/app/actions/data";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const [settings, backups, counts] = await Promise.all([
    getSettings(),
    listBackups(),
    Promise.all([
      db.project.count(),
      db.task.count(),
      db.person.count(),
      db.vendor.count(),
    ]).then(([projects, tasks, people, vendors]) => ({ projects, tasks, people, vendors })),
  ]);

  return <SettingsView settings={settings} backups={backups} counts={counts} aiKeyConfigured={!!process.env.OPENAI_API_KEY} />;
}
