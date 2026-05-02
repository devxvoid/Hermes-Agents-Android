# Build Hermes AI Agent — Complete Production-Ready MVP for Android and Web

## Project Name

**Hermes AI Agent**

## Main Goal

Build a complete, polished, production-ready MVP of **Hermes AI Agent** that can be published as an Android app on Google Play and also run as a responsive web app.

Hermes AI Agent is a personal AI operating console where users can:

- Chat with an AI assistant
- Manage conversations
- Store and use long-term memory
- Create and activate skills
- Configure real online AI models using API keys
- Configure custom AI endpoints
- Use supported local AI runtimes
- Manage offline/local model files where technically possible
- Export/import app data
- Use the app on mobile without layout bugs or crashes

This must not be a static mockup, decorative prototype, fake AI selector, or visual-only dashboard. Every core feature must be wired into real application logic.

---

# Important Build Standard

The app must be built as a complete MVP, not a prototype.

The final result must be:

- Functional
- Mobile-first
- Stable
- Error-handled
- Responsive
- Production-ready
- Ready for Android packaging
- Ready for Google Play internal testing
- Free from obvious runtime crashes
- Free from broken navigation
- Free from fake buttons
- Free from placeholder-only features

If a feature depends on external setup, such as a local AI runtime, the app must clearly explain the requirement and show accurate connection status instead of pretending it works.

---

# Platform Target

Build the app as a modern React + TypeScript web application that can be wrapped as an Android app using Capacitor.

## Required Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui if available
- Lucide icons
- LocalStorage and/or IndexedDB for local persistence
- React Router with guarded routes
- Error boundaries
- Capacitor-ready project structure for Android packaging

## Android Publishing Target

Prepare the app for Android release packaging.

Requirements:

- Capacitor Android support
- Production web build
- Android app name: **Hermes AI Agent**
- Package name example: `com.hermes.aiagent`
- Adaptive icon placeholder
- Splash screen placeholder
- Version code and version name setup
- Build output should support Android App Bundle `.aab`
- Target SDK should be Android 15 / API 35 or newer
- Min SDK should be reasonable, such as API 23 or newer
- No unnecessary Android permissions
- Internet permission only if needed for online AI APIs
- Clear privacy disclosure for API keys, local storage, and model usage
- No hardcoded API keys
- No copyrighted or stolen assets

---

# Product Vision

Hermes AI Agent is an autonomous productivity and intelligence assistant for:

- Research support
- Task planning
- Data analysis assistance
- App development guidance
- Conversation management
- Long-term memory
- Skill-based execution
- AI model orchestration
- Local/offline AI workflows

The product should combine five core systems:

1. **Chat**
   - Main interaction layer where users talk to Hermes.

2. **Conversations**
   - Stores and manages previous chats.

3. **Memory**
   - Stores useful facts, user preferences, project details, and reusable context.

4. **Skills**
   - Defines specialized assistant abilities such as research, coding, Android app building, writing, summarization, debugging, and task planning.

5. **AI Models**
   - Allows users to configure real online and local AI models.

---

# Design Direction

Create a premium AI-dashboard interface with a clean futuristic aesthetic.

## Visual Style

Use a modern interface inspired by:

- OpenAI-style AI tools
- Linear-style dashboards
- Raycast command center
- Arc browser polish
- Premium mobile productivity apps
- Cybernetic / Hermes / intelligent-agent branding

## UI Requirements

The interface should include:

- Dark mode first design
- Light mode support
- Subtle gradient background
- Glassmorphism panels
- Soft borders
- Elegant shadows
- Smooth hover states
- Premium cards
- Responsive layout
- Clean typography
- Modern sidebar navigation on desktop
- Bottom navigation on mobile
- Clear active states
- Empty states for all sections
- Loading states
- Skeleton states
- Error states
- Toast notifications
- Confirmation dialogs
- Mobile-safe spacing
- Safe area support for Android and iOS-style webviews

## Suggested Color Palette

Use a sophisticated palette:

- Background: near-black / deep navy
- Primary: electric blue or violet
- Accent: cyan / emerald
- Cards: translucent dark slate
- Text: white, slate, muted gray
- Borders: soft blue-gray

Do not make the UI look generic or like a basic CRUD dashboard.

---

# Core App Navigation

Use these main sections:

- Dashboard
- Chat
- Conversations
- Memory
- Skills
- AI Models
- Settings

## Desktop Navigation

Use a premium sidebar layout.

## Mobile Navigation

Use a bottom navigation bar with:

- Home
- Chat
- Chats
- Memory
- Skills
- More

The mobile UI must avoid bottom navigation covering chat content.

Use safe bottom padding:

```css
.chat-scroll-area {
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
}
```

---

# Page 1: Dashboard

The Dashboard should feel like a real command center.

Include:

- Hero card with app name: **Hermes AI Agent**
- Short description:

```text
Autonomous assistant for research, task management, data analysis, and agent orchestration.
```

