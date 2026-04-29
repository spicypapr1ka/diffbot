const CATEGORY_COLORS = {
  feat: 0x2ecc71,      // green
  fix: 0x3498db,       // blue
  refactor: 0xf1c40f,  // yellow
  docs: 0x95a5a6,      // gray
  chore: 0x95a5a6,     // gray
  test: 0x9b59b6,      // purple
  revert: 0xe74c3c,    // red
};

const RISKY_COLOR = 0xe74c3c;
const DEFAULT_COLOR = 0x95a5a6;

export async function postToDiscord({ commit, stats, summary }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) throw new Error("DISCORD_WEBHOOK_URL not set");

  const commitUrl = `${process.env.REPO_URL}/commit/${commit.sha}`;
  const color = summary.risky
    ? RISKY_COLOR
    : CATEGORY_COLORS[summary.category] ?? DEFAULT_COLOR;

  const title = (summary.risky ? "⚠️ " : "") + summary.headline;
  const description = summary.bullets.map((b) => `• ${b}`).join("\n");

  const body = {
    embeds: [
      {
        title: truncate(title, 256),
        description: truncate(description, 4096),
        url: commitUrl,
        color,
        fields: [
          { name: "Author", value: commit.author, inline: true },
          {
            name: "Changes",
            value: `+${stats.added} / −${stats.removed} across ${stats.files} file${stats.files === 1 ? "" : "s"}`,
            inline: true,
          },
        ],
        footer: { text: commit.shortSha },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed (${res.status}): ${text}`);
  }
}

function truncate(str, max) {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}