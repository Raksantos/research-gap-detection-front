import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * "Indigo Scholar" — dark-first palette for the Research Gap Detection app.
 *
 * - brand  : indigo (primary actions, links, accents)
 * - accent : sky    (secondary highlights)
 * - bg/fg/border semantic tokens are overridden so every page inherits the
 *   slate-on-deep-navy surface treatment automatically.
 *
 * The app currently runs dark-only (see ThemeProvider in main.tsx). We still
 * provide sane `_light` values so a future light mode degrades gracefully.
 */
const config = defineConfig({
  globalCss: {
    "html, body": {
      bg: "bg",
      color: "fg",
    },
    "*::selection": {
      bg: "brand.muted",
      color: "fg",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: {
          value:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        body: {
          value:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      colors: {
        brand: {
          50: { value: "#eef2ff" },
          100: { value: "#e0e7ff" },
          200: { value: "#c7d2fe" },
          300: { value: "#a5b4fc" },
          400: { value: "#818cf8" },
          500: { value: "#6366f1" },
          600: { value: "#4f46e5" },
          700: { value: "#4338ca" },
          800: { value: "#3730a3" },
          900: { value: "#312e81" },
          950: { value: "#1e1b4b" },
        },
        accent: {
          50: { value: "#f0f9ff" },
          100: { value: "#e0f2fe" },
          200: { value: "#bae6fd" },
          300: { value: "#7dd3fc" },
          400: { value: "#38bdf8" },
          500: { value: "#0ea5e9" },
          600: { value: "#0284c7" },
          700: { value: "#0369a1" },
          800: { value: "#075985" },
          900: { value: "#0c4a6e" },
          950: { value: "#082f49" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Page surfaces
        bg: {
          DEFAULT: { value: { _light: "#f8fafc", _dark: "#0b1120" } },
          subtle: { value: { _light: "#f1f5f9", _dark: "#101626" } },
          muted: { value: { _light: "#e2e8f0", _dark: "#1b2336" } },
          panel: { value: { _light: "#ffffff", _dark: "#151b2b" } },
        },
        fg: {
          DEFAULT: { value: { _light: "#0f172a", _dark: "#e2e8f0" } },
          muted: { value: { _light: "#475569", _dark: "#94a3b8" } },
          subtle: { value: { _light: "#64748b", _dark: "#64748b" } },
        },
        border: {
          DEFAULT: { value: { _light: "#e2e8f0", _dark: "#26304a" } },
          muted: { value: { _light: "#eef2f6", _dark: "#1e2740" } },
        },
        // colorPalette="brand"
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.white}" },
          fg: {
            value: { _light: "{colors.brand.600}", _dark: "{colors.brand.300}" },
          },
          muted: {
            value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" },
          },
          subtle: {
            value: { _light: "{colors.brand.50}", _dark: "{colors.brand.950}" },
          },
          emphasized: { value: "{colors.brand.400}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        // colorPalette="accent"
        accent: {
          solid: { value: "{colors.accent.500}" },
          contrast: { value: "{colors.white}" },
          fg: {
            value: { _light: "{colors.accent.600}", _dark: "{colors.accent.300}" },
          },
          muted: {
            value: { _light: "{colors.accent.100}", _dark: "{colors.accent.900}" },
          },
          subtle: {
            value: { _light: "{colors.accent.50}", _dark: "{colors.accent.950}" },
          },
          emphasized: { value: "{colors.accent.400}" },
          focusRing: { value: "{colors.accent.500}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
