import { getCommitInfo, getDiff, getStats, isMergeCommit } from "./git.mjs";
import { summarize } from "./claude.mjs";
import { postToDiscord } from "./discord.mjs";

if (isMergeCommit()) {
  console.log("Skipping merge commit");
  process.exit(0);
}

const commit = getCommitInfo();
const diff = getDiff();
const stats = getStats();

if (!diff) {
  console.log("No relevant changes to summarize");
  process.exit(0);
}

console.log(`Summarizing ${commit.shortSha}: ${commit.message.split("\n")[0]}`);

const summary = await summarize({ commit, diff });
await postToDiscord({ commit, stats, summary });

console.log("Posted to Discord");