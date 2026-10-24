// vp migrate: merged .oxlintrc.json (3f86e5523a5213b64941c4f58bf06403).
import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {
    arrowParens: "avoid",
    bracketSameLine: false,
    bracketSpacing: true,
    embeddedLanguageFormatting: "auto",
    endOfLine: "lf",
    htmlWhitespaceSensitivity: "css",
    ignorePatterns: [],
    insertFinalNewline: true,
    jsdoc: false,
    jsxSingleQuote: false,
    objectWrap: "preserve",
    overrides: [],
    printWidth: 80,
    proseWrap: "preserve",
    quoteProps: "as-needed",
    semi: true,
    singleAttributePerLine: false,
    singleQuote: false,
    sortImports: false,
    sortPackageJson: true,
    sortTailwindcss: true,
    svelte: true,
    tabWidth: 2,
    trailingComma: "none",
    useTabs: false,
    vueIndentScriptAndStyle: false
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
      correctness: "error"
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error"
    },
    overrides: [
      {
        files: ["src/lib/index.ts"],
        rules: {
          "unicorn/no-empty-file": "off"
        }
      }
    ],
    env: {
      builtin: true
    },
    options: {
      typeAware: true,
      // svelte-check owns type checking: tsgolint cannot resolve exports from .svelte modules.
      typeCheck: false
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin"
      }
    ]
  },
  plugins: lazyPlugins(() => [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        experimental: {
          async: true
        },
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true
      },
      experimental: {
        remoteFunctions: true
      },

      // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
      // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
      // See https://svelte.dev/docs/kit/adapters for more information about adapters.
      adapter: adapter()
    })
  ])
});
