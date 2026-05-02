import { Memory, Skill, AppSettings } from '../types';

export type MessageIntent = "greeting" | "casual" | "question" | "task" | "coding" | "research" | "planning" | "debugging" | "memory_request" | "skill_request" | "model_configuration" | "unknown";

export function classifyMessageIntent(message: string): MessageIntent {
  const lower = message.toLowerCase().trim();
  
  if (/^(hi|hello|hey|good morning|good evening|how are you|what's up)/.test(lower)) return "greeting";
  if (/^(thanks|thank you|ok|okay|cool|nice|yes|no|continue|go ahead|got it|sure|great)$/.test(lower)) return "casual";
  
  if (lower.includes("crash") || lower.includes("error log") || lower.includes("stack trace") || lower.includes("not working") || lower.includes("blank screen") || lower.includes("failed")) return "debugging";
  
  if (lower.includes("code") || lower.includes("function") || lower.includes("bug") || lower.includes("error") || lower.includes("typescript") || lower.includes("javascript") || lower.includes("python") || lower.includes("class") || lower.includes("component")) return "coding";
  
  if (lower.includes("research") || lower.includes("investigate") || lower.includes("compare") || lower.includes("find information") || lower.includes("search")) return "research";
  
  if (lower.includes("plan") || lower.includes("checklist") || lower.includes("roadmap") || lower.includes("schedule") || lower.includes("milestones") || lower.includes("tasks")) return "planning";
  
  if (lower.includes("create") || lower.includes("make") || lower.includes("build") || lower.includes("write") || lower.includes("fix") || lower.includes("analyze") || lower.includes("generate") || lower.includes("help me")) return "task";
  
  if (lower.startsWith("what") || lower.startsWith("how") || lower.startsWith("why") || lower.startsWith("when") || lower.startsWith("where") || lower.includes("explain") || lower.includes("what can you do") || lower.includes("what is")) return "question";
  
  return "unknown";
}

export function shouldUseMemory(message: string, memories: Memory[]): boolean {
  const lower = message.toLowerCase().trim();
  const casualPatterns = ["hi", "hello", "hey", "how are you", "how are you?", "thanks", "thank you", "ok", "okay", "cool", "nice", "yes", "no", "got it", "sure", "great"];
  
  if (casualPatterns.includes(lower)) return false;
  if (message.length < 12) return false;
  
  const words = lower.split(/\s+/);
  for (const memory of memories) {
    if (!memory.active) continue;
    const memoryWords = memory.content.toLowerCase().split(/\s+/);
    let overlapCount = 0;
    for (const w of words) {
      if (w.length > 3 && memoryWords.includes(w)) overlapCount++;
    }
    const score = overlapCount / words.length;
    if (score >= 0.3) return true;
  }
  
  return false;
}

export function shouldTriggerSkill(message: string, skills: Skill[]): boolean {
  if (message.length < 15) return false;
  const intent = classifyMessageIntent(message);
  if (intent === "greeting" || intent === "casual") return false;
  
  const lower = message.toLowerCase();
  
  for (const skill of skills) {
    if (!skill.enabled) continue;
    for (const keyword of skill.triggerKeywords) {
      if (lower.includes(keyword.toLowerCase())) return true;
    }
  }
  
  return false;
}

export function generateDemoResponse(intent: MessageIntent, userMessage: string, relevantMemories: Memory[], triggeredSkills: Skill[], settings: AppSettings): string {
  if (intent === "greeting") return "Hey, I'm here. How can I help you today?";
  if (intent === "casual") return "Got it. Feel free to ask if you need anything else.";
  if (intent === "question" && userMessage.toLowerCase().includes("hermes")) return "I am Hermes AI Agent, a professional autonomous assistant designed for research, task planning, and coding help.";
  
  let response = "I'm running in Demo Mode, but if I were connected to a real provider, I would help you with this task.";
  
  if (triggeredSkills.length > 0) {
    response += `\n\nI would use the **${triggeredSkills.map(s => s.name).join(", ")}** skill(s) to process this request.`;
  }
  
  if (relevantMemories.length > 0) {
    response += `\n\nI noticed some relevant memories I'd use: ${relevantMemories.map(m => `"${m.title}"`).join(", ")}.`;
  }
  
  return response;
}
