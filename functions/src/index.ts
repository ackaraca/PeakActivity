import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { Request, Response } from "express";
import { linearRegression, linearRegressionLine, mean, standardDeviation } from "simple-statistics";

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

export const calculateFocusQualityScore = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { events, user_tz } = request.body as FocusQualityScoreInput;

  if (!events || !Array.isArray(events)) {
    return response.status(400).send("Invalid input: 'events' array is required.");
  }

  const sessionScores: SessionScore[] = [];
  let totalScore = 0;
  let validSessionsCount = 0;

  for (const event of events) {
    if (event.is_afk || event.duration_sec < 300) { // Non-AFK time >= 5 min
      continue;
    }

    let score = 100;
    let distractions = 0;
    let contextSwitchPenalty = 0;

    // -1 point per context switch (window/app change) after the first.
    if (event.window_change_count > 1) {
      contextSwitchPenalty = (event.window_change_count - 1);
      score -= contextSwitchPenalty;
    }

    // -0.5 point per minute where input_frequency < 0.1 (passive consumption).
    if (event.input_frequency < 0.1) {
      const passiveConsumptionPenalty = (event.duration_sec / 60) * 0.5;
      score -= passiveConsumptionPenalty;
      distractions += Math.floor(passiveConsumptionPenalty); // Approximate distractions
    }

    // -10 points if any social-media category app is used in the session.
    if (event.category === "social") {
      score -= 10;
      distractions += 1;
    }

    // +5 points for sessions between 09:00-12:00 local time, -5 for sessions between 00:00-06:00.
    try {
      const startTime = new Date(event.timestamp_start);
      // Adjust for user's timezone if necessary (this might require a more robust timezone library like moment-timezone)
      // For simplicity, directly using UTC for now.
      const localHour = startTime.getHours(); // This will be UTC hour, needs proper timezone handling
      if (localHour >= 9 && localHour < 12) {
        score += 5;
      } else if (localHour >= 0 && localHour < 6) {
        score -= 5;
      }
    } catch (e) {
      functions.logger.error("Failed to parse timestamp for timezone adjustment", e);
    }

    // Clamp scores to the range 0-100.
    score = Math.max(0, Math.min(100, score));

    sessionScores.push({
      session_id: `${event.timestamp_start}-${event.timestamp_end}`,
      focus_quality_score: Math.round(score),
      distractions: Math.round(distractions),
      context_switch_penalty: Math.round(contextSwitchPenalty),
    });

    totalScore += score;
    validSessionsCount++;
  }

  const dailyAverage = validSessionsCount > 0 ? totalScore / validSessionsCount : null;

  const output: FocusQualityScoreOutput = {
    session_scores: sessionScores,
    daily_average: dailyAverage !== null ? Math.round(dailyAverage) : null,
    explanations: "Detaylı açıklama ve ana faktörler buraya gelecek.",
  };

  return response.status(200).json(output);
});

export const analyzeBehavioralTrends = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { daily_totals, window } = request.body as BehavioralTrendsInput;

  if (!daily_totals || !Array.isArray(daily_totals) || daily_totals.length === 0) {
    return response.status(400).send("Invalid input: 'daily_totals' array is required and must not be empty.");
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

  return response.status(200).json(output);
});

export const detectAnomalies = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { daily_totals } = request.body as AnomalyDetectionInput;

  if (!daily_totals || !Array.isArray(daily_totals) || daily_totals.length < 2) {
    return response.status(400).send("Invalid input: 'daily_totals' array is required and must contain at least 2 entries.");
  }

  const totals = daily_totals.map(d => d.total_seconds);

  const baselineMean = mean(totals);
  const baselineStdDev = standardDeviation(totals);

  const anomalies: Anomaly[] = [];

  for (const day of daily_totals) {
    const zScore = (day.total_seconds - baselineMean) / baselineStdDev;

    if (Math.abs(zScore) >= 2) {
      const deviationPercent = ((day.total_seconds - baselineMean) / baselineMean) * 100;
      anomalies.push({
        date: day.date,
        z_score: parseFloat(zScore.toFixed(2)),
        deviation_percent: parseFloat(deviationPercent.toFixed(2)),
      });
    }
  }

  // Sort anomalies by absolute z-score, limit to top 10.
  anomalies.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
  const topAnomalies = anomalies.slice(0, 10);

  const explanation = "Günlük aktivite sürelerindeki önemli sapmalar belirlenmiştir."; // Türkçe açıklama

  const output: AnomalyDetectionOutput = {
    anomalies: topAnomalies,
    baseline_mean: parseFloat(baselineMean.toFixed(2)),
    baseline_stddev: parseFloat(baselineStdDev.toFixed(2)),
    explanation,
  };

  return response.status(200).json(output);
});

export const autoCategorize = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { events } = request.body as AutoCategorizationInput;

  if (!events || !Array.isArray(events)) {
    return response.status(400).send("Invalid input: 'events' array is required.");
  }

  const labels: LabelResult[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const textToAnalyze = `${event.title || ""} ${event.app || ""} ${event.url ? new URL(event.url).hostname : ""}`.toLowerCase();
    
    let bestCategory = "unknown";
    let maxConfidence = 0;

    for (const category in CATEGORY_KEYWORDS) {
      let score = 0;
      for (const keyword of CATEGORY_KEYWORDS[category]) {
        if (textToAnalyze.includes(keyword)) {
          score += 1;
        }
      }
      // Simple confidence based on keyword matches (can be improved with TF-IDF, ML models)
      const confidence = score / CATEGORY_KEYWORDS[category].length;
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestCategory = category;
      }
    }

    labels.push({
      index: i,
      category: bestCategory,
      confidence: parseFloat(maxConfidence.toFixed(2)),
    });
  }

  const output: AutoCategorizationOutput = {
    labels,
  };

  return response.status(200).json(output);
}); 

export const contextualCategorization = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { context, language } = request.body as ContextualCategorizationInput;

  if (!context) {
    return response.status(400).send("Invalid input: 'context' is required.");
  }

  // In a real scenario, use a language detection library and translation if needed
  // For this mock, we assume English or handle simple cases
  let processedContext = context;
  // if (language && language !== 'en') { /* translate processedContext */ }

  const result = mockZeroShotClassify(processedContext, CLASSIFICATION_LABELS);

  const output: ContextualCategorizationOutput = {
    category: result.category,
    confidence: result.confidence,
    rationale: result.rationale,
  };

  return response.status(200).json(output);
});

export const applyCommunityRules = functions.https.onRequest(async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const { event, community_rules } = request.body as CommunityRuleInput;

  if (!event || !community_rules || !Array.isArray(community_rules)) {
    return response.status(400).send("Invalid input: 'event' and 'community_rules' are required.");
  }

  // Sort rules by popularity (descending), if popularity is present
  community_rules.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

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

  return response.status(200).json(output);
}); 