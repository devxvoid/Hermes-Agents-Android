import { Memory, Skill } from '../types';

export const defaultMemories: Memory[] = [
  {
    id: crypto.randomUUID(),
    title: "Production App Preference",
    content: "User prefers production-ready apps over prototypes",
    category: "Personal preference",
    tags: ["apps", "quality"],
    active: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Markdown Preference",
    content: "User prefers clean Markdown prompts and structured responses",
    category: "Personal preference",
    tags: ["markdown", "formatting"],
    active: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Android Development",
    content: "User prefers Android development using Kotlin and Jetpack Compose",
    category: "Coding",
    tags: ["android", "kotlin", "compose"],
    active: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Workflow Preference",
    content: "User values mobile-first workflows and GitHub Actions automation",
    category: "Workflow",
    tags: ["mobile", "github", "ci"],
    active: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultSkills: Skill[] = [
  {
    id: crypto.randomUUID(),
    name: "Research Assistant",
    description: "Investigates topics, compares options, produces structured findings",
    category: "Research",
    triggerKeywords: ["research", "investigate", "compare", "find information"],
    instructionPrompt: "Perform thorough research. Compare different aspects and present structured findings.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Android App Builder",
    description: "Plans and builds Android apps with architecture and implementation steps",
    category: "Android Development",
    triggerKeywords: ["android", "kotlin", "compose", "apk", "aab", "mobile app", "play store"],
    instructionPrompt: "Act as an expert Android developer using Kotlin and Jetpack Compose. Outline architecture and provide code snippets.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Code Reviewer",
    description: "Reviews code, identifies bugs, suggests improvements",
    category: "Coding",
    triggerKeywords: ["code", "bug", "error", "fix", "review"],
    instructionPrompt: "Review the provided code carefully. Identify bugs, security issues, and suggest concise improvements.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Debugging Specialist",
    description: "Analyzes crash logs, runtime errors, build logs, broken behavior",
    category: "Debugging",
    triggerKeywords: ["crash", "runtime error", "stack trace", "blank screen", "not working", "failed"],
    instructionPrompt: "Analyze the stack trace or error description. Provide a step-by-step debugging plan and the most likely solution.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Task Planner",
    description: "Breaks large goals into clear steps, milestones, checklists",
    category: "Task Planning",
    triggerKeywords: ["plan", "checklist", "roadmap", "tasks", "schedule"],
    instructionPrompt: "Break down the requested goal into actionable, clear steps. Create a timeline, milestones, and a final checklist.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Memory Analyst",
    description: "Uses stored memory to personalize answers and connect past context",
    category: "General",
    triggerKeywords: ["memory", "remember", "preferences", "context"],
    instructionPrompt: "Focus closely on the user's stored preferences and past context when formulating your response.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Writing Assistant",
    description: "Improves prompts, documents, descriptions, professional writing",
    category: "Writing",
    triggerKeywords: ["rewrite", "prompt", "markdown", "description", "improve"],
    instructionPrompt: "Refine and elevate the writing. Ensure clarity, professional tone, and excellent markdown formatting if applicable.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "AI Model Setup Assistant",
    description: "Configures online AI providers, custom APIs, and local AI runtimes",
    category: "AI Model Setup",
    triggerKeywords: ["model", "api key", "ollama", "lm studio", "local ai", "offline ai", "openrouter", "gemini", "anthropic"],
    instructionPrompt: "Assist the user in configuring AI providers, explaining endpoint URLs, API keys, or setting up local runtimes.",
    enabled: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
