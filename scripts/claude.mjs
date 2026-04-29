import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You summarize git commits for a Discord channel.

Respond with ONLY a JSON object, no prose, no markdown fences. Shape:
{
  "headline": "≤80 char one-line summary of what changed",
  "bullets": ["2-4 short bullets explaining the change and its intent"],
  "category": "feat" | "fix" | "refactor" | "docs" | "chore" | "revert" | "test",
  "risky": true | false
}

Rules:
- Headline names the user-visible effect, not the mechanical change. "Fix null crash in profile loader" beats "Add optional chaining to profile.ts".
- Bullets explain WHY where it's inferable. Don't just restate the diff.
- Set risky=true for: auth/permissions changes, DB migrations, deletions of >50 lines of logic, secrets handling, prod config, anything touching payment/billing.
- If the commit message uses Conventional Commits (feat:, fix:, etc.), respect that for category.
- Never invent context that isn't in the diff or message.`;

export async function summarize({ commit, diff }) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Commit message:\n${commit.message}\n\nDiff:\n${diff}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return parseJson(text);
}

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}