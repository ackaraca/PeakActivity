import * as functions from "firebase-functions";
import { admin, db, auth } from "./firebaseAdmin";

import { Request, Response } from "express";
import { linearRegression, linearRegressionLine, mean, standardDeviation } from "simple-statistics";

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2/options';

import * as goalApi from './api/goal-api';
import * as firestoreTriggers from './triggers/firestore-triggers';
import { firestoreDailyBackup } from './triggers/backup-triggers';
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
import { getGoogleCalendarEvents, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, listGoogleCalendars } from "./api/google-calendar-api";
import { createAutomaticCalendarEvents } from "./api/automatic-event-api";
import { getTrelloTaskStatus, getJiraTaskStatus } from "./api/trello-jira-api";
import { updateTrelloTaskStatus, updateJiraTaskStatus } from "./api/trello-jira-api";
import { getTrelloProjectProgress, getJiraProjectProgress } from "./api/trello-jira-api";
import { prepareMLTrainingData } from "./api/ml-data-api";
import { predictTaskCompletion } from "./api/task-completion-prediction-api";
import { trelloJiraWebhookHandler } from "./api/trello-jira-webhook-api";
import { generateAIInsights } from "./api/ai-insight-api";
import { createNotification, getNotification, updateNotification, deleteNotification, listNotifications } from "./api/notification-api";
import { createFocusMode, getFocusMode, updateFocusMode, deleteFocusMode, listFocusModes, setActiveFocusMode } from "./api/focus-mode-api";
import { CalendarSyncService } from './services/calendar-sync-service';

// Global settings for all functions in this file
setGlobalOptions({
  region: "us-central1", // Fonksiyonların dağıtılacağı bölge
  timeoutSeconds: 60, // Varsayılan zaman aşımı süresi
  memory: "256MiB", // Varsayılan bellek boyutu
  concurrency: 50, // Bir instance tarafından aynı anda işlenebilecek istek sayısı
  minInstances: 0, // Soğuk başlangıçları azaltmak için minimum instance sayısı
});

// Fonksiyon çağrısı optimizasyonu: İstemci tarafında gereksiz çağrıları en aza indirin ve fonksiyon içinde erken çıkışlar/veri filtreleme kullanın.

// Firebase Machine Learning (ML) Entegrasyonu için potansiyel entegrasyon noktaları:
// Özel ML modellerinin dağıtımı ve kullanımı genellikle Firebase ML SDK'ları aracılığıyla yapılır.
// Fonksiyonlar, model çıkarımını (inference) tetiklemek veya model çıktılarını işlemek için kullanılabilir.
// Örnek: Kullanıcı davranışı tahmini için bir Cloud Function, eğitilmiş bir ML modelini çağırabilir.
// Örnek: Cihaz içi ML Kit yetenekleri (metin tanıma, görüntü işleme) doğrudan istemci uygulamalarında (Tauri/Mobil) entegre edilebilir.

// Üretken Yapay Zeka ile Akıllı Öneriler için potansiyel entegrasyon noktaları:
// Cloud Functions, Google'ın Gemini API veya Vertex AI gibi üretken AI hizmetleriyle etkileşime girmek için bir aracı görevi görebilir.
// Örnek: Kullanıcının aktivite verilerine dayanarak e-posta veya rapor taslakları oluşturma.
// Örnek: Sık sorulan sorulara dinamik yanıtlar veya bağlama duyarlı tavsiyeler sunma.

// Doğal Dil İşleme (NLP) Yetenekleri için potansiyel entegrasyon noktaları:
// Cloud Functions, metin analizi (duygu, konu, varlık tanıma) veya sohbet botu entegrasyonu için harici NLP API'leri ile etkileşime girebilir.
// Örnek: Kullanıcı geri bildirimlerinin duygu analizi veya aktivite açıklamalarından konu tespiti.
// Örnek: Kullanıcı sorularını yanıtlayan veya görev tamamlamaya yardımcı olan bir sohbet botu entegrasyonu.

// Zaman Serisi Analizi ve Tahminleme için potansiyel entegrasyon noktaları:
// Cloud Functions, zaman serisi verilerini işlemek ve tahmin modellerini (LSTM, Transformer vb.) çalıştırmak için kullanılabilir.
// Örnek: Gelecekteki aktivite desenlerini veya odaklanma seviyelerini tahmin etme.
// Örnek: Aktivite verilerindeki ani düşüşler veya artışlar gibi anomali ve değişim noktalarını tespit etme.

