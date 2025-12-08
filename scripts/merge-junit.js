/**
 * Merge JUnit XML files from task-specific tests into a single junit.xml
 * This script is used for HackerRank scoring which expects a single junit.xml
 *
 * Reads: output/task1.xml, output/task2.xml, output/task3.xml
 * Outputs: output/junit.xml
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

// Task-specific XML files
const TASK_FILES = [
	{ name: "Task 1 - Debounce", file: path.join(OUTPUT_DIR, "task1.xml") },
	{ name: "Task 2 - Shuffle", file: path.join(OUTPUT_DIR, "task2.xml") },
	{ name: "Task 3 - Interval", file: path.join(OUTPUT_DIR, "task3.xml") },
];

const OUTPUT_FILE = path.join(OUTPUT_DIR, "junit.xml");

/**
 * Parse test suite data from JUnit XML content
 * @param {string} content - JUnit XML content
 * @returns {object} - Parsed test suite data
 */
function parseJUnitXML(content) {
	const testSuites = [];

	// Extract individual testsuites
	const testSuiteRegex = /<testsuite[^>]*>([\s\S]*?)<\/testsuite>/g;
	let match;

	while ((match = testSuiteRegex.exec(content)) !== null) {
		testSuites.push(match[0]);
	}

	// Extract totals from testsuites root element
	const totalsMatch = content.match(
		/<testsuites[^>]*name="([^"]*)"[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*errors="(\d+)"[^>]*time="([^"]*)"/
	);

	return {
		name: totalsMatch ? totalsMatch[1] : "jest tests",
		tests: totalsMatch ? parseInt(totalsMatch[2], 10) : 0,
		failures: totalsMatch ? parseInt(totalsMatch[3], 10) : 0,
		errors: totalsMatch ? parseInt(totalsMatch[4], 10) : 0,
		time: totalsMatch ? parseFloat(totalsMatch[5]) : 0,
		testSuites,
	};
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
		console.log(`Created output directory: ${OUTPUT_DIR}`);
	}
}

/**
 * Merge multiple JUnit XML results into a single file
 */
function mergeJUnitFiles() {
	ensureOutputDir();

	const results = [];

	// Read each task's junit.xml if it exists
	for (const task of TASK_FILES) {
		if (fs.existsSync(task.file)) {
			const content = fs.readFileSync(task.file, "utf-8");
			const data = parseJUnitXML(content);
			results.push(data);
			console.log(`${task.name}: ${data.tests} tests, ${data.failures} failures`);
		} else {
			console.warn(`${task.name}: junit.xml not found at ${task.file}`);
		}
	}

	if (results.length === 0) {
		console.error("No JUnit XML files found to merge");
		// Create empty junit.xml for HackerRank
		const emptyXML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Jest Tests" tests="0" failures="0" errors="0" time="0">
</testsuites>
`;
		fs.writeFileSync(OUTPUT_FILE, emptyXML, "utf-8");
		console.log(`Created empty junit.xml at: ${OUTPUT_FILE}`);
		process.exit(0);
	}

	// Aggregate totals
	const totals = results.reduce(
		(acc, result) => ({
			tests: acc.tests + result.tests,
			failures: acc.failures + result.failures,
			errors: acc.errors + result.errors,
			time: acc.time + result.time,
		}),
		{ tests: 0, failures: 0, errors: 0, time: 0 }
	);

	// Combine all test suites
	const allTestSuites = results.flatMap((r) => r.testSuites);

	// Generate merged XML
	const mergedXML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Jest Tests" tests="${totals.tests}" failures="${totals.failures}" errors="${totals.errors}" time="${totals.time.toFixed(3)}">
${allTestSuites.join("\n")}
</testsuites>
`;

	// Write merged file
	fs.writeFileSync(OUTPUT_FILE, mergedXML, "utf-8");

	console.log(`\nMerged junit.xml created at: ${OUTPUT_FILE}`);
	console.log(`Total: ${totals.tests} tests, ${totals.failures} failures, ${totals.errors} errors`);

	// Always exit with 0 - let HackerRank evaluate based on test results
	// The scoring is based on junit.xml content, not exit code
	process.exit(0);
}

mergeJUnitFiles();
