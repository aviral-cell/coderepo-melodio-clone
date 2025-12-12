/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Utility Function Tests
 *
 * Tests for frontend utility functions that handle formatting,
 * string manipulation, and value checking.
 *
 * SCENARIO: Testing various utility functions with normal and edge case inputs
 * EXPECTATION: All utilities return correct values and handle edge cases gracefully
 */

import {
	formatDuration,
	formatNumber,
	formatDate,
	truncate,
	isEmpty,
	capitalize,
	getInitials,
} from "@/shared/utils";

describe("Utility Functions", () => {
	describe("formatDuration", () => {
		it("should format 0 seconds as 0:00", () => {
			expect(formatDuration(0)).toBe("0:00");
		});

		it("should format seconds less than a minute", () => {
			expect(formatDuration(45)).toBe("0:45");
		});

		it("should format exactly one minute", () => {
			expect(formatDuration(60)).toBe("1:00");
		});

		it("should format minutes and seconds", () => {
			expect(formatDuration(125)).toBe("2:05");
		});

		it("should format large numbers (over an hour)", () => {
			expect(formatDuration(3661)).toBe("61:01");
		});

		it("should pad single digit seconds with leading zero", () => {
			expect(formatDuration(65)).toBe("1:05");
			expect(formatDuration(9)).toBe("0:09");
		});

		it("should handle negative numbers by treating them as-is", () => {
			const result = formatDuration(-60);
			expect(result).toBe("-1:00");
		});
	});

	describe("formatNumber", () => {
		it("should format 0", () => {
			expect(formatNumber(0)).toBe("0");
		});

		it("should format small numbers without commas", () => {
			expect(formatNumber(999)).toBe("999");
		});

		it("should add commas for thousands", () => {
			expect(formatNumber(1000)).toBe("1,000");
		});

		it("should format millions with commas", () => {
			expect(formatNumber(1234567)).toBe("1,234,567");
		});

		it("should handle negative numbers", () => {
			expect(formatNumber(-1234)).toBe("-1,234");
		});
	});

	describe("formatDate", () => {
		it("should format a Date object", () => {
			const date = new Date("2023-01-15");
			const result = formatDate(date);
			expect(result).toContain("January");
			expect(result).toContain("15");
			expect(result).toContain("2023");
		});

		it("should format a date string", () => {
			const result = formatDate("2023-06-20");
			expect(result).toContain("June");
			expect(result).toContain("20");
			expect(result).toContain("2023");
		});

		it("should format ISO date strings", () => {
			const result = formatDate("2023-12-25T10:30:00Z");
			expect(result).toContain("December");
			expect(result).toContain("25");
			expect(result).toContain("2023");
		});
	});

	describe("truncate", () => {
		it("should return text unchanged if shorter than maxLength", () => {
			expect(truncate("Hello", 10)).toBe("Hello");
		});

		it("should return text unchanged if exactly maxLength", () => {
			expect(truncate("Hello", 5)).toBe("Hello");
		});

		it("should truncate text longer than maxLength with ellipsis", () => {
			expect(truncate("Hello World", 8)).toBe("Hello...");
		});

		it("should handle maxLength of 3 (minimum for ellipsis)", () => {
			expect(truncate("Hello", 3)).toBe("...");
		});

		it("should handle empty string", () => {
			expect(truncate("", 10)).toBe("");
		});
	});

	describe("isEmpty", () => {
		it("should return true for null", () => {
			expect(isEmpty(null)).toBe(true);
		});

		it("should return true for undefined", () => {
			expect(isEmpty(undefined)).toBe(true);
		});

		it("should return true for empty string", () => {
			expect(isEmpty("")).toBe(true);
		});

		it("should return true for whitespace-only string", () => {
			expect(isEmpty("   ")).toBe(true);
		});

		it("should return true for empty array", () => {
			expect(isEmpty([])).toBe(true);
		});

		it("should return true for empty object", () => {
			expect(isEmpty({})).toBe(true);
		});

		it("should return false for non-empty string", () => {
			expect(isEmpty("hello")).toBe(false);
		});

		it("should return false for non-empty array", () => {
			expect(isEmpty([1, 2, 3])).toBe(false);
		});

		it("should return false for non-empty object", () => {
			expect(isEmpty({ key: "value" })).toBe(false);
		});

		it("should return false for number 0", () => {
			expect(isEmpty(0)).toBe(false);
		});

		it("should return false for boolean false", () => {
			expect(isEmpty(false)).toBe(false);
		});
	});

	describe("capitalize", () => {
		it("should capitalize first letter of a word", () => {
			expect(capitalize("hello")).toBe("Hello");
		});

		it("should return empty string for empty input", () => {
			expect(capitalize("")).toBe("");
		});

		it("should handle single character", () => {
			expect(capitalize("h")).toBe("H");
		});

		it("should keep already capitalized strings unchanged", () => {
			expect(capitalize("Hello")).toBe("Hello");
		});

		it("should only capitalize first letter, leave rest unchanged", () => {
			expect(capitalize("hELLO")).toBe("HELLO");
		});

		it("should handle strings starting with non-letter", () => {
			expect(capitalize("123abc")).toBe("123abc");
		});
	});

	describe("getInitials", () => {
		it("should return initials for single word", () => {
			expect(getInitials("Alex")).toBe("A");
		});

		it("should return initials for two words", () => {
			expect(getInitials("Alex Morgan")).toBe("AM");
		});

		it("should return first two initials for three+ words", () => {
			expect(getInitials("John Paul Smith")).toBe("JP");
		});

		it("should handle lowercase names", () => {
			expect(getInitials("alex morgan")).toBe("AM");
		});

		it("should handle names with extra spaces", () => {
			const result = getInitials("Alex  Morgan");
			expect(result.length).toBeLessThanOrEqual(2);
		});
	});
});
