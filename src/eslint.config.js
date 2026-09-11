import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**"],
  },

  js.configs.recommended,

  // Các file JS thông thường
  {
    files: ["**/*.{js,mjs}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-undef": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // CommonJS
  {
    files: ["**/*.cjs"],

    languageOptions: {
      sourceType: "commonjs",

      globals: {
        ...globals.node,
      },
    },
  },

  // Jest test files
  {
    files: [
      "**/*.test.js",
      "**/*.spec.js",
      "**/test/**/*.js",
      "**/tests/**/*.js",
    ],

    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];