- Current active AI model
- Online/local/demo mode badge
- AI connection status
- Quick stats:
  - Total conversations
  - Saved memories
  - Enabled skills
  - Configured AI models
  - Downloaded local models
  - Recent activity
- Quick action buttons:
  - Start new chat
  - Add memory
  - Create skill
  - Configure AI model
  - View conversations
- Recent conversations list
- Recently used skills
- Memory highlights
- Local/offline AI status card

All dashboard stats must be based on real app data, not static numbers.

---

# Page 2: Chat

The Chat page is the most important part of the app.

Create a complete AI chat interface with:

- Message bubbles for user and assistant
- Input box with send button
- New chat button
- Conversation title generation
- Conversation history persistence
- Timestamp per message
- Typing/loading animation
- Streaming response support when provider supports it
- Empty state when no chat has started
- Clear chat option
- Pin chat option
- Delete chat option
- Suggested starter prompts
- Current model badge
- Online/local/demo mode badge
- Memory enabled badge
- Skills enabled badge

## Starter Prompt Examples

Include starter prompts such as:

```text
Summarize my current project plan.
Use my memory and help me plan today.
Which skills can help me build an Android app?
Create a launch checklist for my product.
Analyze my saved notes and suggest next actions.
Configure a local AI model for offline use.
```

---

# Critical Chat Behavior Fix

Hermes must behave naturally.

The current broken behavior is that simple messages like:

```text
Hello
How are you?
```

receive an unnatural planning response like:

```text
Understood: Hello

No matching memories or skills triggered. Add more memory entries or skill keywords to personalize future answers.

Recommended plan:
- Restate the goal in one sentence.
- List the constraints and known facts.
- Propose 2–3 viable approaches.
- Pick the best approach and outline steps.

Next action: Tell me which step to expand and I'll go deeper.
```

This must be fixed.

Hermes must only use memory and skills when they are actually useful.

Simple greetings, casual conversation, short acknowledgements, and basic questions must receive natural assistant responses.

---

# Message Intent Classifier

Add an intent classifier inside the chat/agent logic.

```ts
type MessageIntent =
  | "greeting"
  | "casual"
  | "question"
  | "task"
  | "coding"
  | "research"
  | "planning"
  | "debugging"
  | "memory_request"
  | "skill_request"
  | "model_configuration"
  | "unknown";
```

## Greeting Intent

Examples:

```text
hello
hi
hey
good morning
good evening
how are you?
what's up?
```

Expected response:

```text
Hey, I’m here. How can I help you today?
```

or:

```text
I’m doing well and ready to help. What are we working on?
```

Do not show:

- “No matching memories or skills”
- “Recommended plan”
- Skill trigger messages
- Memory trigger messages
- Planning template

## Casual Intent

Examples:

```text
thanks
ok
okay
cool
nice
great
yes
no
continue
go ahead
```

Expected responses:

```text
Got it.
```

```text
Sure — continuing.
```

```text
You’re welcome.
```

Do not force memory or skill usage.

## General Question Intent

Examples:

```text
What can you do?
Explain this feature.
How does memory work?
What is local AI?
```

Expected behavior:

- Answer directly.
- Use memory only if it clearly improves the answer.
- Use skills only if the question clearly matches a skill.
- Do not always produce a project plan.

## Task Intent

Examples:

```text
Create a prompt for Lovable.
Make a GitHub Actions workflow.
Build a notes app plan.
Fix this Android build error.
Analyze this crash log.
```

Expected behavior:

- Use relevant skills if confidence is high.
- Use relevant memories if directly related.
- Provide structured help.
- Show concise metadata only when useful.

---

# Memory Usage Rules

Memory should not trigger for every message.

Use memory only when:

1. The message contains a meaningful task or preference-related request.
2. The memory has clear keyword or semantic relevance.
3. The user explicitly asks about memory, preferences, previous context, or saved information.
4. The user asks for personalized planning or project continuation.

Do not use memory for:

- Greetings
- “How are you?”
- “Thanks”
- “Ok”
- “Yes”
- “No”
- Random one-word replies
- Simple casual conversation

## Memory Match Confidence

Implement scoring.

```ts
function shouldUseMemory(message: string, memories: Memory[]): boolean {
  const normalized = message.toLowerCase().trim();

  const casualMessages = [
    "hi",
    "hello",
    "hey",
    "how are you",
    "how are you?",
    "thanks",
    "thank you",
    "ok",
    "okay",
    "cool",
    "nice",
    "yes",
    "no"
  ];

  if (casualMessages.includes(normalized)) {
    return false;
  }

  if (normalized.length < 12) {
    return false;
  }

  return findRelevantMemories(message, memories).some(memory => memory.score >= 0.45);
}
```

Memory should only appear in the response if it was actually used.

Do not show this for normal chat:

```text
No matching memories found.
```

---

# Skill Trigger Rules

Skills should not trigger every time.

Use skills only when:

1. The user asks for a task that matches a skill.
2. Trigger keyword match is strong.
3. The message is long enough to represent a real request.
4. The skill would improve the answer.

Do not trigger skills for:

- Greetings
- Casual replies
- Small talk
- Very short messages
- Simple status messages

