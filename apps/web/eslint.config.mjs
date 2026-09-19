import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/ui/**/*", "src/components/form/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/services/**",
                "@/lib/http/**",
                "**/lib/http/**",
                "@/hooks/**",
                "@/app/**",
                "@/components/auth/**",
                "@/components/ai/**",
                "**/services/**",
                "**/hooks/**",
                "**/app/**",
                "**/auth/**",
                "**/ai/**",
              ],
              message: "UI compartilhada não depende de domínio ou transporte.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/services/**/*", "src/lib/http/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/**",
                "react-dom",
                "react-dom/**",
                "@/components/**",
                "@/hooks/**",
                "@/app/**",
                "**/components/**",
                "**/hooks/**",
                "**/app/**",
              ],
              message: "Serviços não dependem da interface.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
