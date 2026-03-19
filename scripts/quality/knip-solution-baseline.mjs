import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, SOLUTION_REPO_ROOT } from "./solution-diff-surface.mjs";

const KNIP_ARGS = [
	"knip",
	"--reporter",
	"json",
	"--no-config-hints",
	"--include",
	"files,exports,types",
];

function runKnip(cwd, label) {
	const result = spawnSync("bunx", KNIP_ARGS, {
		cwd,
		encoding: "utf8",
	});

	if (result.error) {
		throw new Error(`${label} knip failed to start: ${result.error.message}`);
	}

	const stdout = result.stdout?.trim();
	const stderr = result.stderr?.trim();

	if (!stdout) {
		if (stderr) {
			throw new Error(`${label} knip produced no JSON output.\n${stderr}`);
		}
		return { files: [], issues: [] };
	}

	try {
		return JSON.parse(stdout);
	} catch {
		const combinedOutput = [stdout, stderr].filter(Boolean).join("\n");
		throw new Error(`${label} knip output was not valid JSON.\n${combinedOutput}`);
	}
}

function buildBaselineSet(report) {
	const baseline = new Set();

	for (const file of report.files ?? []) {
		baseline.add(`file:${file}`);
	}

	for (const issue of report.issues ?? []) {
		const file = issue.file;

		for (const entry of issue.exports ?? []) {
			baseline.add(`export:${file}:${entry.name}`);
		}

		for (const entry of issue.types ?? []) {
			baseline.add(`type:${file}:${entry.name}`);
		}
	}

	return baseline;
}

function buildSolutionIssueFileSet(report) {
	const files = new Set(report.files ?? []);

	for (const issue of report.issues ?? []) {
		files.add(issue.file);
	}

	return files;
}

const sameFileCache = new Map();

function isSameAsSolution(relativeFilePath) {
	if (sameFileCache.has(relativeFilePath)) {
		return sameFileCache.get(relativeFilePath);
	}

	const currentFilePath = path.join(REPO_ROOT, relativeFilePath);
	const solutionFilePath = path.join(SOLUTION_REPO_ROOT, relativeFilePath);

	if (!fs.existsSync(currentFilePath) || !fs.existsSync(solutionFilePath)) {
		sameFileCache.set(relativeFilePath, false);
		return false;
	}

	const sameContent =
		fs.readFileSync(currentFilePath, "utf8") === fs.readFileSync(solutionFilePath, "utf8");
	sameFileCache.set(relativeFilePath, sameContent);
	return sameContent;
}

function shouldSkipWholeFileIssue(relativeFilePath, solutionIssueFiles, baseline) {
	return baseline.has(`file:${relativeFilePath}`)
		|| (solutionIssueFiles.has(relativeFilePath) && isSameAsSolution(relativeFilePath));
}

function filterReport(report, baseline, solutionIssueFiles) {
	const filteredFiles = (report.files ?? []).filter(
		(file) => !shouldSkipWholeFileIssue(file, solutionIssueFiles, baseline),
	);

	const filteredIssues = [];

	for (const issue of report.issues ?? []) {
		if (shouldSkipWholeFileIssue(issue.file, solutionIssueFiles, baseline)) {
			continue;
		}

		const filteredExports = (issue.exports ?? []).filter(
			(entry) => !baseline.has(`export:${issue.file}:${entry.name}`),
		);
		const filteredTypes = (issue.types ?? []).filter(
			(entry) => !baseline.has(`type:${issue.file}:${entry.name}`),
		);

		if (filteredExports.length === 0 && filteredTypes.length === 0) {
			continue;
		}

		filteredIssues.push({
			file: issue.file,
			exports: filteredExports,
			types: filteredTypes,
		});
	}

	return {
		files: filteredFiles,
		issues: filteredIssues,
	};
}

function formatReport(report) {
	const output = [];

	for (const file of [...(report.files ?? [])].sort()) {
		output.push(`${file} - unused file`);
	}

	const sortedIssues = [...(report.issues ?? [])].sort((left, right) =>
		left.file.localeCompare(right.file)
	);

	for (const issue of sortedIssues) {
		for (const entry of [...(issue.exports ?? [])].sort((left, right) =>
			left.name.localeCompare(right.name)
		)) {
			output.push(`${issue.file}:${entry.line}:${entry.col} - unused export ${entry.name}`);
		}

		for (const entry of [...(issue.types ?? [])].sort((left, right) =>
			left.name.localeCompare(right.name)
		)) {
			output.push(`${issue.file}:${entry.line}:${entry.col} - unused type ${entry.name}`);
		}
	}

	return output;
}

	try {
		const currentReport = runKnip(REPO_ROOT, "Current repo");
		const solutionReport = runKnip(SOLUTION_REPO_ROOT, "Solution repo");
		const baseline = buildBaselineSet(solutionReport);
		const solutionIssueFiles = buildSolutionIssueFileSet(solutionReport);
		const filteredReport = filterReport(currentReport, baseline, solutionIssueFiles);
	const outputLines = formatReport(filteredReport);

	const baselineIssueCount =
		(solutionReport.files?.length ?? 0)
		+ (solutionReport.issues ?? []).reduce(
			(total, issue) =>
				total + (issue.exports?.length ?? 0) + (issue.types?.length ?? 0),
			0,
		);

	if (outputLines.length > 0) {
		console.log(outputLines.join("\n"));
		console.log(
			`Skipped ${baselineIssueCount} knip issue(s) that already exist in the solution repo.`,
		);
		process.exit(1);
	}

	console.log(
		`Knip completed with no non-candidate file/export/type issues. Skipped ${baselineIssueCount} baseline issue(s) from the solution repo.`,
	);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
}
