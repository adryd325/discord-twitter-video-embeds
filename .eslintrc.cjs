module.exports = {
	env: {
		es2021: true,
		node: true
	},
	extends: ["eslint:recommended", "plugin:prettier/recommended"],
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: "module",
	},
	plugins: ["import"],
	rules: {
		"import/order": [
			"error",
			{
				groups: ["builtin", "external", "internal", "index", "sibling", "parent"],
				alphabetize: {
					order: "asc"
				}
			}
		],
		"prettier/prettier": [
			"warn",
			{
				arrowParens: "always",
				bracketSpacing: true,
				endOfLine: "lf",
				printWidth: 120,
				quoteProps: "as-needed",
				semi: true,
				singleQuote: false,
				tabWidth: 1,
				trailingComma: "none",
				useTabs: true
			}
		],
		"valid-jsdoc": [
			"warn",
			{
				requireReturn: false,
				requireReturnDescription: false,
				requireParamDescription: false,
				prefer: {
					return: "returns",
					arg: "param"
				},
				preferType: {
					String: "string",
					Number: "number",
					Boolean: "boolean",
					Symbol: "symbol",
					object: "Object",
					function: "Function",
					array: "Array",
					date: "Date",
					error: "Error",
					null: "void"
				}
			}
		],
		"no-unused-vars": ["error", { varsIgnorePattern: "^_" }],
		"prefer-const": "error",
		quotes: ["error", "double", { avoidEscape: true }],
		semi: ["error", "always"]
	}
};
