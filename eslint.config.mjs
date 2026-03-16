import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"**/dist/**",
			"**/build/**",
			"**/coverage/**",
			"**/node_modules/**",
			"**/__mocks__/**",
		],
	},
	...tseslint.configs.recommended,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
				vi: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"no-empty": "off",
		},
	},
);