## Skill Match Confidence

Implement scoring.

```ts
function shouldTriggerSkill(message: string, skills: Skill[]): boolean {
  const normalized = message.toLowerCase().trim();

  if (normalized.length < 15) {
    return false;
  }

  const blockedCasualPatterns = [
    /^hi$/,
    /^hello$/,
    /^hey$/,
    /^how are you\??$/,
    /^thanks?$/,
    /^thank you$/,
    /^ok$/,
    /^okay$/,
    /^yes$/,
    /^no$/
  ];

  if (blockedCasualPatterns.some(pattern => pattern.test(normalized))) {
    return false;
  }

  return findTriggeredSkills(message, skills).some(skill => skill.score >= 0.55);
}
```

Do not show this for simple chat:

```text
No matching skills triggered.
```

---

# Assistant Response Modes

Create separate response modes.

```ts
type ResponseMode =
  | "natural"
  | "direct_answer"
  | "task_assistance"
  | "technical_debug"
  | "planning"
  | "memory_management"
  | "skill_execution"
  | "model_setup";
```

## Natural Mode

Use for greetings and casual messages.

Example:

```text
Hey, I’m here. What would you like to work on?
```

## Direct Answer Mode

Use for normal questions.

Example:

```text
Local AI means running an AI model on your own device or local server instead of sending requests to an online API.
```

## Task Assistance Mode

Use for meaningful tasks.

Example:

```text
I can help you turn this into a Lovable prompt. Here is a cleaner production-ready version:
...
```

## Technical Debug Mode

Use for errors, crash logs, code, and build issues.

Example:

```text
The crash is happening when Chat.tsx calls navigation/replaceState while opening an older conversation. The fix is to avoid calling navigate() inside an effect unless the target route is different and the conversation ID is valid.
```

---

# Correct Chat Response Generator

Replace any generic always-on response template.

Do not always generate this:

```text
Understood: {message}

No matching memories or skills triggered...

Recommended plan:
...
```

Use logic like:

```ts
function generateAssistantResponse(input: GenerateResponseInput): string {
  const intent = classifyMessageIntent(input.userMessage);

  if (intent === "greeting") {
    return "Hey, I’m here. How can I help you today?";
  }

  if (intent === "casual") {
    return generateCasualResponse(input.userMessage);
  }

  if (intent === "question" && input.triggeredSkills.length === 0) {
    return generateDirectAnswer(input);
  }

  if (input.triggeredSkills.length > 0 || intent === "task") {
    return generateTaskResponse(input);
  }

  return generateDirectAnswer(input);
}
```

---

# Chat Context Panel

Do not put unnecessary memory/skill status text inside assistant messages.

Instead, add a small expandable context panel showing:

- Active conversation
- Relevant memories used
- Skills triggered
- AI provider
- AI model
- Response mode
- Latency
- Token usage if available
- Status indicator

Do not expose fake chain-of-thought.

Use operational summaries only, such as:

```text
Hermes used 2 relevant memories and activated Android App Builder.
```

If no memories or skills were used, do not show warnings inside the main assistant response.

---

# Page 3: Conversations

Create a Conversations page where users can manage previous chats.

Features:

- List all conversations
- Search conversations
- Filter by recent / pinned / archived
- Open conversation
- Rename conversation
- Pin/unpin conversation
- Archive conversation
- Delete conversation
- Show message count
- Show last updated time
- Empty state if no conversations exist

Each conversation should include:

- ID
- Title
- Created date
- Updated date
- Messages
- Tags
- Pinned status
- Archived status

---

# Critical Crash Fix: Opening Older Chats

The app currently crashes when opening older chats.

Crash details show:

```text
replaceState
react-router-dom
src/pages/Chat.tsx:68:22
has_blank_screen: true
```

This likely means `Chat.tsx` is calling `navigate()` or `replace()` incorrectly while loading an older conversation.

## Required Fix

Fix `Chat.tsx` so older conversations open safely without blank screen crashes.

## Likely Root Causes

Check for:

1. `navigate()` or `replace()` called inside `useEffect` repeatedly.
2. Effect dependency array causing infinite navigation loop.
3. App trying to navigate to an invalid conversation ID.
4. Selected conversation is undefined/null.
5. Route replaced with the same URL repeatedly.
6. Conversation data malformed from localStorage.
7. Older messages missing new fields.
8. App assumes every message has metadata.
9. LocalStorage migration missing.

---

# Required Chat Routing

Use stable chat routes:

```text
/chat
/chat/:conversationId
```

Behavior:

- `/chat` opens current active chat or creates a new one safely.
- `/chat/:conversationId` opens selected conversation only if it exists.
- If the conversation does not exist, show fallback UI.
- Do not call `replaceState` repeatedly.
- Do not redirect in a loop.

## Guarded Navigation

Avoid this bad pattern:

```ts
useEffect(() => {
  navigate(`/chat/${activeConversation.id}`, { replace: true });
}, [activeConversation]);
```

Use guarded navigation:

