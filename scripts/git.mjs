import { execSync } from "node:child_process";

const SKIP_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.(js|css)$/,
  /^dist\//,
  /^build\//,
];

const MAX_DIFF_BYTES = 40_000;

const sh = (cmd) => execSync(cmd, { encoding: "utf8" });

export function getCommitInfo() {
  const raw = sh("git log -1 --pretty=format:%H%x1f%an%x1f%B");
  const [sha, author, message] = raw.split("\x1f");
  return {
    sha,
    shortSha: sha.slice(0, 7),
    author,
    message: message.trim(),
  };
}

export function isMergeCommit() {
  const parents = sh("git rev-list --parents -n 1 HEAD").trim().split(" ");
  return parents.length > 2;
}

export function getDiff() {
  const allFiles = sh("git diff --name-only HEAD~1 HEAD")
    .split("\n")
    .filter(Boolean);

  const files = allFiles.filter(
    (f) => !SKIP_PATTERNS.some((re) => re.test(f))
  );

  if (files.length === 0) return null;

  const fileArgs = files.map((f) => `'${f.replace(/'/g, "'\\''")}'`).join(" ");
  const diff = sh(`git diff HEAD~1 HEAD -- ${fileArgs}`);

  if (diff.length > MAX_DIFF_BYTES) {
    return diff.slice(0, MAX_DIFF_BYTES) + "\n\n[diff truncated]";
  }
  return diff;
}

export function getStats() {
  const out = sh("git diff --shortstat HEAD~1 HEAD");
  return {
    added: +(out.match(/(\d+) insertion/)?.[1] ?? 0),
    removed: +(out.match(/(\d+) deletion/)?.[1] ?? 0),
    files: +(out.match(/(\d+) file/)?.[1] ?? 0),
  };
}