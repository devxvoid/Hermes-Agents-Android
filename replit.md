# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Hermes AI Agent (`artifacts/hermes`)
- **Kind**: web
- **Preview path**: `/`
- **Stack**: Vite + React + TypeScript
- **Status**: Running

### Mr. Robot Mobile (`artifacts/mr-robot-mobile`)
- **Kind**: mobile (Expo SDK 54, React Native 0.81, expo-router v6)
- **Preview path**: `/mobile/`
- **Theme**: AMOLED black (`#000000`) background, cyan (`#00D4FF`) primary
- **Stack**: Expo SDK 54, expo-router v6, Reanimated v4, AsyncStorage, Inter font, @expo/vector-icons Feather
- **Status**: Metro running (workflow shows FAILED due to platform bug — DIDNT_OPEN_A_PORT for kind=mobile artifacts is a known Replit issue; Metro IS accessible via QR code)
- **Port**: 22333 (HTTP proxy) → 22334 (Metro)
- **QR code**: scan the QR from the workflow logs in Expo Go to run on device

### Screens
- `app/(tabs)/index.tsx` — Main chat with streaming, animated bubbles, typing indicator
- `app/(tabs)/conversations.tsx` — Conversation history list with delete
- `app/(tabs)/memory.tsx` — Memory CRUD with categories and active/inactive toggle
- `app/(tabs)/settings.tsx` — AI provider config (OpenAI-compatible, Anthropic, Gemini), agent name, appearance

### Key Files
- `lib/ai.ts` — AI API layer (OpenAI-compatible, Anthropic, Gemini streaming)
- `contexts/AppContext.tsx` — Global state backed by AsyncStorage
- `types/index.ts` — Shared TypeScript types
- `constants/colors.ts` — AMOLED dark + light theme tokens
- `hooks/useColors.ts` — Color scheme hook
- `scripts/dev-wrapper.js` — HTTP proxy wrapping Metro (port 22333 → 22334)

### Platform Notes
- `configureWorkflow()` in code_execution is non-functional for ALL ports in this environment
- kind=mobile artifact workflows always report DIDNT_OPEN_A_PORT (platform bug)
- The app works fine — users scan the QR code from workflow logs to use it in Expo Go
