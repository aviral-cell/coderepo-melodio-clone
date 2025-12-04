/**
 * Merge JUnit XML files from backend and frontend into a single root-level junit.xml
 * This script is used for HackerRank scoring which expects a single junit.xml at root
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_JUNIT = path.join(ROOT_DIR, "backend", "junit.xml");
const FRONTEND_JUNIT = path.join(ROOT_DIR, "frontend", "junit.xml");
const OUTPUT_FILE = path.join(ROOT_DIR, "junit.xml");

/**
 * Parse test suite data from JUnit XML content
 * @param {string} content - JUnit XML content
 * @returns {object} - Parsed test suite data
 */
function parseJUnitXML(content) {
	const testSuites = [];

	// Extract individual testsuites
	const testSuiteRegex =
		/<testsuite[^>]*>([\s\S]*?)<\/testsuite>/g;
	let match;

	while ((match = testSuiteRegex.exec(content)) !== null) {
		testSuites.push(match[0]);
	}

	// Extract totals from testsuites root element
	const totalsMatch = content.match(
		/<testsuites[^>]*name="([^"]*)"[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*errors="(\d+)"[^>]*time="([^"]*)"[^>]*>/
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
 * Merge multiple JUnit XML results into a single file
 */
function mergeJUnitFiles() {
	const results = [];

	// Read backend junit.xml if exists
	if (fs.existsSync(BACKEND_JUNIT)) {
		const backendContent = fs.readFileSync(BACKEND_JUNIT, "utf-8");
		const backendData = parseJUnitXML(backendContent);
		results.push(backendData);
		console.log(`Backend: ${backendData.tests} tests, ${backendData.failures} failures`);
	} else {
		console.warn("Backend junit.xml not found");
	}

	// Read frontend junit.xml if exists
	if (fs.existsSync(FRONTEND_JUNIT)) {
		const frontendContent = fs.readFileSync(FRONTEND_JUNIT, "utf-8");
		const frontendData = parseJUnitXML(frontendContent);
		results.push(frontendData);
		console.log(`Frontend: ${frontendData.tests} tests, ${frontendData.failures} failures`);
	} else {
		console.warn("Frontend junit.xml not found");
	}

	if (results.length === 0) {
		console.error("No JUnit XML files found to merge");
		process.exit(1);
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

	// Exit with error code if there are failures
	if (totals.failures > 0 || totals.errors > 0) {
		process.exit(1);
	}
}

mergeJUnitFiles();