```ts
useEffect(() => {
  if (!activeConversation?.id) return;

  const targetPath = `/chat/${activeConversation.id}`;

  if (location.pathname !== targetPath) {
    navigate(targetPath, { replace: true });
  }
}, [activeConversation?.id, location.pathname, navigate]);
```

Prefer state-based selection whenever possible:

```ts
setActiveConversationId(conversationId);
```

Only navigate when the user explicitly selects a chat.

---

# Conversation Fallback UI

If a chat cannot be found, show:

```text
Conversation not found

This chat may have been deleted or the saved data may be outdated.
```

Include buttons:

- Go to Chats
- Start New Chat
- Clear Broken Reference

Do not crash or show a blank screen.

---

# Data Migration for Older Conversations

Older chats may not include new fields.

Create migration functions.

```ts
function normalizeConversation(raw: Partial<Conversation>): Conversation {
  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.title || "Untitled Chat",
    messages: Array.isArray(raw.messages)
      ? raw.messages.map(normalizeMessage)
      : [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    tags: Array.isArray(raw.tags) ? raw.tags : []
  };
}
```

```ts
function normalizeMessage(raw: Partial<Message>): Message {
  return {
    id: raw.id || crypto.randomUUID(),
    role: raw.role === "assistant" || raw.role === "user" ? raw.role : "assistant",
    content: typeof raw.content === "string" ? raw.content : "",
    createdAt: raw.createdAt || new Date().toISOString(),
    usedMemoryIds: Array.isArray(raw.usedMemoryIds) ? raw.usedMemoryIds : [],
    triggeredSkillIds: Array.isArray(raw.triggeredSkillIds) ? raw.triggeredSkillIds : [],
    metadata: raw.metadata || undefined
  };
}
```

Run migration whenever conversations are loaded from localStorage.

---

# Safe Storage Layer

Add safe JSON parsing for all localStorage/IndexedDB data.

```ts
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
```

Never assume localStorage data is valid.

Example:

```ts
const raw = safeJsonParse<Partial<Conversation>[]>(
  localStorage.getItem("hermes_conversations"),
  []
);

const conversations = raw.map(normalizeConversation);
```

---

# Error Boundaries

Add app-level and page-level error boundaries.

Required:

- Global app error boundary
- Chat page error boundary
- AI Models page error boundary

Chat fallback should show:

```text
Chat failed to load

Hermes recovered from a local chat error. You can return to chats or start a new conversation.
```

Buttons:

- Reload Chat
- Start New Chat
- Clear Corrupted Chat Data

---

# Page 4: Memory

Create a Memory page that works like long-term memory management.

Memory is not decorative. It must be used by Chat only when relevant.

Features:

- Add memory
- Edit memory
- Delete memory
- Search memory
- Filter by category
- Toggle active/inactive memory
- Show memory usage count
- Show last used time
- Manual “Use in next chat” option
- Memory quality indicator

Memory categories:

- Personal preference
- Project
- App idea
- Coding
- Workflow
- Contact
- General

Each memory item should include:

- Title
- Content
- Category
- Tags
- Created date
- Updated date
- Last used date
- Usage count
- Active status

Default memories on first load:

- User prefers production-ready apps over prototypes.
- User likes clean Markdown prompts and structured responses.
- User prefers Android development using Kotlin and Jetpack Compose.
- User values mobile-first workflows and GitHub Actions automation.

---

# Page 5: Skills

Create a Skills page where the user can manage the agent’s abilities.

Skills must be functional and must affect Chat only when relevant.

Features:

- Skill cards
- Enable/disable skill
- Create custom skill
- Edit skill
- Delete skill
- Search skills
- Filter by category
- Trigger keyword management
- Usage count
- Last used date
- Test skill button

Skill categories:

- Research
- Coding
- Android Development
- Writing
- Summarization
- Task Planning
- Debugging
- Data Analysis
- Productivity
- Automation
- AI Model Setup
- General

Default skills:

## Research Assistant

Helps investigate topics, compare options, and produce structured findings.

Trigger keywords:

- research
- investigate
- compare
- find information

## Android App Builder

Helps plan and build Android applications with architecture, screens, features, and implementation steps.

Trigger keywords:

- android
- kotlin
- compose
- apk
- aab
- mobile app
- play store

## Code Reviewer

Reviews code, identifies bugs, and suggests improvements.

Trigger keywords:

- code
- bug
- error
- fix
- review

## Debugging Specialist

Analyzes crash logs, runtime errors, build logs, and broken app behavior.

Trigger keywords:

- crash
- runtime error
- stack trace
- blank screen
- not working
- failed

## Task Planner

Breaks large goals into clear steps, milestones, and checklists.

Trigger keywords:

- plan
- checklist
- roadmap
- tasks
- schedule

## Memory Analyst

Uses stored memory to personalize answers and connect past context.

Trigger keywords:

- memory
- remember
- preferences
- context

## Writing Assistant

Improves prompts, documents, app descriptions, and professional writing.

Trigger keywords:

- rewrite
- prompt
- markdown
- description
- improve

