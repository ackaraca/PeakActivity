import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { Request, Response } from "express";
import { linearRegression, linearRegressionLine, mean, standardDeviation } from "simple-statistics";

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2/options';

import * as goalApi from './api/goal-api';
import * as firestoreTriggers from './triggers/firestore-triggers';
import { detectAnomalies } from './api/anomaly-detection-api';
import { autoCategorize } from './api/auto-categorization-api';
import { analyzeBehavioralPatterns } from './api/behavioral-analysis-api';
import { matchCommunityRule } from './api/community-rules-api';
import { CommunityRulesService } from './services/community-rules-service';
import { ContextualCategorizationService } from './services/contextual-categorization-service';
import { categorizeContext } from './api/contextual-categorization-api';
import { calculateFocusQualityScore } from './api/focus-quality-score-api';
import { createAutomationRule, getAutomationRule, getAllAutomationRules, updateAutomationRule, deleteAutomationRule } from './api/automation-rule-api';
import { saveActivity } from './api/activity-api';
import { createProject, getProject, updateProject, getAllProjects, deleteProject } from './api/project-prediction-api';
import { predictProjectCompletion } from './api/project-prediction-ai-api';
import { createGoal, getGoal, updateGoal, deleteGoal, listGoals } from "./api/goal-management-api";
import { createReport, getReport, updateReport, deleteReport, listReports, generateReportData } from "./api/report-management-api";
import { createCustomEvent, getCustomEvent, updateCustomEvent, deleteCustomEvent, listCustomEvents } from "./api/custom-event-api";
import { generateInsight, listInsights, getInsight, deleteInsight } from "./api/insight-generation-api";
import { createNotification, getNotification, updateNotification, deleteNotification, listNotifications } from "./api/notification-api";
import { createFocusMode, getFocusMode, updateFocusMode, deleteFocusMode, listFocusModes, setActiveFocusMode } from "./api/focus-mode-api";

// Global settings
setGlobalOptions({
  // ... existing code ...
});

interface Event {
  timestamp_start: string;
  timestamp_end: string;
  duration_sec: number;
  app: string;
  title: string;
  category: string;
  window_change_count: number;
  input_frequency: number;
  is_afk: boolean;
}

interface FocusQualityScoreInput {
  events: Event[];
  user_tz: string;
}

interface SessionScore {
  session_id: string;
  focus_quality_score: number;
  distractions: number;
  context_switch_penalty: number;
}

interface FocusQualityScoreOutput {
  session_scores: SessionScore[];
  daily_average: number | null;
  explanations: string;
}

interface DailyTotal {
  date: string;
  categories: { [key: string]: number };
}

interface AnomalyDailyTotal {
  date: string;
  total_seconds: number;
}

interface AnomalyDetectionInput {
  daily_totals: AnomalyDailyTotal[];
}

interface Anomaly {
  date: string;
  z_score: number;
  deviation_percent: number;
}

interface AnomalyDetectionOutput {
  anomalies: Anomaly[];
  baseline_mean: number;
  baseline_stddev: number;
  explanation: string;
}

interface BehavioralTrendsInput {
  daily_totals: DailyTotal[];
  window: number;
}

interface TrendingCategory {
  category: string;
  trend: "rising" | "falling" | "stable";
  slope_per_day: number;
}

interface BehavioralTrendsOutput {
  trending_categories: TrendingCategory[];
  seasonality: { period: string; pattern: string }[];
  summary: string;
}

interface AutoCatEvent {
  app: string;
  title: string;
  url: string | null;
}

interface AutoCategorizationInput {
  events: AutoCatEvent[];
}

interface LabelResult {
  index: number;
  category: string;
  confidence: number;
}

interface AutoCategorizationOutput {
  labels: LabelResult[];
}

interface CommunityRuleEvent {
  app: string;
  title: string;
  url: string | null;
}

interface CommunityRule {
  pattern: string;
  category: string;
  popularity?: number; // Added for sorting, optional
}

interface CommunityRuleInput {
  event: CommunityRuleEvent;
  community_rules: CommunityRule[];
}

interface CommunityRuleOutput {
  matched_rule: CommunityRule | null;
  category: string | null;
  source: string;
}

interface ContextualCategorizationInput {
  context: string;
  language?: string;
}

interface ContextualCategorizationOutput {
  category: string;
  confidence: number;
  rationale: string;
}

