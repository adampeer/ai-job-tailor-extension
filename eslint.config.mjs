import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions, // Chrome extension APIs
        chrome: "readonly",
        CONFIG: "readonly", // Your config.js global
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
  {
    files: ["background.js"],
    languageOptions: {
      sourceType: "script", // Service workers use script, not module
      globals: {
        ...globals.serviceworker,
        ...globals.webextensions,
        chrome: "readonly",
        CONFIG: "readonly",
        importScripts: "readonly",
      },
    },
  },
];