## AI Model Setup Assistant

Helps configure online AI providers, custom APIs, and local AI runtimes.

Trigger keywords:

- model
- api key
- ollama
- lm studio
- local ai
- offline ai
- openrouter
- gemini
- anthropic

---

# Page 6: AI Models

Create a dedicated **AI Models** page.

This page allows users to configure:

- Online AI providers
- Custom API models
- Local AI runtimes
- Downloaded local model files
- Advanced AI settings

The AI model system must be real and connected to Chat.

If a user configures a valid API key, base URL, and model name, Chat must send real requests to that provider and display real model responses.

If no real model is configured, Chat may use Demo Mode, but it must clearly show:

```text
Demo Mode: Configure an AI model to enable real AI responses.
```

---

# AI Models Page Tabs

Create these tabs:

1. Active Model
2. Online Providers
3. Local AI
4. Downloaded Models
5. Custom Model
6. Advanced Settings

---

# Active Model Tab

Show:

- Provider name
- Model name
- Online/local/demo badge
- API status
- Streaming status
- Last connection test
- Context window
- Temperature
- Max tokens
- Change model button
- Test model button
- Reset model button

---

# Online Providers Tab

Add provider presets for:

- OpenAI
- Anthropic
- Google Gemini
- Groq
- Together AI
- OpenRouter
- Mistral AI
- Perplexity
- Cohere
- DeepSeek
- xAI
- Custom OpenAI-compatible endpoint

Each provider card should include:

- Provider name
- Description
- API key field
- Base URL
- Model dropdown
- Custom model input
- Save button
- Test connection button
- Fetch models button where supported
- Remove key button
- Status badge:
  - Not configured
  - Connected
  - Invalid key
  - Rate limited
  - Network error

API key field must support:

- Show/hide password
- Paste key
- Clear key
- Masked display after saving

---

# Custom Model Support

The user must be able to manually add a custom model.

Fields:

- Display name
- Provider type:
  - OpenAI-compatible
  - Anthropic-compatible
  - Gemini-compatible
  - Custom REST
  - Local OpenAI-compatible
- API key
- Base URL
- Model ID
- Headers JSON
- Request body template
- Response path
- Streaming enabled
- System prompt enabled
- Temperature
- Max tokens
- Top-p
- Timeout
- Save custom model
- Test custom model

Support these API formats:

- OpenAI-compatible chat completions
- Anthropic messages API
- Google Gemini generateContent API
- Custom REST endpoint mode

For OpenAI-compatible endpoints, support:

- OpenRouter
- Groq
- Together AI
- LM Studio server
- Ollama OpenAI-compatible endpoint
- vLLM OpenAI-compatible server
- llama.cpp server with OpenAI-compatible API

---

# Local AI Support

Add a dedicated **Local AI** section.

Support local runtimes:

- Ollama
- LM Studio
- GPT4All
- vLLM
- llama.cpp
- MLC LLM
- Custom local endpoint

Local AI requirements:

- No API key required by default.
- Allow endpoints such as:
  - `http://localhost:11434`
  - `http://127.0.0.1:11434`
  - `http://localhost:1234`
  - `http://127.0.0.1:1234`
  - Custom LAN IP endpoint
- Allow custom ports.
- Support OpenAI-compatible local APIs.
- Support Ollama native API.
- Include provider-specific connection testing.
- Clearly show whether the local server is reachable.
- Show offline availability status.
- Show whether a model is installed or missing.
- Allow manual local model names.
- Never call online APIs when Local Mode is selected.

Example endpoints:

```text
Ollama: http://localhost:11434
LM Studio: http://localhost:1234/v1
vLLM: http://localhost:8000/v1
llama.cpp: http://localhost:8080/v1
GPT4All: custom local endpoint
MLC LLM: custom local endpoint
```

---

# Local AI Model Catalog

Include model families such as:

- Gemma
- Gemma 2
- Gemma 3
- Gemma 4 if available in the selected local runtime
- Llama
- Llama 3
- Llama 3.1
- Llama 3.2
- Mistral
- Mixtral
- Phi
- Qwen
- DeepSeek Coder
- Code Llama
- TinyLlama
- OpenHermes
- Nous Hermes
- Dolphin
- StarCoder
- Yi
- StableLM

Each model preset should show:

- Model name
- Model family
- Parameter size
- Quantization type when known
- Estimated file size
- Minimum RAM recommendation
- Runtime compatibility
- Download status
- Installed status
- Offline support status

---

# Local Model Download System

Add the ability to download or import supported local model files where technically possible.

Requirements:

- Show a local model catalog.
- Allow users to choose a model.
- Show model file size before download.
- Show compatibility warning before download.
- Show download progress.
- Support cancel where possible.
- Save downloaded model metadata.
- Show downloaded models in a local library.
- Allow deleting downloaded models.
- Allow importing a model file manually.
- Allow selecting a downloaded model for local inference.
- Clearly explain when a local runtime is required.

Important:

Do not falsely claim a downloaded model can run directly in the browser unless the chosen runtime supports it.

