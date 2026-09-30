import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Configuration ESLint « flat » (format obligatoire depuis ESLint 9, qui
 * ignore les .eslintrc) — sans elle, `npm run lint` échouait avec
 * « couldn't find an eslint.config.js file » alors que tous les plugins
 * étaient déjà installés.
 *
 * Volontairement sans règles de type-checking (`parserOptions.project`) :
 * elles imposeraient un second passage complet du compilateur à chaque lint,
 * alors que `npm run build` lance déjà `tsc -b` — ce serait payer deux fois
 * pour la même vérification.
 */
export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Le composant exporté doit être le seul export du module pour que le
      // rafraîchissement à chaud de Vite préserve l'état ; les constantes et
      // types exportés à côté ne le cassent pas.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // TypeScript vérifie déjà l'existence des symboles, et il connaît les
      // globales du navigateur (DOM lib) que cette règle ignore.
      "no-undef": "off",
      // Un paramètre préfixé de « _ » signale une valeur volontairement
      // ignorée (signature imposée par une bibliothèque, par exemple).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Fichiers de configuration exécutés par Node (hors du périmètre de l'app).
    files: ["*.config.js", "*.config.ts"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
];
