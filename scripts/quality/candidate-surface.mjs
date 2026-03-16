import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const CONTRACT_FILES = [
	path.join(REPO_ROOT, "candidate-contracts", "candidate-frontend-contract.ts"),
	path.join(REPO_ROOT, "candidate-contracts", "candidate-backend-contract.ts"),
];

function normalizeAbsolute(filePath) {
	return path.resolve(filePath);
}

function listTsFilesRecursively(directoryPath) {
	if (!fs.existsSync(directoryPath)) return [];

	const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const absolutePath = path.join(directoryPath, entry.name);

		if (entry.isDirectory()) {
			files.push(...listTsFilesRecursively(absolutePath));
			continue;
		}

		if (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")) {
			files.push(absolutePath);
		}
	}

	return files;
}

function resolveContractSourcePath(contractSourcePath) {
	const rawAbsolute = path.join(REPO_ROOT, contractSourcePath);
	const extension = path.extname(rawAbsolute);
	const candidates = [];

	if (extension === ".js") {
		candidates.push(rawAbsolute.slice(0, -3) + ".ts");
		candidates.push(rawAbsolute.slice(0, -3) + ".tsx");
	} else if (extension) {
		candidates.push(rawAbsolute);
	} else {
		candidates.push(rawAbsolute + ".ts");
		candidates.push(rawAbsolute + ".tsx");
		candidates.push(path.join(rawAbsolute, "index.ts"));
		candidates.push(path.join(rawAbsolute, "index.tsx"));
	}

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return normalizeAbsolute(candidate);
	}

	return normalizeAbsolute(candidates[0]);
}

export function getCandidateSurfaceFiles() {
	const candidateFiles = new Set();
	const importRegex = /from\s+"..\/(frontend|backend)\/src\/([^"]+)"/g;

	for (const contractFile of CONTRACT_FILES) {
		if (!fs.existsSync(contractFile)) continue;

		const content = fs.readFileSync(contractFile, "utf8");
		let match;

		while ((match = importRegex.exec(content)) !== null) {
			const relativePathFromRepoRoot = path.join(match[1], "src", match[2]);
			const resolvedFile = resolveContractSourcePath(relativePathFromRepoRoot);
			candidateFiles.add(resolvedFile);

			const normalizedRelative = relativePathFromRepoRoot.replace(/\\/g, "/");
			const barrelMatch = normalizedRelative.match(
				/^frontend\/src\/shared\/(services|utils|types)\/index$/,
			);
			if (barrelMatch) {
				const barrelDirectory = path.join(
					REPO_ROOT,
					"frontend",
					"src",
					"shared",
					barrelMatch[1],
				);
				for (const file of listTsFilesRecursively(barrelDirectory)) {
					candidateFiles.add(normalizeAbsolute(file));
				}
			}
		}
	}

	return candidateFiles;
}

export function isCandidateSurfaceFile(filePath, candidateFiles = getCandidateSurfaceFiles()) {
	return candidateFiles.has(normalizeAbsolute(filePath));
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

function buildSkippableLineSetForFile(filePath) {
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

		// Handle multiline import/export statements.
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

		// Handle declaration blocks (function/type/interface/class/etc).
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

			const isClosedBlock = declarationSawBrace && declarationBraceDepth <= 0;
			if (isClosedBlock) {
				markRange(skippableLines, declarationStartLine, lineNumber);
				declarationStartLine = null;
				declarationMode = null;
				declarationBraceDepth = 0;
				declarationSawBrace = false;
			}
			continue;
		}

		const declarationMatch = trimmed.match(declarationStartRegex);
		if (declarationMatch) {
			const declarationKind = declarationMatch[3];
			const shouldUseSemicolonMode = declarationKind === "type"
				|| declarationKind === "const"
				|| declarationKind === "let"
				|| declarationKind === "var";

			if (shouldUseSemicolonMode) {
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
	}

	return skippableLines;
}

export function getCandidateSkippableLines(candidateFiles = getCandidateSurfaceFiles()) {
	const skippableLineMap = new Map();

	for (const filePath of candidateFiles) {
		skippableLineMap.set(filePath, buildSkippableLineSetForFile(filePath));
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

export { REPO_ROOT };