The app must clearly separate:

1. Downloaded model file
2. Local runtime
3. Running inference server
4. Selected model
5. Chat response

Explain clearly:

```text
Downloading a model file stores it on your device. To run it offline, you also need a compatible local AI runtime such as Ollama, LM Studio, GPT4All, llama.cpp, vLLM, or MLC LLM.
```

---

# Offline AI Behavior

For local AI only:

When a local model is installed and a compatible local runtime is configured:

- User should be able to chat without internet.
- App should route chat requests to the local runtime.
- UI should show “Offline Local Mode”.
- App must not call online APIs.
- App should show model status clearly.

If local runtime is not running, show:

```text
Local AI runtime is not reachable. Start Ollama, LM Studio, GPT4All, vLLM, llama.cpp, or MLC LLM, then test the connection again.
```

---

# AI Provider Service Layer

Create a clean AI service layer.

Suggested structure:

```text
src/
  lib/
    ai/
      aiClient.ts
      providerRegistry.ts
      openAICompatibleClient.ts
      anthropicClient.ts
      geminiClient.ts
      customRestClient.ts
      localRuntimeClient.ts
      modelDownloader.ts
      promptBuilder.ts
      aiTypes.ts
      aiStorage.ts
```

Required functions:

```ts
sendAIMessage(input: SendAIMessageInput): Promise<AIResponse>
testProviderConnection(config: AIProviderConfig): Promise<ProviderTestResult>
fetchProviderModels(config: AIProviderConfig): Promise<string[]>
testLocalRuntime(runtime: LocalRuntimeConfig): Promise<LocalRuntimeStatus>
fetchLocalModels(runtime: LocalRuntimeConfig): Promise<string[]>
downloadLocalModel(model: DownloadableLocalModel): Promise<DownloadResult>
importLocalModel(file: File): Promise<ImportedModel>
buildPromptPayload(input: PromptBuildInput): AIMessagePayload
```

---

# Provider API Behavior

## OpenAI-Compatible

Use endpoint:

```text
POST /chat/completions
```

Payload:

```json
{
  "model": "selected-model",
  "messages": [
    { "role": "system", "content": "system prompt" },
    { "role": "user", "content": "user message" }
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

## Ollama Native

Support endpoint:

```text
POST /api/chat
```

Payload:

```json
{
  "model": "selected-model",
  "messages": [
    { "role": "user", "content": "message" }
  ],
  "stream": false
}
```

Support listing models:

```text
GET /api/tags
```

## LM Studio

Use OpenAI-compatible endpoint:

```text
POST /v1/chat/completions
```

## vLLM

Use OpenAI-compatible endpoint:

```text
POST /v1/chat/completions
```

## llama.cpp

Use OpenAI-compatible endpoint when available:

```text
POST /v1/chat/completions
```

## Gemini

Use Gemini-compatible generateContent endpoint.

## Anthropic

Use Anthropic messages endpoint.

---

# Prompt Construction for Real AI Calls

When calling the selected AI model, include:

- System prompt
- User message
- Recent conversation messages
- Relevant memory only when relevant
- Triggered skill instructions only when relevant
- Response style setting

System prompt:

```text
You are Hermes AI Agent, a professional autonomous assistant. Use relevant memories and enabled skills only when they genuinely improve the answer. Do not force memory or skills into casual messages. Do not claim to perform actions you cannot perform. Be clear, practical, and concise unless the user requests detail.
```

Memory injection example:

```text
Relevant user memory:
- User prefers production-ready apps over prototypes.
- User prefers Android apps using Kotlin and Jetpack Compose.
```

Skill injection example:

```text
Activated skills:
- Android App Builder: Help the user design, plan, and build Android apps with architecture, features, and implementation steps.
```

Do not inject memory or skills into simple greetings or casual messages.

---

# AI Response Metadata

For every assistant response, save metadata:

- Provider
- Model
- Online/local/demo mode
- Tokens if available
- Latency
- Used memory IDs
- Triggered skill IDs
- Streaming enabled
- Error status if failed
- Created date

Show metadata in the Chat context panel, not inside every assistant message.

---

# AI Error Handling

Add professional error states for:

- Missing API key
- Invalid API key
- Invalid base URL
- Invalid model ID
- Provider rate limit
- Network unavailable
- CORS issue
- Local server not running
- Model not installed
- Timeout
- Streaming failure
- Unsupported response format
- Download failed
- Not enough storage
- Browser storage limitation

Errors should be understandable and actionable.

Example:

```text
Hermes could not connect to Ollama at http://localhost:11434.

