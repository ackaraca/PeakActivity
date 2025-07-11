import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        sourceType: "module",
      },
    },
    ignores: ["lib/**/*"], // Ignore built files.
    rules: {
      "quotes": ["off"],
      "import/no-unresolved": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
); 