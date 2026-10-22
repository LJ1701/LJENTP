// Claude Code PreToolUse hook (Bash): refuses a commit that would include a file named .env or
// .env.local, in any folder, and refuses a forced `git add` of one. Exit code 2 blocks the command
// and shows the message below to Claude; exit 0 lets everything else through.
const { execSync } = require("child_process");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const cmd = (input.tool_input && input.tool_input.command) || "";
  const isCommit = /\bgit\b[^\n;&|]*\bcommit\b/.test(cmd);
  const envName = /(^|[\s\/"'])\.env(\.local)?(?=$|[\s"'])/;
  const forcedEnvAdd = /\bgit\s+add\b[^\n;&|]*(\s-f\b|--force)/.test(cmd) && envName.test(cmd);
  if (!isCommit && !forcedEnvAdd) process.exit(0);

  let staged = [];
  if (isCommit) {
    try {
      const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
      staged = execSync("git diff --cached --name-only", { cwd, encoding: "utf8" }).split("\n").filter(Boolean);
    } catch {
      // not a git repo: nothing staged to check
    }
  }
  const bad = staged.filter((f) => /(^|\/)\.env(\.local)?$/.test(f));
  if (!bad.length && !forcedEnvAdd) process.exit(0);

  const what = bad.length ? `staged: ${bad.join(", ")}` : "a forced `git add` of a .env file";
  process.stderr.write(
    `Blocked by the project hook: secret env files must never be committed (${what}). ` +
    "Unstage them with `git restore --staged <file>` and keep keys only in .env.local and Vercel.\n"
  );
  process.exit(2);
});
