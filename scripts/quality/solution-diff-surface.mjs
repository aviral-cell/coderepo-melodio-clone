import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_SOLUTION_REPO_ROOT =
	"/Users/aviralsrivastava/Desktop/Sanity-Pipeline/melodio-solution-branch/coderepo-react-node-melodio";
const SOLUTION_REPO_ROOT =
	process.env["MELODIO_SOLUTION_REPO"] || DEFAULT_SOLUTION_REPO_ROOT;
const CANDIDATE_DIFF_ROOTS = [
	"frontend/src",
	"backend/src",
];

function normalizeAbsolute(filePath) {
	return path.resolve(filePath);
}

function ensureSolutionRepoExists() {
	if (!fs.existsSync(SOLUTION_REPO_ROOT)) {
		throw new Error(
			`Solution repo not found. Set MELODIO_SOLUTION_REPO or ensure ${SOLUTION_REPO_ROOT} exists.`,
		);
	}
}

function walkTsFiles(directoryPath) {
	if (!fs.existsSync(directoryPath)) return [];

	const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const absolutePath = path.join(directoryPath, entry.name);

		if (entry.isDirectory()) {
			files.push(...walkTsFiles(absolutePath));
			continue;
		}

		if (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")) {
			files.push(absolutePath);
		}
	}

	return files;
}

function markRange(lineSet, startLine, endLine) {
	for (let line = startLine; line <= endLine; line += 1) {
		lineSet.add(line);
	}
}

function countBraceDelta(line) {
	const opens = (line.match(/\{/g) || []).length;
	const closes = (line.match(/\}/g) || []).length;
	return opens - closes;
}

function buildSkippableLineSetForCandidateOnlyFile(filePath) {
	if (!fs.existsSync(filePath)) return new Set();

	const lines = fs.readFileSync(filePath, "utf8").split("\n");
	const skippableLines = new Set();
	const importExportStartRegex = /^\s*(import|export)\b/;
	const declarationStartRegex =
		/^\s*(export\s+)?(async\s+)?(type|interface|function|class|enum|const|let|var)\b/;

	let statementStartLine = null;
	let declarationStartLine = null;
	let declarationMode = null;
	let declarationBraceDepth = 0;
	let declarationSawBrace = false;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const lineNumber = index + 1;
		const trimmed = line.trim();

		if (statementStartLine !== null) {
			if (trimmed.endsWith(";")) {
				markRange(skippableLines, statementStartLine, lineNumber);
				statementStartLine = null;
			}
			continue;
		}

		if (importExportStartRegex.test(trimmed)) {
			if (trimmed.endsWith(";")) {
				skippableLines.add(lineNumber);
			} else {
				statementStartLine = lineNumber;
			}
			continue;
		}

		if (declarationStartLine !== null) {
			if (declarationMode === "untilSemicolon") {
				if (trimmed.endsWith(";")) {
					markRange(skippableLines, declarationStartLine, lineNumber);
					declarationStartLine = null;
					declarationMode = null;
				}
				continue;
			}

			declarationBraceDepth += countBraceDelta(line);
			if (line.includes("{")) declarationSawBrace = true;

			if (declarationSawBrace && declarationBraceDepth <= 0) {
				markRange(skippableLines, declarationStartLine, lineNumber);
				declarationStartLine = null;
				declarationMode = null;
				declarationBraceDepth = 0;
				declarationSawBrace = false;
			}
			continue;
		}

		const declarationMatch = trimmed.match(declarationStartRegex);
		if (!declarationMatch) continue;

		const declarationKind = declarationMatch[3];
		const useSemicolonMode = declarationKind === "type"
			|| declarationKind === "const"
			|| declarationKind === "let"
			|| declarationKind === "var";

		if (useSemicolonMode) {
			if (trimmed.endsWith(";")) {
				skippableLines.add(lineNumber);
			} else {
				declarationStartLine = lineNumber;
				declarationMode = "untilSemicolon";
			}
			continue;
		}

		const braceDelta = countBraceDelta(line);
		const hasBrace = line.includes("{");

		if (hasBrace && braceDelta <= 0) {
			skippableLines.add(lineNumber);
		} else {
			declarationStartLine = lineNumber;
			declarationMode = "braceBlock";
			declarationBraceDepth = braceDelta;
			declarationSawBrace = hasBrace;
		}
	}

	return skippableLines;
}

function parseAddedRanges(diffOutput) {
	const ranges = [];

	for (const line of diffOutput.split("\n")) {
		const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
		if (!match) continue;

		const startLine = Number(match[1]);
		const count = Number(match[2] || "1");
		if (count === 0) continue;

		ranges.push([startLine, startLine + count - 1]);
	}

	return ranges;
}

function buildCandidateDiffMap() {
	ensureSolutionRepoExists();

	const candidateOnlyFiles = new Set();
	const partialCandidateRanges = new Map();

	for (const relativeRoot of CANDIDATE_DIFF_ROOTS) {
		const repoRoot = path.join(REPO_ROOT, relativeRoot);
		const repoFiles = walkTsFiles(repoRoot);

		for (const repoFile of repoFiles) {
			const relativePath = path.relative(REPO_ROOT, repoFile);
			const solutionFile = path.join(SOLUTION_REPO_ROOT, relativePath);

			if (!fs.existsSync(solutionFile)) {
				candidateOnlyFiles.add(normalizeAbsolute(repoFile));
				continue;
			}

			const diffRun = spawnSync("diff", ["-U0", solutionFile, repoFile], {
				encoding: "utf8",
			});
			const diffOutput = `${diffRun.stdout || ""}${diffRun.stderr || ""}`;
			const ranges = parseAddedRanges(diffOutput);

			if (ranges.length > 0) {
				partialCandidateRanges.set(normalizeAbsolute(repoFile), ranges);
			}
		}
	}

	return {
		candidateOnlyFiles,
		partialCandidateRanges,
	};
}

let cachedCandidateDiff = null;

function getCandidateDiff() {
	if (!cachedCandidateDiff) {
		cachedCandidateDiff = buildCandidateDiffMap();
	}

	return cachedCandidateDiff;
}

export function getCandidateSurfaceFiles() {
	const { candidateOnlyFiles, partialCandidateRanges } = getCandidateDiff();
	return new Set([
		...candidateOnlyFiles,
		...partialCandidateRanges.keys(),
	]);
}

export function isCandidateSurfaceFile(filePath, candidateFiles = getCandidateSurfaceFiles()) {
	return candidateFiles.has(normalizeAbsolute(filePath));
}

export function getCandidateSkippableLines() {
	const { candidateOnlyFiles, partialCandidateRanges } = getCandidateDiff();
	const skippableLineMap = new Map();

	for (const filePath of candidateOnlyFiles) {
		skippableLineMap.set(filePath, buildSkippableLineSetForCandidateOnlyFile(filePath));
	}

	for (const [filePath, ranges] of partialCandidateRanges.entries()) {
		const lineSet = skippableLineMap.get(filePath) ?? new Set();
		for (const [startLine, endLine] of ranges) {
			markRange(lineSet, startLine, endLine);
		}
		skippableLineMap.set(filePath, lineSet);
	}

	return skippableLineMap;
}

export function shouldSkipCandidateLine(
	filePath,
	lineNumber,
	skippableLineMap = getCandidateSkippableLines(),
) {
	const absolutePath = normalizeAbsolute(filePath);
	const lineSet = skippableLineMap.get(absolutePath);
	return lineSet?.has(lineNumber) ?? false;
}

export { REPO_ROOT, SOLUTION_REPO_ROOT };