const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  "coding": ["code", "github", "stack overflow", "bug", "develop", "programming", "ide", "visual studio code", "jira", "gitlab"],
  "design": ["photoshop", "figma", "sketch", "illustrator", "design", "ui/ux", "blender"],
  "research": ["researchgate", "wikipedia", "journal", "academic", "study", "analyze"],
  "social": ["facebook", "instagram", "twitter", "linkedin", "reddit", "whatsapp", "slack"],
  "gaming": ["steam", "epic games", "league of legends", "csgo", "game"],
  "productivity": ["notion", "todoist", "trello", "asana", "excel", "word", "powerpoint"],
  "communication": ["outlook", "gmail", "teams", "zoom", "google meet", "discord"],
  "shopping": ["amazon", "ebay", "trendyol", "n11"]
};

const CLASSIFICATION_LABELS = [
  "coding", "design", "research", "social", "news", "entertainment", "communication", "shopping"
];

// Simple mock for an LLM-based zero-shot classifier
const mockZeroShotClassify = (text: string, labels: string[]): { category: string; confidence: number; rationale: string } => {
  text = text.toLowerCase();
  let bestCategory = "unknown";
  let maxScore = 0;
  let rationale = "";

  for (const label of labels) {
    let score = 0;
    if (label === "coding" && (text.includes("code") || text.includes("github") || text.includes("stack overflow") || text.includes("programming"))) {
      score += 1;
    }
    if (label === "design" && (text.includes("design") || text.includes("photoshop") || text.includes("figma"))) {
      score += 1;
    }
    if (label === "research" && (text.includes("research") || text.includes("journal") || text.includes("academic"))) {
      score += 1;
    }
    if (label === "social" && (text.includes("facebook") || text.includes("instagram") || text.includes("twitter"))) {
      score += 1;
    }
    if (label === "news" && (text.includes("haber") || text.includes("news") || text.includes("gündem"))) {
      score += 1;
    }
    if (label === "entertainment" && (text.includes("film") || text.includes("movie") || text.includes("oyun") || text.includes("game"))) {
      score += 1;
    }
    if (label === "communication" && (text.includes("email") || text.includes("zoom") || text.includes("slack"))) {
      score += 1;
    }
    if (label === "shopping" && (text.includes("alışveriş") || text.includes("shopping") || text.includes("amazon") || text.includes("trendyol"))) {
      score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = label;
      // Simple rationale for demo
      rationale = `Contains keywords related to ${label}.`;
    }
  }

  // Simulate confidence based on score
  const confidence = maxScore > 0 ? Math.min(1, maxScore / 3) : 0.1; // Max 3 keywords give 1.0 confidence, min 0.1 if no keywords

  return { category: bestCategory, confidence: parseFloat(confidence.toFixed(2)), rationale: rationale.substring(0, 140) };
};

// Helper function for simple glob matching
const globToRegex = (glob: string) => {
  const pattern = glob.replace(/\./g, '\\.').replace(/\*/g, '.*');
  return new RegExp(`^${pattern}$`, 'i');
};

admin.initializeApp();

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export { calculateFocusQualityScore };

