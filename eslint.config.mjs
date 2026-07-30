import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Guard 3 (ADR-6): analytics calls may never carry an argument, so a user
  // input can never become an analytics event property.
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='track'][arguments.length>0]",
          message:
            "track() must take no arguments — user inputs must never be eventable (ADR-6).",
        },
      ],
    },
  },

  // Guard 1 (ADR-4): nothing inside src/lib/stats/ may import from outside it.
  // Allowed: relative specifiers within the directory ('./...'). Forbidden:
  // bare packages (react, react-dom, ...), next/*, the '@/*' alias, and any
  // parent-escaping '../' specifier.
  {
    files: ["src/lib/stats/**/*.{ts,tsx}", "src/lib/stats/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/*",
                "@/*",
                "../*",
                "../**",
              ],
              message:
                "src/lib/stats/ must not import from outside itself (ADR-4).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