// Harici Servis Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, Google Calendar, Trello, Jira gibi harici takvim ve görev yönetimi araçlarıyla entegrasyon için kullanılabilir.
// Örnek: Kullanıcının Google Takvim etkinliklerini senkronize etme, boş zamanlarını tespit etme veya otomatik etkinlikler oluşturma.
// Örnek: Trello/Jira'daki görev durumlarını senkronize etme, proje ilerlemesini takip etme veya görev tamamlama tahminleri yapma.

// İletişim Araçları Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, Slack, Microsoft Teams veya e-posta servisleri gibi harici iletişim araçlarıyla entegrasyon için kullanılabilir.
// Örnek: Slack/Teams'e bildirim gönderme, mesajlaşma analizi yapma veya sanal toplantı katılımını izleme.
// Örnek: Gelen kutusu analizi yapma, önemli e-postaları vurgulama veya e-posta yazma asistanı sağlama.

// Sağlık ve Zindelik Uygulamaları Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, uyku takip cihazları (örn. Fitbit, Oura) veya meditasyon uygulamaları gibi harici sağlık ve zindelik uygulamalarıyla entegrasyon için kullanılabilir.
// Örnek: Uyku kalitesi verilerini senkronize etme, enerji seviyeleriyle korelasyon kurma veya uyku düzeni önerileri sunma.
// Örnek: Meditasyon süresi takibi, zihinsel durumla korelasyon veya stres seviyesi analizi yapma.

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

const calendarSyncService = new CalendarSyncService();

// Zamanlanmış Fonksiyonlar
export const syncGoogleCalendars = onSchedule('every 24 hours', async (event) => {
  console.log('Google Takvim senkronizasyonu başlatılıyor...');
  await calendarSyncService.syncAllUsersCalendars();
  console.log('Google Takvim senkronizasyonu tamamlandı.');
});

// HTTP Fonksiyonları (API Endpoints)

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

  // Helper function to get day name
  const getDayName = (dayIndex: number) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[dayIndex];
  };

  // Seasonality Detection: Daha sağlam bir günlük/haftalık desen tespiti
  const seasonality: { period: string; pattern: string }[] = [];

  if (daily_totals.length > 7) { // Yeterli veri varsa haftalık desenleri ara
    const dailySums: { [key: number]: number[] } = {}; // Günün haftası (0=Pazar, 6=Cumartesi) bazında toplam süreler
    for (const day of daily_totals) {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
      const totalSecondsForDay = Object.values(day.categories).reduce((sum, v) => sum + v, 0);
      if (!dailySums[dayOfWeek]) {
        dailySums[dayOfWeek] = [];
      }
      dailySums[dayOfWeek].push(totalSecondsForDay);
    }

    // Haftalık ortalama aktivite süresi
    const weeklyTotalAverage = daily_totals.reduce((sum, d) => sum + Object.values(d.categories).reduce((s, v) => s + v, 0), 0) / daily_totals.length;

    for (const dayOfWeek in dailySums) {
      const dayAverages = dailySums[dayOfWeek].length > 0 ? mean(dailySums[dayOfWeek]) : 0;
      const dayStdDev = dailySums[dayOfWeek].length > 1 ? standardDeviation(dailySums[dayOfWeek]) : 0;

      // Belirgin sapmaları tespit et
      const deviationFactor = 0.3; // %30 sapma eşiği
      if (dayAverages > weeklyTotalAverage * (1 + deviationFactor) && dayStdDev > 0) {
        seasonality.push({ period: "weekly", pattern: `${getDayName(parseInt(dayOfWeek))} günleri ortalamanın üzerinde aktivite` });
      } else if (dayAverages < weeklyTotalAverage * (1 - deviationFactor) && dayStdDev > 0) {
        seasonality.push({ period: "weekly", pattern: `${getDayName(parseInt(dayOfWeek))} günleri ortalamanın altında aktivite` });
      }
    }
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
export { predictTaskCompletion } from './api/task-completion-prediction-api';
export { createGoal, getGoal, updateGoal, deleteGoal, listGoals };
export { createReport, getReport, updateReport, deleteReport, listReports, generateReportData } from "./api/report-management-api";
export { createCustomEvent, getCustomEvent, updateCustomEvent, deleteCustomEvent, listCustomEvents } from "./api/custom-event-api";
export { generateInsight, listInsights, getInsight, deleteInsight } from "./api/insight-generation-api";
export { getGoogleCalendarEvents, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, listGoogleCalendars } from "./api/google-calendar-api";
export { createAutomaticCalendarEvents } from "./api/automatic-event-api";
export { firestoreDailyBackup } from './triggers/backup-triggers';
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

  const communityRulesService = new CommunityRulesService(); // CommunityRulesService örneği oluştur
  const result = communityRulesService.matchCommunityRule(event, community_rules);
  response.status(200).json(result);
  return;

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