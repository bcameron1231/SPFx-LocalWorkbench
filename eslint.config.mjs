import typescriptEslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [{
    files: ["**/*.ts"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
    },

    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrors: "none",
        }],

        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        "prefer-template": "warn",
        semi: "warn",
    },
}, eslintConfigPrettier];