Check:
1. Ollama is installed.
2. Ollama is running.
3. The selected model is downloaded.
4. The endpoint URL is correct.
```

---

# Security Requirements

API keys must be handled carefully.

Requirements:

- Do not hardcode API keys.
- Do not expose keys in logs.
- Mask saved keys in the UI.
- Allow users to delete keys.
- Store keys locally only.
- Warn users that browser local storage is not the same as secure server-side secret storage.
- Export settings should exclude API keys by default.
- Add optional “include secrets” export only with confirmation.
- Add a clear privacy section in Settings.
- Do not send memory to online AI unless memory usage is enabled and relevant.

---

# Page 7: Settings

Create a Settings page with:

- Theme toggle
- Clear all local data
- Export data as JSON
- Import data from JSON
- Agent name setting
- Response style setting:
  - Concise
  - Balanced
  - Detailed
- Default memory usage toggle
- Default skill activation toggle
- Default AI provider
- Default model
- Streaming toggle
- Privacy and security section
- Clear all API keys
- Reset app to defaults

Export/import must work.

Export should exclude API keys by default.

---

# Data Models

Use clean TypeScript interfaces.

## Conversation

```ts
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
  tags: string[];
}
```

## Message

```ts
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  usedMemoryIds?: string[];
  triggeredSkillIds?: string[];
  metadata?: AIRequestMetadata;
}
```

## Memory

```ts
interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}
```

## Skill

```ts
interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerKeywords: string[];
  instructionPrompt: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}
