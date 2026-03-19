import { spawnSync } from "node:child_process";
import path from "node:path";
import {
	REPO_ROOT,
	getCandidateSurfaceFiles,
	getCandidateSkippableLines,
	isCandidateSurfaceFile,
	shouldSkipCandidateLine,
} from "./solution-diff-surface.mjs";

const candidateFiles = getCandidateSurfaceFiles();
const skippableLineMap = getCandidateSkippableLines(candidateFiles);

const lintRun = spawnSync("bunx", ["eslint", ".", "--ext", ".ts,.tsx", "--format", "json"], {
	cwd: REPO_ROOT,
	encoding: "utf8",
});

if (lintRun.error) {
	console.error(lintRun.error.message);
	process.exit(1);
}

const stdout = lintRun.stdout?.trim();
const stderr = lintRun.stderr?.trim();
if (stderr) console.error(stderr);

if (!stdout) {
	console.log("Lint completed with no output.");
	process.exit(0);
}

let results;
try {
	results = JSON.parse(stdout);
} catch {
	console.error(stdout);
	process.exit(lintRun.status ?? 1);
}

let skippedMessages = 0;
let hasErrors = false;
const outputLines = [];

for (const fileResult of results) {
	const filePath = path.resolve(fileResult.filePath);
	const isCandidateFile = isCandidateSurfaceFile(filePath, candidateFiles);

	for (const message of fileResult.messages) {
		if (isCandidateFile && message.line && shouldSkipCandidateLine(filePath, message.line, skippableLineMap)) {
			skippedMessages += 1;
			continue;
		}

		const level = message.severity === 2 ? "error" : "warn";
		if (message.severity === 2) hasErrors = true;
		const location = `${path.relative(REPO_ROOT, filePath)}:${message.line}:${message.column}`;
		const rule = message.ruleId ? ` (${message.ruleId})` : "";
		outputLines.push(`${location} - ${level} ${message.message}${rule}`);
	}
}

if (outputLines.length > 0) {
	console.log(outputLines.join("\n"));
}

if (skippedMessages > 0) {
	console.log(`Skipped ${skippedMessages} lint message(s) from candidate contract surface files.`);
}

process.exit(hasErrors ? 1 : 0);
