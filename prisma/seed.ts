import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding PMOS...");

  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, userName: "Divyam", theme: "dark", accentColor: "#4C7EF0" },
  });

  const divyam = await db.user.upsert({
    where: { email: "divyamdang02@gmail.com" },
    update: {},
    create: { name: "Divyam Dang", email: "divyamdang02@gmail.com", role: "Product Manager" },
  });

  const [rahul, , aman, neha, arjun] = await Promise.all([
    db.user.upsert({ where: { email: "rahul@pmos.local" }, update: {}, create: { name: "Rahul Mehta", email: "rahul@pmos.local", role: "Engineering Lead" } }),
    db.user.upsert({ where: { email: "priya@pmos.local" }, update: {}, create: { name: "Priya Nair", email: "priya@pmos.local", role: "Finance" } }),
    db.user.upsert({ where: { email: "aman@pmos.local" }, update: {}, create: { name: "Aman Sharma", email: "aman@pmos.local", role: "QA Lead" } }),
    db.user.upsert({ where: { email: "neha@pmos.local" }, update: {}, create: { name: "Neha Kapoor", email: "neha@pmos.local", role: "Design Lead" } }),
    db.user.upsert({ where: { email: "arjun@pmos.local" }, update: {}, create: { name: "Arjun Verma", email: "arjun@pmos.local", role: "Operations" } }),
  ]);

  const people = await Promise.all([
    db.person.create({ data: { name: "Rahul Mehta", role: "Engineering Lead", department: "Engineering", category: "ENGINEERING", email: "rahul@pmos.local", lastInteraction: daysAgo(2) } }),
    db.person.create({ data: { name: "Priya Nair", role: "Finance Manager", department: "Finance", category: "FINANCE", email: "priya@pmos.local", lastInteraction: daysAgo(5), nextFollowUp: daysFromNow(1) } }),
    db.person.create({ data: { name: "Aman Sharma", role: "QA Lead", department: "Engineering", category: "ENGINEERING", email: "aman@pmos.local", lastInteraction: daysAgo(1) } }),
    db.person.create({ data: { name: "Neha Kapoor", role: "Design Lead", department: "Design", category: "DESIGN", email: "neha@pmos.local", lastInteraction: daysAgo(7) } }),
    db.person.create({ data: { name: "Arjun Verma", role: "Ops Manager", department: "Operations", category: "OPERATIONS", email: "arjun@pmos.local", lastInteraction: daysAgo(3) } }),
  ]);
  const [pRahul, pPriya] = people;

  const [cashfree, razorpay, , hdfc] = await Promise.all([
    db.vendor.create({ data: { name: "Cashfree", category: "Payment Gateway", website: "https://cashfree.com", primaryContact: "Vendor Success Team", email: "support@cashfree.com", status: "ACTIVE", notes: "Primary PG for dynamic routing pilot." } }),
    db.vendor.create({ data: { name: "Razorpay", category: "Payment Gateway", website: "https://razorpay.com", primaryContact: "Partnerships", status: "ACTIVE" } }),
    db.vendor.create({ data: { name: "Juspay", category: "Orchestration", website: "https://juspay.in", primaryContact: "Solutions Engineering", status: "EVALUATING" } }),
    db.vendor.create({ data: { name: "HDFC Bank", category: "Acquiring Bank", primaryContact: "Merchant Services", status: "ACTIVE" } }),
    db.vendor.create({ data: { name: "Amex", category: "Card Network", primaryContact: "Network Relations", status: "ACTIVE" } }),
  ]);

  // ---------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------
  const pgr = await db.project.create({
    data: {
      key: "PGR",
      name: "Dynamic PG Routing",
      description: "Route transactions across gateways in real time based on success-rate, cost, and latency signals.",
      status: "IN_PROGRESS",
      health: "ON_TRACK",
      priority: "P0",
      ownerId: divyam.id,
      startDate: daysAgo(30),
      targetDate: daysFromNow(21),
    },
  });
  await db.vendorProject.create({ data: { vendorId: cashfree.id, projectId: pgr.id } });
  await db.vendorProject.create({ data: { vendorId: hdfc.id, projectId: pgr.id } });

  const rec = await db.project.create({
    data: { key: "REC", name: "Payment Reconciliation Engine", description: "Automated settlement-to-ledger matching across gateways.", status: "PLANNED", health: "AT_RISK", priority: "P1", ownerId: divyam.id, startDate: daysAgo(5), targetDate: daysFromNow(60) },
  });
  const loy = await db.project.create({
    data: { key: "LOY", name: "Loyalty Lifecycle", description: "Points issuance, redemption and tiering for the merchant loyalty program.", status: "BACKLOG", health: "ON_TRACK", priority: "P2", ownerId: divyam.id, targetDate: daysFromNow(90) },
  });
  const spg = await db.project.create({
    data: { key: "SPG", name: "Smart Payment Gateway", description: "Merchant-facing checkout SDK with adaptive retries.", status: "IN_PROGRESS", health: "OFF_TRACK", priority: "P1", ownerId: divyam.id, startDate: daysAgo(45), targetDate: daysAgo(2) },
  });
  const man = await db.project.create({
    data: { key: "MAN", name: "Merchant Analytics", description: "Self-serve dashboards for merchant transaction health.", status: "COMPLETED", health: "ON_TRACK", priority: "P3", ownerId: divyam.id, startDate: daysAgo(90), targetDate: daysAgo(10) },
  });

  // ---------------------------------------------------------------------
  // PGR tasks — the flagship demo project
  // ---------------------------------------------------------------------
  let seq = 0;
  const key = () => `PGR-${100 + seq++}`;

  await db.task.create({ data: { taskKey: key(), title: "Define routing rules", type: "TASK", status: "DONE", priority: "P1", projectId: pgr.id, assigneeId: rahul.id, reporterId: divyam.id, createdAt: daysAgo(25), completedAt: daysAgo(20) } });
  const integrate = await db.task.create({ data: { taskKey: key(), title: "Integrate Cashfree", description: "End-to-end integration of Cashfree as a routable gateway.", type: "FEATURE", status: "IN_PROGRESS", priority: "P0", projectId: pgr.id, assigneeId: rahul.id, reporterId: divyam.id, vendorId: cashfree.id, dueDate: daysFromNow(5), paymentGateway: "Cashfree" } });
  await db.task.create({ data: { taskKey: key(), title: "Configure fallback logic", type: "TASK", status: "TODO", priority: "P1", projectId: pgr.id, assigneeId: rahul.id, reporterId: divyam.id, dueDate: daysFromNow(10) } });
  await db.task.create({ data: { taskKey: key(), title: "Build routing engine", type: "FEATURE", status: "IN_PROGRESS", priority: "P0", projectId: pgr.id, assigneeId: rahul.id, reporterId: divyam.id, dueDate: daysFromNow(8) } });
  await db.task.create({ data: { taskKey: key(), title: "Add monitoring", type: "TASK", status: "TODO", priority: "P2", projectId: pgr.id, assigneeId: aman.id, reporterId: divyam.id, dueDate: daysFromNow(14) } });
  const uat = await db.task.create({ data: { taskKey: key(), title: "UAT", type: "TASK", status: "BACKLOG", priority: "P1", projectId: pgr.id, assigneeId: aman.id, reporterId: divyam.id, dueDate: daysFromNow(18) } });
  const prod = await db.task.create({ data: { taskKey: key(), title: "Production deployment", type: "TASK", status: "BACKLOG", priority: "P0", projectId: pgr.id, assigneeId: rahul.id, reporterId: divyam.id, dueDate: daysFromNow(21) } });

  const subtaskSpecs: Array<[string, "DONE" | "IN_PROGRESS" | "TODO"]> = [
    ["Get credentials", "DONE"],
    ["API documentation review", "DONE"],
    ["Sandbox configuration", "IN_PROGRESS"],
    ["API implementation", "TODO"],
    ["Payment testing", "TODO"],
    ["Failure testing", "TODO"],
  ];
  for (const [title, status] of subtaskSpecs) {
    await db.task.create({
      data: {
        taskKey: key(),
        title,
        type: "TASK",
        status,
        priority: "P2",
        projectId: pgr.id,
        parentTaskId: integrate.id,
        assigneeId: rahul.id,
        reporterId: divyam.id,
        createdAt: status === "DONE" ? daysAgo(6) : undefined,
        completedAt: status === "DONE" ? daysAgo(3) : null,
      },
    });
  }

  await db.taskDependency.create({ data: { fromTaskId: uat.id, toTaskId: integrate.id, type: "DEPENDS_ON" } });
  await db.taskDependency.create({ data: { fromTaskId: prod.id, toTaskId: uat.id, type: "DEPENDS_ON" } });

  // PM's own operational work (isPersonal) on PGR
  await db.task.create({ data: { taskKey: key(), title: "Follow up with Cashfree", type: "FOLLOW_UP", status: "TODO", priority: "P1", projectId: pgr.id, isPersonal: true, assigneeId: divyam.id, reporterId: divyam.id, vendorId: cashfree.id, dueDate: daysFromNow(1) } });
  await db.task.create({ data: { taskKey: key(), title: "Check settlement requirements with Finance", type: "COMMUNICATION", status: "TODO", priority: "P2", projectId: pgr.id, isPersonal: true, assigneeId: divyam.id, reporterId: divyam.id, personId: pPriya.id, dueDate: daysFromNow(2) } });
  await db.task.create({ data: { taskKey: key(), title: "Schedule UAT review", type: "MEETING", status: "TODO", priority: "P2", projectId: pgr.id, isPersonal: true, assigneeId: divyam.id, reporterId: divyam.id, dueDate: daysFromNow(12) } });
  await db.task.create({ data: { taskKey: key(), title: "Send weekly stakeholder update", type: "COMMUNICATION", status: "TODO", priority: "P3", projectId: pgr.id, isPersonal: true, assigneeId: divyam.id, reporterId: divyam.id, dueDate: daysFromNow(0) } });

  await db.risk.create({
    data: { risk: "Vendor API delivery may slip", description: "Cashfree's sandbox credentials and API docs have been slower than the agreed SLA.", probability: 3, impact: 4, status: "MONITORING", projectId: pgr.id, ownerId: divyam.id, mitigation: "Weekly vendor check-in; escalate to account manager if slip exceeds 5 days.", dueDate: daysFromNow(7) },
  });

  await db.waitingForItem.create({
    data: { who: "Finance", what: "Settlement file", projectId: pgr.id, personId: pPriya.id, since: daysAgo(4), expectedDate: daysFromNow(2), followUpDate: daysFromNow(1), status: "WAITING" },
  });

  await db.followUp.create({
    data: { topic: "API credentials & go-live checklist", vendorId: cashfree.id, relatedProjectId: pgr.id, relatedTaskId: integrate.id, lastContactDate: daysAgo(3), followUpDate: daysFromNow(1), status: "WAITING_FOR_RESPONSE", priority: "P1", channel: "EMAIL", notes: "Waiting on production API keys and settlement docs." },
  });
  await db.followUp.create({
    data: { topic: "Renewal terms", vendorId: razorpay.id, lastContactDate: daysAgo(15), followUpDate: daysAgo(1), status: "FOLLOW_UP_DUE", priority: "P2", channel: "EMAIL" },
  });
  await db.followUp.create({
    data: { topic: "Q3 roadmap sync", personId: pRahul.id, lastContactDate: daysAgo(1), followUpDate: daysFromNow(6), status: "CONTACTED", priority: "P3", channel: "SLACK" },
  });

  const meeting = await db.meeting.create({
    data: {
      title: "PGR sprint sync",
      date: daysAgo(2),
      projectId: pgr.id,
      agenda: "Cashfree integration status, fallback design review, UAT timeline.",
      notes: "Rahul demoed sandbox flow. Fallback logic needs a design doc before implementation starts. Aman to draft the UAT plan.",
      participants: { create: [{ personId: pRahul.id }] },
    },
  });
  await db.actionItem.create({ data: { meetingId: meeting.id, description: "Draft fallback-logic design doc", ownerName: "Rahul Mehta", dueDate: daysFromNow(4) } });
  await db.actionItem.create({ data: { meetingId: meeting.id, description: "Draft UAT plan", ownerName: "Aman Sharma", dueDate: daysFromNow(6) } });

  await db.decision.create({
    data: {
      decision: "Use rule-based routing for v1, defer ML-based scoring to v2",
      context: "Needed to ship the routing engine within this quarter without an ML dependency.",
      alternatives: "ML-based success-rate scoring; hybrid rules+ML.",
      reason: "Rule-based gets us to production 6 weeks faster and is easier to explain to compliance.",
      outcome: "Approved by engineering + compliance.",
      relatedProjectId: pgr.id,
      ownerId: divyam.id,
      date: daysAgo(18),
    },
  });

  await db.document.create({
    data: {
      title: "Dynamic PG Routing — PRD",
      type: "PRD",
      projectId: pgr.id,
      content: "",
      prdProblem: "Static gateway routing leads to avoidable failed transactions and higher processing costs during gateway outages or degraded performance.",
      prdBackground: "Current checkout hard-codes gateway priority. Cashfree outages in the last quarter caused a 4% dip in success rate for ~6 hours.",
      prdGoals: "Increase blended success rate by 1.5pp; reduce cost-per-transaction by routing to cheaper gateways when success-rate parity holds.",
      prdNonGoals: "ML-based dynamic scoring (v2). Multi-currency routing (out of scope).",
      prdUserStories: "As a merchant, my transactions should succeed even if one gateway is degraded, without any change on my end.",
      prdRequirements: "Real-time health scoring per gateway. Configurable routing rules. Automatic fallback within 200ms.",
      prdAcceptanceCriteria: "Fallback triggers within 200ms of a gateway health breach. No merchant-visible checkout latency increase >50ms p95.",
      prdSuccessMetrics: "Blended success rate, cost per transaction, fallback trigger count.",
      prdRisks: "Vendor API delivery slippage (see linked risk).",
      prdDependencies: "Cashfree production credentials, HDFC acquiring config.",
      prdRolloutPlan: "10% traffic canary -> 50% -> 100% over 2 weeks post UAT.",
    },
  });

  // Metrics time series for PGR
  const metricDays = 14;
  for (let i = metricDays; i >= 0; i--) {
    const base = 96.5 + Math.sin(i / 3) * 0.8;
    await db.metric.create({ data: { name: "Payment Success Rate", value: Number(base.toFixed(2)), unit: "%", target: 98, direction: "up", projectId: pgr.id, date: daysAgo(i) } });
    await db.metric.create({ data: { name: "Transaction Volume", value: Math.round(12000 + Math.random() * 3000), unit: "txns", direction: "up", projectId: pgr.id, date: daysAgo(i) } });
  }
  await db.metric.create({ data: { name: "MDR (avg)", value: 1.85, unit: "%", target: 1.7, direction: "down", projectId: pgr.id } });

  // ---------------------------------------------------------------------
  // Light seed for the other 4 projects so lists/boards aren't empty
  // ---------------------------------------------------------------------
  const other = [
    { p: rec, titles: ["Design settlement matching rules", "Ingest gateway settlement files", "Build exception queue"] },
    { p: loy, titles: ["Define tier thresholds", "Points ledger schema"] },
    { p: spg, titles: ["Adaptive retry logic", "SDK checkout redesign", "Fix iOS SDK crash on 3DS"] },
    { p: man, titles: ["Ship merchant dashboard v1", "Add cohort retention chart"] },
  ];
  for (const { p, titles } of other) {
    let n = 1;
    for (const title of titles) {
      await db.task.create({
        data: {
          taskKey: `${p.key}-${100 + n++}`,
          title,
          type: "TASK",
          status: p.status === "COMPLETED" ? "DONE" : n % 3 === 0 ? "BLOCKED" : "TODO",
          priority: "P2",
          projectId: p.id,
          assigneeId: [rahul, neha, arjun][n % 3].id,
          reporterId: divyam.id,
          dueDate: daysFromNow(n * 3),
          createdAt: p.status === "COMPLETED" ? daysAgo(15) : undefined,
          completedAt: p.status === "COMPLETED" ? daysAgo(10) : null,
        },
      });
    }
  }

  await db.risk.create({ data: { risk: "iOS SDK crash blocking release", description: "3DS redirect crashes on iOS 17 under low memory.", probability: 4, impact: 4, status: "ESCALATED", projectId: spg.id, ownerId: divyam.id, dueDate: daysAgo(1) } });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
