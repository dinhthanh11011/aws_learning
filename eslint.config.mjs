import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Exam *version* ids are facts in exactly four places: the cert files that
    // define them, the registry that resolves them, the schema tuple that types
    // them, and the frozen legacy map that migrates old rows. Everywhere else a
    // version literal is a leak that makes the next exam revision expensive —
    // the thing this codebase is arranged to avoid. Content tags a family; UI
    // asks the registry.
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
    ignores: [
      "src/content/certs/**",
      "src/content/cert-registry.ts",
      "src/content/schema.ts",
      "src/db/migrate.ts",
      // Tests *of* the version machinery: asserting that 'SAA-C03' maps to the
      // 'saa' family, or that a specific version resolves a specific task, is
      // only meaningful if it names the version. Tests that merely *use* a cert
      // are not exempt — those go through currentCertFor().
      "src/content/cert-registry.test.ts",
      "src/db/migrate.test.ts",
      "src/db/upgrade.test.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^[A-Z]{2,4}-C[0-9]{2}$/]",
          message:
            "Cert version ids belong in src/content/certs/ and cert-registry.ts. Use CERT_FAMILIES, certShort(), familyOf(), DEFAULT_CERT_ID, currentCertFor() or inScope() instead.",
        },
      ],
    },
  },
]);

export default eslintConfig;