```

## App Settings

```ts
interface AppSettings {
  agentName: string;
  responseStyle: "concise" | "balanced" | "detailed";
  useMemoryByDefault: boolean;
  activateSkillsByDefault: boolean;
  theme: "dark" | "light" | "system";
  streamingEnabled: boolean;
  activeProviderId?: string;
  activeModelId?: string;
}
```

## AI Provider Config

```ts
interface AIProviderConfig {
  id: string;
  name: string;
  type:
    | "openai-compatible"
    | "anthropic"
    | "gemini"
    | "custom-rest"
    | "local-openai-compatible";
  mode: "online" | "local";
  apiKey?: string;
  baseUrl: string;
  selectedModel: string;
  customModels: string[];
  enabled: boolean;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  status: "not_configured" | "connected" | "error" | "testing";
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## AI Model Preset

```ts
interface AIModelPreset {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  family: string;
  mode: "online" | "local";
  contextWindow?: number;
  recommended?: boolean;
  description?: string;
}
```

## Local Runtime Config

```ts
interface LocalRuntimeConfig {
  id: string;
  name: "Ollama" | "LM Studio" | "GPT4All" | "vLLM" | "llama.cpp" | "MLC LLM" | "Custom";
  endpoint: string;
  apiFormat: "openai-compatible" | "ollama-native" | "custom";
  installedModels: string[];
  selectedModel?: string;
  reachable: boolean;
  lastCheckedAt?: string;
}
```

## Downloadable Local Model

```ts
interface DownloadableLocalModel {
  id: string;
  name: string;
  family: string;
  modelId: string;
  format: "gguf" | "onnx" | "safetensors" | "mlc" | "other";
  parameterSize?: string;
  quantization?: string;
  estimatedSize?: string;
  downloadUrl?: string;
  compatibleRuntimes: string[];
  minimumRam?: string;
  offlineCapable: boolean;
  downloaded: boolean;
  localPath?: string;
  downloadedAt?: string;
}
```

## AI Request Metadata

```ts
interface AIRequestMetadata {
  providerId: string;
  providerName: string;
  model: string;
  mode: "online" | "local" | "demo";
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  usedMemoryIds: string[];
  triggeredSkillIds: string[];
  streaming: boolean;
  error?: string;
}
```

---

# Suggested File Structure

```text
src/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      MobileNav.tsx
    chat/
      ChatWindow.tsx
      MessageBubble.tsx
      ChatInput.tsx
      AgentContextPanel.tsx
      ChatErrorFallback.tsx
    memory/
      MemoryCard.tsx
      MemoryForm.tsx
    skills/
      SkillCard.tsx
      SkillForm.tsx
    ai/
      ProviderCard.tsx
      LocalRuntimeCard.tsx
      ModelCatalog.tsx
      ActiveModelPanel.tsx
      CustomModelForm.tsx
    common/
      EmptyState.tsx
      StatCard.tsx
      ConfirmDialog.tsx
      ErrorBoundary.tsx
  pages/
    Dashboard.tsx
    Chat.tsx
    Conversations.tsx
    Memory.tsx
    Skills.tsx
    AIModels.tsx
    Settings.tsx
  lib/
    ai/
      aiClient.ts
      providerRegistry.ts
      openAICompatibleClient.ts
      anthropicClient.ts
      geminiClient.ts
      customRestClient.ts
      localRuntimeClient.ts
      modelDownloader.ts
      promptBuilder.ts
      aiTypes.ts
      aiStorage.ts
    agentEngine.ts
    storage.ts
    migrations.ts
    seedData.ts
    utils.ts
  types/
    index.ts
  App.tsx
  main.tsx
```

---

# GitHub Actions Workflow

Add or update:

```text
.github/workflows/build.yml
```

Workflow must:

- Checkout repo
- Install Node
- Install dependencies
- Run TypeScript check
- Run lint if configured
- Build production web app
- Upload web build artifact
- If Capacitor Android is included:
  - Sync Capacitor
  - Build debug APK
  - Build release AAB where possible
  - Upload APK/AAB artifacts

The workflow should fail clearly when build errors occur.

---

# Android / Capacitor Requirements

Add Capacitor setup so the app can be packaged for Android.

Required:

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `capacitor.config.ts`
- Android project generated or ready to generate
- App ID: `com.hermes.aiagent`
- App name: `Hermes AI Agent`
- Web directory: `dist`
- Build command: `npm run build`
- Sync command: `npx cap sync android`

## Android Permissions

Use minimal permissions.

Required only if using online AI APIs:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Do not request storage permissions unless absolutely necessary.

For model import/download storage, prefer app-scoped storage or browser/Capacitor-safe file APIs.

---

# Google Play MVP Readiness

Prepare the app for Google Play internal testing.

Include:

- Production app name
- Package name
- Version name
- Version code
- Privacy-friendly API key handling
- No hardcoded secrets
- No copyrighted assets
- No unnecessary permissions
- App icon placeholder
- Splash screen placeholder
- Privacy policy content draft in Settings or docs
- Data safety notes:
  - API keys stored locally
  - Conversations stored locally by default
  - Memory stored locally by default
  - Online AI requests are sent only to configured providers
  - Local AI requests stay on local network/device
- Build `.aab` for Play upload
- Target Android 15 / API 35 or newer
- App must not crash on startup
- App must not show a blank screen on route errors

---

# Required QA and Manual Test Checklist

Implement and verify:

## Simple Chat Tests

Send:

```text
Hello
```

Expected:

```text
Hey, I’m here. How can I help you today?
```

Send:

```text
How are you?
```

Expected:

```text
I’m doing well and ready to help. What are we working on?
```

Send:

```text
Thanks
```

Expected:

```text
You’re welcome.
```

No memory/skill warning should appear.

## Memory and Skill Tests

Send:

```text
Help me build an Android notes app.
```

Expected:

- Android App Builder skill may trigger.
- Relevant Android/project memories may be used.
- Response should be structured and useful.

Send:

```text
Use my memory and create a plan for my current app.
```

Expected:

- Memory should be used.
- Planning/task skill may trigger.
- Response should mention relevant context.

## Older Chat Tests

1. Create a new chat.
2. Send several messages.
3. Go to Chats.
4. Open older chat.
5. Verify it loads without crashing.
6. Refresh the page.
7. Open older chat again.
8. Verify no blank screen.
9. Delete a chat.
10. Try opening the deleted chat route manually.
11. Verify fallback UI appears instead of crash.

## AI Model Tests

1. Open AI Models.
2. Add an online provider API key.
3. Save provider.
4. Test connection.
5. Select model.
6. Send chat message.
7. Confirm response comes from selected model.
8. Remove API key.
9. Confirm chat falls back to Demo Mode with clear label.

## Local AI Tests

1. Configure Ollama endpoint.
2. Test connection.
3. Fetch local models if supported.
4. Select local model.
5. Turn on Local Mode.
6. Send chat.
7. Confirm request goes only to local endpoint.
8. Stop local server.
9. Confirm clear error appears.

## Mobile UI Tests

Verify:

- No horizontal overflow.
- Bottom nav does not cover chat.
- Chat input is usable.
- Long messages wrap correctly.
- Model settings forms are usable on phone.
- Dialogs fit mobile screen.
- App works after refresh.

---

# Final Acceptance Criteria

The app is complete only when:

- Dashboard is functional and shows real data.
- Chat works naturally for greetings and casual messages.
- Chat does not force memory/skill templates into every reply.
- Memory is used only when relevant or explicitly requested.
- Skills trigger only when relevant.
- Conversations can be created, opened, renamed, pinned, archived, deleted, and restored from storage.
- Older chats open without crashing.
- Invalid chat routes show fallback UI instead of blank screen.
- LocalStorage/IndexedDB data is normalized and migration-safe.
- AI Models page is fully functional.
- Online AI providers can be configured with API keys.
- Custom provider endpoints can be configured.
- Active model selection controls Chat.
- Local AI runtimes can be configured and tested.
- Ollama, LM Studio, GPT4All, vLLM, llama.cpp, and MLC LLM are represented.
- Local AI mode does not require internet once the runtime and model are ready.
- Downloaded/imported local models are tracked.
- The app clearly explains local runtime requirements.
- The app does not fake offline AI execution.
- API keys are masked and stored locally only.
- Export excludes API keys by default.
- Settings persist correctly.
- Import/export works.
- Error boundaries prevent blank screens.
- Mobile layout is polished.
- GitHub Actions build works.
- Capacitor Android setup is included or ready.
- The app can generate a production web build.
- The app can be packaged for Android.
- The project is ready for Google Play internal testing.

---

# Important Final Instruction

Do not build this as a visual-only prototype.

Fix and implement the real app architecture, chat logic, routing logic, storage migration, AI provider logic, local AI setup, error handling, mobile UI, and Android packaging support.

The final MVP should feel like a real AI agent app that can be published, tested, and improved later with more advanced cloud sync, authentication, and real backend features.
