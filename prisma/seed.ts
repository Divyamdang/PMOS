import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

/**
 * WTS ships with no demo data — this is a real team workspace, not a demo.
 * Team members are created automatically on first Google sign-in; projects,
 * tasks, people, and vendors are created by the team as they use the app.
 */
async function main() {
  console.log("No seed data to apply — WTS starts empty.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
