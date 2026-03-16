import { spawnSync } from "node:child_process";
import path from "node:path";
import {
	REPO_ROOT,
	getCandidateSurfaceFiles,
	getCandidateSkippableLines,
	isCandidateSurfaceFile,
	shouldSkipCandidateLine,
} from "./candidate-surface.mjs";

const candidateFiles = getCandidateSurfaceFiles();
const skippableLineMap = getCandidateSkippableLines(candidateFiles);

function filterTscOutput(output, commandCwd) {
	const lines = output.split("\n");
	const diagnosticStartRegex = /^(.+)\((\d+),(\d+)\): error TS\d+:/;
	const keptBlocks = [];
	let skippedDiagnostics = 0;
	let currentBlock = null;

	function flushCurrentBlock() {
		if (!currentBlock) return;
		if (currentBlock.keep) {
			keptBlocks.push(currentBlock.lines.join("\n"));
		} else {
			skippedDiagnostics += 1;
		}
		currentBlock = null;
	}

	for (const line of lines) {
		const diagnosticMatch = line.match(diagnosticStartRegex);
		if (diagnosticMatch) {
			flushCurrentBlock();
			const diagnosticPath = path.resolve(commandCwd, diagnosticMatch[1]);
			const diagnosticLine = Number(diagnosticMatch[2]);
			const isCandidate = isCandidateSurfaceFile(diagnosticPath, candidateFiles);
			const isSkippable = isCandidate
				&& shouldSkipCandidateLine(diagnosticPath, diagnosticLine, skippableLineMap);
			currentBlock = {
				keep: !isSkippable,
				lines: [line],
			};
			continue;
		}

		if (currentBlock) {
			currentBlock.lines.push(line);
		}
	}

	flushCurrentBlock();

	return {
		filteredOutput: keptBlocks.join("\n"),
		skippedDiagnostics,
		keptDiagnosticCount: keptBlocks.length,
	};
}

function runAndFilterTypecheck(label, cwd, args) {
	const result = spawnSync("bunx", args, {
		cwd,
		encoding: "utf8",
	});

	if (result.error) {
		return {
			label,
			ok: false,
			output: result.error.message,
			skippedDiagnostics: 0,
		};
	}

	const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
	const { filteredOutput, skippedDiagnostics, keptDiagnosticCount } = filterTscOutput(
		combinedOutput,
		cwd,
	);

	const hasRealErrors = keptDiagnosticCount > 0;
	const ok = !hasRealErrors;

	const summary = skippedDiagnostics
		? `Skipped ${skippedDiagnostics} ${label} diagnostic(s) from candidate contract surface files.`
		: "";

	return {
		label,
		ok,
		output: [filteredOutput, summary].filter(Boolean).join("\n").trim(),
		skippedDiagnostics,
	};
}

const frontend = runAndFilterTypecheck("frontend", path.join(REPO_ROOT, "frontend"), [
	"tsc",
	"--noEmit",
	"--noUnusedLocals",
	"false",
	"--noUnusedParameters",
	"false",
]);

const backend = runAndFilterTypecheck("backend", path.join(REPO_ROOT, "backend"), [
	"tsc",
	"--noEmit",
	"--declaration",
	"false",
	"--declarationMap",
	"false",
]);

if (frontend.output) console.log(frontend.output);
if (backend.output) console.log(backend.output);

if (!frontend.ok) {
	console.log(
		"Frontend typecheck diagnostics are non-blocking for candidate compatibility.",
	);
}

process.exit(backend.ok ? 0 : 1);
