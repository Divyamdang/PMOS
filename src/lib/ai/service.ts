import { getAIClient, AI_MODEL, AIUnavailableError } from "./client";

async function completeJSON<T>(system: string, user: string): Promise<T> {
  const client = getAIClient();
  if (!client) throw new AIUnavailableError();
  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");
  return JSON.parse(content) as T;
}

// ---------------------------------------------------------------------------
// 1. Task creation from free text
// ---------------------------------------------------------------------------

export type TaskDraft = {
  title: string;
  type: string;
  priority: "P0" | "P1" | "P2" | "P3";
  description: string;
  acceptanceCriteria: string;
  subtasks: string[];
  suggestedProjectKey: string | null;
};

export async function draftTaskFromText(text: string, projectKeys: string[]): Promise<TaskDraft> {
  return completeJSON<TaskDraft>(
    `You turn a PM's raw note into a structured task for PMOS, a fintech PM's tracker.
Valid task types: TASK, FEATURE, BUG, IMPROVEMENT, TECH_DEBT, RESEARCH, ANALYTICS, FOLLOW_UP, MEETING, CALL, COMMUNICATION, REMINDER, VENDOR, INCIDENT, DECISION, DOCUMENTATION, IDEA.
Valid project keys: ${projectKeys.join(", ") || "(none yet)"}.
Respond with strict JSON: {"title": string, "type": string, "priority": "P0"|"P1"|"P2"|"P3", "description": string, "acceptanceCriteria": string, "subtasks": string[], "suggestedProjectKey": string|null}.
Keep title short and action-oriented. Only set suggestedProjectKey if the text clearly references one of the valid keys/names; otherwise null. subtasks should be 0-5 concrete steps, or [] if the task is already atomic.`,
    text
  );
}

// ---------------------------------------------------------------------------
// 2. Meeting notes -> action items
// ---------------------------------------------------------------------------

export type ActionItemDraft = { description: string; ownerName: string | null; dueDateIso: string | null };

export async function draftActionItemsFromNotes(notes: string, participantNames: string[]): Promise<ActionItemDraft[]> {
  const result = await completeJSON<{ items: ActionItemDraft[] }>(
    `Extract concrete action items from meeting notes. Participants who might own an item: ${participantNames.join(", ") || "(unknown)"}.
Respond with strict JSON: {"items": [{"description": string, "ownerName": string|null, "dueDateIso": string|null}]}.
Only include real commitments, not general discussion. dueDateIso should be an ISO date (YYYY-MM-DD) only if the notes state or clearly imply a deadline, otherwise null. ownerName should match one of the participants when the notes attribute an item to someone, otherwise null.`,
    notes
  );
  return result.items ?? [];
}

// ---------------------------------------------------------------------------
// 3. Project summary
// ---------------------------------------------------------------------------

export async function summarizeProject(context: string): Promise<string> {
  const result = await completeJSON<{ summary: string }>(
    `Summarize this project's current state for a PM in 4-6 short sentences: status, what's completed, what's in progress, blockers, risks, waiting-for items, and next steps. Plain prose, no headers, no markdown. Calm and factual, not alarmist.
Respond with strict JSON: {"summary": string}.`,
    context
  );
  return result.summary;
}

// ---------------------------------------------------------------------------
// 4. Weekly stakeholder update
// ---------------------------------------------------------------------------

export async function draftWeeklyUpdate(context: string): Promise<string> {
  const result = await completeJSON<{ update: string }>(
    `Write a weekly PM stakeholder update from this data. Structure with these exact section headers, each followed by a short bulleted list (use "- " bullets): "Shipped", "In progress", "Blocked", "Risks", "Next week", "Key decisions". Skip a section entirely if there's nothing for it. Plain text, no markdown bold/headers beyond the section title lines themselves. Keep it copy-pasteable into an email or Slack message.
Respond with strict JSON: {"update": string}.`,
    context
  );
  return result.update;
}

// ---------------------------------------------------------------------------
// 5. "What am I forgetting?"
// ---------------------------------------------------------------------------

export async function synthesizeForgotten(context: string): Promise<string> {
  const result = await completeJSON<{ synthesis: string }>(
    `A PM is asking "what am I forgetting?". Below is a compiled list of their overdue tasks, waiting-for items, due follow-ups, upcoming deadlines, blocked tasks, stale projects, and open risks. Write a short (3-5 sentence) prioritized synthesis of what most needs their attention right now and why. Plain prose, calm tone, no markdown.
Respond with strict JSON: {"synthesis": string}.`,
    context
  );
  return result.synthesis;
}

// ---------------------------------------------------------------------------
// 6. PRD generator
// ---------------------------------------------------------------------------

export type PRDDraft = {
  title: string;
  problem: string;
  background: string;
  goals: string;
  nonGoals: string;
  userStories: string;
  requirements: string;
  acceptanceCriteria: string;
  successMetrics: string;
  risks: string;
  dependencies: string;
  rolloutPlan: string;
};

export async function draftPRD(idea: string): Promise<PRDDraft> {
  return completeJSON<PRDDraft>(
    `Expand a one-line product idea (fintech context) into a full PRD draft. Be concrete and specific, not generic. requirements should be one requirement per line (newline-separated), since each line later converts into a task.
Respond with strict JSON: {"title": string, "problem": string, "background": string, "goals": string, "nonGoals": string, "userStories": string, "requirements": string, "acceptanceCriteria": string, "successMetrics": string, "risks": string, "dependencies": string, "rolloutPlan": string}.`,
    idea
  );
}

// ---------------------------------------------------------------------------
// 7. Natural-language search -> structured filters (never raw DB queries)
// ---------------------------------------------------------------------------

export type NLSearchFilter = {
  statusFilter: "overdue" | "blocked" | "today" | "all" | null;
  projectKeyword: string | null;
  assigneeKeyword: string | null;
  textKeyword: string | null;
};

export async function translateSearchQuery(query: string, projectNames: string[], assigneeNames: string[]): Promise<NLSearchFilter> {
  return completeJSON<NLSearchFilter>(
    `Translate a natural-language search into structured filters for a task list. This produces filter parameters only — never a database query.
Known projects: ${projectNames.join(", ") || "(none)"}. Known assignees: ${assigneeNames.join(", ") || "(none)"}.
Respond with strict JSON: {"statusFilter": "overdue"|"blocked"|"today"|"all"|null, "projectKeyword": string|null, "assigneeKeyword": string|null, "textKeyword": string|null}.
statusFilter: "overdue" if asking about overdue/late work, "blocked" if asking about blocked work, "today" if asking about work due today, otherwise null. projectKeyword/assigneeKeyword: only set if the query references a known project/assignee. textKeyword: any remaining free-text search term, or null.`,
    query
  );
}