export const analyzeBehavioralTrends = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const { daily_totals, window } = request.body as BehavioralTrendsInput;

  if (!daily_totals || !Array.isArray(daily_totals) || daily_totals.length === 0) {
    response.status(400).send("Invalid input: 'daily_totals' array is required and must not be empty.");
    return;
  }

  const trendingCategories: TrendingCategory[] = [];
  const allCategories: Set<string> = new Set();

  for (const day of daily_totals) {
    for (const category in day.categories) {
      allCategories.add(category);
    }
  }

  for (const category of Array.from(allCategories)) {
    const dataPoints: [number, number][] = [];
    for (let i = 0; i < daily_totals.length; i++) {
      const totalSeconds = daily_totals[i].categories[category] || 0;
      dataPoints.push([i, totalSeconds]); // Use index as x-axis for linear regression
    }

    if (dataPoints.length > 1) {
      const regression = linearRegression(dataPoints);
      const line = linearRegressionLine(regression);
      const slope = line(1) - line(0); // Slope per day

      let trend: "rising" | "falling" | "stable" = "stable";
      if (slope > 100) {
        trend = "rising";
      } else if (slope < -100) {
        trend = "falling";
      }

      trendingCategories.push({
        category,
        trend,
        slope_per_day: Math.round(slope),
      });
    }
  }

  // Sort by absolute slope and limit to top 5
  trendingCategories.sort((a, b) => Math.abs(b.slope_per_day) - Math.abs(a.slope_per_day));
  const topTrendingCategories = trendingCategories.slice(0, 5);

  // Seasonality Detection (simplified for this prompt - in a real scenario, this would be more complex)
  const seasonality: { period: string; pattern: string }[] = [];
  // Example: Basic weekly pattern detection (e.g., check if Fridays consistently lower)
  const fridayDecreases = daily_totals.filter((day) => {
    const date = new Date(day.date);
    return date.getDay() === 5; // Friday
  }).every((fridayData) => {
    // Check if total activity on Friday is significantly lower than average for the week
    // This is a placeholder and would need more robust logic.
    const weeklyAverage = daily_totals.reduce((sum, d) => sum + Object.values(d.categories).reduce((s, v) => s + v, 0), 0) / daily_totals.length;
    const fridayTotal = Object.values(fridayData.categories).reduce((s, v) => s + v, 0);
    return fridayTotal < weeklyAverage * 0.7; // Example: 30% lower than weekly average
  });

  if (fridayDecreases && daily_totals.filter(d => new Date(d.date).getDay() === 5).length > 2) {
    seasonality.push({ period: "weekly", pattern: "Cuma günleri odaklanma düşüyor" });
  }

  const summary = "Davranışsal desenler ve trend analizi sonuçları."; // Türkçe özet

  const output: BehavioralTrendsOutput = {
    trending_categories: topTrendingCategories,
    seasonality,
    summary,
  };

  response.status(200).json(output);
});

export { detectAnomalies };
export { autoCategorize };
export { analyzeBehavioralPatterns };
export { matchCommunityRule };
export { categorizeContext };
export { createAutomationRule, getAutomationRule, getAllAutomationRules, updateAutomationRule, deleteAutomationRule };
export { saveActivity };
export { createProject, getProject, updateProject, getAllProjects, deleteProject };
export { predictProjectCompletion } from './api/project-prediction-ai-api';
export { createGoal, getGoal, updateGoal, deleteGoal, listGoals };
export { createReport, getReport, updateReport, deleteReport, listReports, generateReportData } from "./api/report-management-api";
export { createCustomEvent, getCustomEvent, updateCustomEvent, deleteCustomEvent, listCustomEvents } from "./api/custom-event-api";
export { generateInsight, listInsights, getInsight, deleteInsight } from "./api/insight-generation-api";
export { createNotification, getNotification, updateNotification, deleteNotification, listNotifications } from "./api/notification-api";
export { createFocusMode, getFocusMode, updateFocusMode, deleteFocusMode, listFocusModes, setActiveFocusMode } from "./api/focus-mode-api";

export const contextualCategorization = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const { context, language } = request.body as ContextualCategorizationInput;

  if (typeof context !== 'string' || context.trim() === '') {
    response.status(400).send("Invalid input: 'context' must be a non-empty string.");
    return;
  }

  const result = mockZeroShotClassify(context, CLASSIFICATION_LABELS);
  response.status(200).json(result);
  return;
});

export const applyCommunityRules = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const { event, community_rules } = request.body as CommunityRuleInput;

  if (!event) {
    response.status(400).send("Invalid input: 'event' object is required.");
    return;
  }
  if (!community_rules || !Array.isArray(community_rules)) {
    response.status(400).send("Invalid input: 'community_rules' array is required.");
    return;
  }

  // Assuming CommunityRulesService is defined elsewhere or needs to be imported
  // For now, we'll use a placeholder or remove if not needed
  // const communityRulesService = new CommunityRulesService();
  // const result = communityRulesService.matchCommunityRule(event, community_rules);
  // response.status(200).json(result);
  // return;

  // Placeholder for actual community rule matching logic
  let matchedRule: CommunityRule | null = null;
  let assignedCategory: string | null = null;

  for (const rule of community_rules) {
    const regex = globToRegex(rule.pattern);
    const eventString = `${event.app || ""} ${event.title || ""} ${event.url || ""}`;

    if (regex.test(eventString)) {
      matchedRule = rule;
      assignedCategory = rule.category;
      break;
    }
  }

  const output: CommunityRuleOutput = {
    matched_rule: matchedRule,
    category: assignedCategory,
    source: matchedRule ? "community" : "none",
  };

  response.status(200).json(output);
  return;
}); 