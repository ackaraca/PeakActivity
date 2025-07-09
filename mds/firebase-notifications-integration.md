# ActivityWatch Notifications Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 04:45:00  
**Modül:** aw-notify Firebase Integration  
**Amaç:** aw-notify modülünün Firebase ile tam entegrasyonu

## 1. Mevcut aw-notify Analizi

### 1.1 Temel Özellikler
```python
# Mevcut ana özellikler
- Kategori bazlı zaman takibi
- Threshold-based alerts (15min, 30min, 1h, 2h, 4h, 6h, 8h)
- Günlük/saatlik check-in bildirimleri
- Server durumu monitoring
- Cache sistemi (TTL-based in-memory)
- macOS/Windows/Linux desktop notifications
```

### 1.2 Mevcut Veri Akışı
```python
# aw-notify/aw_notify/main.py - get_time() fonksiyonu
canonicalQuery = aw_client.queries.canonicalEvents(
    aw_client.queries.DesktopQueryParams(
        bid_window=f"aw-watcher-window_{hostname}",
        bid_afk=f"aw-watcher-afk_{hostname}",
    )
)
query = f"""
{canonicalQuery}
duration = sum_durations(events);
cat_events = sort_by_duration(merge_events_by_keys(events, ["$category"]));
RETURN = {{"events": events, "duration": duration, "cat_events": cat_events}};
"""
```

### 1.3 CategoryAlert Sınıfı
```python
class CategoryAlert:
    def __init__(self, category: str, thresholds: list[timedelta], label: str, positive=False):
        self.category = category
        self.thresholds = thresholds
        self.max_triggered = timedelta()
        self.time_spent = timedelta()
        self.positive = positive
```

## 2. Firebase Veri Modeli

### 2.1 Notification Collections
```typescript
// Firestore Collections Structure
/users/{userId}/notification_preferences
  - categories: CategoryConfig[]
  - general_settings: NotificationSettings
  - device_tokens: string[]          // FCM tokens
  - timezone: string
  - created_at: timestamp
  - updated_at: timestamp

/users/{userId}/notification_history/{notificationId}
  - type: string                     // "threshold", "checkin", "goal"
  - category: string
  - threshold_reached: number        // seconds
  - time_spent: number              // seconds
  - message: string
  - sent_at: timestamp
  - device_id: string
  - acknowledged: boolean

/users/{userId}/category_stats/{date}
  - date: string                    // "2025-01-21"
  - categories: CategoryStats[]
  - last_updated: timestamp
  - device_id: string

/global/notification_templates
  - threshold_reached: MessageTemplate
  - goal_achieved: MessageTemplate
  - daily_checkin: MessageTemplate
  - weekly_summary: MessageTemplate
```

### 2.2 TypeScript Interfaces
```typescript
interface CategoryConfig {
  name: string;                     // "Work", "Twitter", "Youtube", etc.
  label: string;                    // Display name with emoji
  thresholds: number[];             // [900, 1800, 3600, 7200] seconds
  positive: boolean;                // Goal vs limit
  enabled: boolean;
  color?: string;                   // For UI
  icon?: string;                    // Emoji or icon name
}

interface NotificationSettings {
  enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;                  // "22:00"
    end: string;                    // "08:00"
  };
  daily_checkin: {
    enabled: boolean;
    time: string;                   // "17:00"
  };
  hourly_checkin: {
    enabled: boolean;
    only_when_active: boolean;
  };
  new_day_notification: boolean;
  server_status_alerts: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

interface CategoryStats {
  name: string;
  time_spent: number;               // seconds
  max_triggered: number;            // highest threshold reached today
  last_triggered: timestamp;
  sessions: ActivitySession[];
}

interface ActivitySession {
  start: timestamp;
  end: timestamp;
  duration: number;                 // seconds
  events_count: number;
}

interface MessageTemplate {
  title: string;
  body: string;
  variables: string[];              // ["category", "time", "threshold"]
  localization: Record<string, {title: string, body: string}>;
}
```

## 3. Firebase Client Integration

### 3.1 Firebase Configuration
```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Firebase project configuration
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const auth = getAuth(app);
```

### 3.2 Firebase Client Class
```typescript
// firebase-notify-client.ts
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { onMessage, getToken } from 'firebase/messaging';

class FirebaseNotifyClient {
  private userId: string;
  private deviceId: string;
  private unsubscribers: (() => void)[] = [];

  constructor(userId: string, deviceId: string) {
    this.userId = userId;
    this.deviceId = deviceId;
  }

  async initialize(): Promise<void> {
    await this.setupFCM();
    this.startRealTimeListeners();
  }

  async setupFCM(): Promise<void> {
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.FIREBASE_VAPID_KEY
      });
      
      if (token) {
        await this.updateDeviceToken(token);
      }
    } catch (error) {
      console.error('FCM setup failed:', error);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      this.handleForegroundMessage(payload);
    });
  }

  async updateDeviceToken(token: string): Promise<void> {
    const userRef = doc(db, `users/${this.userId}/notification_preferences/main`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const tokens = data.device_tokens || [];
      
      if (!tokens.includes(token)) {
        await updateDoc(userRef, {
          device_tokens: [...tokens, token],
          updated_at: Timestamp.now()
        });
      }
    }
  }

  startRealTimeListeners(): void {
    // Listen to category stats changes
    const statsQuery = query(
      collection(db, `users/${this.userId}/category_stats`),
      where('date', '==', this.getTodayDateKey()),
      orderBy('last_updated', 'desc')
    );

    const unsubStats = onSnapshot(statsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          this.handleCategoryStatsUpdate(change.doc.data());
        }
      });
    });

    this.unsubscribers.push(unsubStats);

    // Listen to notification preferences changes
    const prefsRef = doc(db, `users/${this.userId}/notification_preferences/main`);
    const unsubPrefs = onSnapshot(prefsRef, (doc) => {
      if (doc.exists()) {
        this.handlePreferencesUpdate(doc.data());
      }
    });

    this.unsubscribers.push(unsubPrefs);
  }

  private getTodayDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private handleCategoryStatsUpdate(data: any): void {
    // Process real-time category stats updates
    // Check thresholds and trigger notifications
  }

  private handlePreferencesUpdate(data: any): void {
    // Update local notification preferences
  }

  private handleForegroundMessage(payload: any): void {
    // Handle foreground push notifications
    this.showDesktopNotification(payload.notification.title, payload.notification.body);
  }

  private showDesktopNotification(title: string, body: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}
```

## 4. Real-time Category Tracking

### 4.1 Firebase Query Adaptation
```typescript
// firebase-time-tracker.ts
class FirebaseTimeTracker {
  private db: any;
  private userId: string;
  private deviceId: string;

  async getCategoryTime(date?: Date, topLevelOnly: boolean = true): Promise<Record<string, number>> {
    const dateKey = date ? this.formatDate(date) : this.getTodayDateKey();
    
    // Firebase'den kategorize edilmiş günlük istatistikleri al
    const statsDoc = await getDoc(
      doc(this.db, `users/${this.userId}/category_stats/${dateKey}`)
    );

    if (statsDoc.exists()) {
      const data = statsDoc.data();
      const categoryTime: Record<string, number> = {};
      
      data.categories.forEach((cat: CategoryStats) => {
        if (topLevelOnly) {
          // Top-level kategori adını al
          const topLevel = cat.name.split('>')[0];
          categoryTime[topLevel] = (categoryTime[topLevel] || 0) + cat.time_spent;
        } else {
          categoryTime[cat.name] = cat.time_spent;
        }
      });

      // "All" kategorisini ekle
      const totalTime = Object.values(categoryTime).reduce((sum, time) => sum + time, 0);
      categoryTime['All'] = totalTime;

      return categoryTime;
    }

    // Eğer cache'de yoksa, gerçek zamanlı hesapla
    return this.calculateCategoryTimeRealTime(dateKey);
  }

  private async calculateCategoryTimeRealTime(dateKey: string): Promise<Record<string, number>> {
    // Firebase'den o günün tüm eventlerini al ve kategorize et
    const eventsQuery = query(
      collectionGroup(this.db, 'events'),
      where('device_id', '==', this.deviceId),
      where('date_key', '==', dateKey)
    );

    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => doc.data());

    // Kategorize etme logic'i (ActivityWatch transform functions'ından uyarlanan)
    return this.categorizeEvents(events);
  }

  private categorizeEvents(events: any[]): Record<string, number> {
    const categoryTime: Record<string, number> = {};
    
    events.forEach(event => {
      const categories = event.data.$category || ['Uncategorized'];
      const duration = event.duration;
      
      categories.forEach((category: string) => {
        categoryTime[category] = (categoryTime[category] || 0) + duration;
      });
    });

    return categoryTime;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getTodayDateKey(): string {
    return this.formatDate(new Date());
  }
}
```

### 4.2 Firebase CategoryAlert
```typescript
// firebase-category-alert.ts
class FirebaseCategoryAlert {
  private config: CategoryConfig;
  private stats: CategoryStats;
  private firebaseClient: FirebaseNotifyClient;
  private timeTracker: FirebaseTimeTracker;

  constructor(
    config: CategoryConfig, 
    firebaseClient: FirebaseNotifyClient,
    timeTracker: FirebaseTimeTracker
  ) {
    this.config = config;
    this.firebaseClient = firebaseClient;
    this.timeTracker = timeTracker;
    this.stats = {
      name: config.name,
      time_spent: 0,
      max_triggered: 0,
      last_triggered: Timestamp.now(),
      sessions: []
    };
  }

  async update(): Promise<void> {
    try {
      const categoryTime = await this.timeTracker.getCategoryTime();
      const newTimeSpent = categoryTime[this.config.name] || 0;
      
      if (newTimeSpent !== this.stats.time_spent) {
        this.stats.time_spent = newTimeSpent;
        await this.saveStats();
      }
    } catch (error) {
      console.error(`Error updating ${this.config.name}:`, error);
    }
  }

  async check(silent: boolean = false): Promise<void> {
    const untriggeredThresholds = this.config.thresholds.filter(
      threshold => threshold > this.stats.max_triggered
    );

    for (const threshold of untriggeredThresholds.reverse()) {
      if (threshold <= this.stats.time_spent) {
        this.stats.max_triggered = threshold;
        this.stats.last_triggered = Timestamp.now();
        
        if (!silent) {
          await this.triggerNotification(threshold);
        }
        
        await this.saveStats();
        break;
      }
    }
  }

  private async triggerNotification(threshold: number): Promise<void> {
    const thresholdStr = this.formatDuration(threshold);
    const spentStr = this.formatDuration(this.stats.time_spent);
    
    const title = this.config.positive ? "Goal reached!" : "Time spent";
    const message = `${this.config.label}: ${thresholdStr}` + 
                   (thresholdStr !== spentStr ? ` (${spentStr})` : '');

    // Local desktop notification
    this.showDesktopNotification(title, message);

    // Cloud notification via Firebase Cloud Function
    await this.sendCloudNotification({
      type: 'threshold',
      category: this.config.name,
      threshold_reached: threshold,
      time_spent: this.stats.time_spent,
      message,
      title
    });

    // Save to notification history
    await this.saveNotificationHistory({
      type: 'threshold',
      category: this.config.name,
      threshold_reached: threshold,
      time_spent: this.stats.time_spent,
      message,
      sent_at: Timestamp.now(),
      device_id: this.firebaseClient.deviceId,
      acknowledged: false
    });
  }

  private async saveStats(): Promise<void> {
    const dateKey = new Date().toISOString().split('T')[0];
    const statsRef = doc(
      this.firebaseClient.db, 
      `users/${this.firebaseClient.userId}/category_stats/${dateKey}`
    );

    await updateDoc(statsRef, {
      [`categories.${this.config.name}`]: this.stats,
      last_updated: Timestamp.now()
    });
  }

  private async sendCloudNotification(notificationData: any): Promise<void> {
    // Firebase Cloud Function'ı çağır
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.firebaseClient.userId,
        ...notificationData
      })
    });

    if (!response.ok) {
      console.error('Failed to send cloud notification');
    }
  }

  private async saveNotificationHistory(notification: any): Promise<void> {
    const historyRef = collection(
      this.firebaseClient.db,
      `users/${this.firebaseClient.userId}/notification_history`
    );
    
    await addDoc(historyRef, notification);
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (result === '') result += `${remainingSeconds}s `;
    
    return result.trim();
  }

  private showDesktopNotification(title: string, message: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/logo.png',
        tag: `category-${this.config.name}`
      });
    }
  }

  getStatus(): string {
    return `${this.config.label}: ${this.formatDuration(this.stats.time_spent)}`;
  }
}
```

## 5. Cloud Functions for Notifications

### 5.1 Notification Sender Function
```typescript
// functions/src/notifications.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const messaging = getMessaging();

export const sendNotification = onCall(async (request) => {
  const { userId, type, category, threshold_reached, time_spent, message, title } = request.data;
  
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Get user's notification preferences
  const prefsDoc = await db.doc(`users/${userId}/notification_preferences/main`).get();
  
  if (!prefsDoc.exists) {
    throw new HttpsError('not-found', 'User preferences not found');
  }

  const prefs = prefsDoc.data()!;
  
  // Check if notifications are enabled and not in quiet hours
  if (!prefs.general_settings.enabled || isInQuietHours(prefs.general_settings.quiet_hours)) {
    return { success: false, reason: 'notifications_disabled_or_quiet_hours' };
  }

  // Get device tokens
  const deviceTokens = prefs.device_tokens || [];
  
  if (deviceTokens.length === 0) {
    return { success: false, reason: 'no_device_tokens' };
  }

  // Get notification template
  const template = await getNotificationTemplate(type);
  
  // Send to all devices
  const promises = deviceTokens.map(token => 
    sendToDevice(token, title, message, { type, category, userId })
  );

  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled').length;

  return { 
    success: true, 
    sent_to_devices: successful,
    total_devices: deviceTokens.length 
  };
});

// Trigger on category stats update
export const onCategoryStatsUpdated = onDocumentUpdated(
  'users/{userId}/category_stats/{date}',
  async (event) => {
    const { userId, date } = event.params;
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    if (!newData || !oldData) return;

    // Check for threshold breaches
    const categories = newData.categories || {};
    const oldCategories = oldData.categories || {};

    for (const [categoryName, stats] of Object.entries(categories)) {
      const oldStats = oldCategories[categoryName];
      const categoryStats = stats as CategoryStats;
      
      if (!oldStats || categoryStats.max_triggered > oldStats.max_triggered) {
        // New threshold reached, trigger notification
        await triggerThresholdNotification(userId, categoryName, categoryStats);
      }
    }
  }
);

async function sendToDevice(
  token: string, 
  title: string, 
  body: string, 
  data: Record<string, string>
): Promise<void> {
  const message = {
    token,
    notification: { title, body },
    data,
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#4285f4',
        sound: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  await messaging.send(message);
}

function isInQuietHours(quietHours: any): boolean {
  if (!quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseTime(quietHours.start);
  const endTime = parseTime(quietHours.end);
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

async function getNotificationTemplate(type: string): Promise<MessageTemplate> {
  const templateDoc = await db.doc(`global/notification_templates`).get();
  const templates = templateDoc.data() || {};
  
  return templates[type] || {
    title: 'ActivityWatch',
    body: '{message}',
    variables: ['message']
  };
}

async function triggerThresholdNotification(
  userId: string, 
  categoryName: string, 
  stats: CategoryStats
): Promise<void> {
  // Get category configuration
  const prefsDoc = await db.doc(`users/${userId}/notification_preferences/main`).get();
  const prefs = prefsDoc.data();
  
  if (!prefs) return;
  
  const categoryConfig = prefs.categories.find((c: CategoryConfig) => c.name === categoryName);
  if (!categoryConfig || !categoryConfig.enabled) return;

  // Format notification message
  const thresholdStr = formatDuration(stats.max_triggered);
  const spentStr = formatDuration(stats.time_spent);
  
  const title = categoryConfig.positive ? "Goal reached!" : "Time spent";
  const message = `${categoryConfig.label}: ${thresholdStr}` + 
                 (thresholdStr !== spentStr ? ` (${spentStr})` : '');

  // Send notification
  await sendNotification({
    data: {
      userId,
      type: 'threshold',
      category: categoryName,
      threshold_reached: stats.max_triggered,
      time_spent: stats.time_spent,
      message,
      title
    },
    auth: { uid: userId }
  } as any);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (result === '') result += `${seconds}s `;
  
  return result.trim();
}
```

## 6. User Preferences Management

### 6.1 Preferences API
```typescript
// firebase-preferences.ts
class NotificationPreferencesManager {
  private db: any;
  private userId: string;

  constructor(db: any, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  async getPreferences(): Promise<NotificationSettings & { categories: CategoryConfig[] }> {
    const prefsDoc = await getDoc(
      doc(this.db, `users/${this.userId}/notification_preferences/main`)
    );

    if (prefsDoc.exists()) {
      return prefsDoc.data() as any;
    }

    // Return default preferences
    return this.getDefaultPreferences();
  }

  async updatePreferences(
    preferences: Partial<NotificationSettings & { categories: CategoryConfig[] }>
  ): Promise<void> {
    const prefsRef = doc(this.db, `users/${this.userId}/notification_preferences/main`);
    
    await updateDoc(prefsRef, {
      ...preferences,
      updated_at: Timestamp.now()
    });
  }

  async addCategory(category: CategoryConfig): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.categories.push(category);
    
    await this.updatePreferences({ categories: prefs.categories });
  }

  async updateCategory(categoryName: string, updates: Partial<CategoryConfig>): Promise<void> {
    const prefs = await this.getPreferences();
    const categoryIndex = prefs.categories.findIndex(c => c.name === categoryName);
    
    if (categoryIndex !== -1) {
      prefs.categories[categoryIndex] = { ...prefs.categories[categoryIndex], ...updates };
      await this.updatePreferences({ categories: prefs.categories });
    }
  }

  async removeCategory(categoryName: string): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.categories = prefs.categories.filter(c => c.name !== categoryName);
    
    await this.updatePreferences({ categories: prefs.categories });
  }

  private getDefaultPreferences(): NotificationSettings & { categories: CategoryConfig[] } {
    return {
      general_settings: {
        enabled: true,
        quiet_hours: {
          enabled: false,
          start: "22:00",
          end: "08:00"
        },
        daily_checkin: {
          enabled: true,
          time: "17:00"
        },
        hourly_checkin: {
          enabled: true,
          only_when_active: true
        },
        new_day_notification: true,
        server_status_alerts: true,
        sound_enabled: true,
        vibration_enabled: true
      },
      categories: [
        {
          name: "All",
          label: "All",
          thresholds: [3600, 7200, 14400, 21600, 28800], // 1h, 2h, 4h, 6h, 8h
          positive: false,
          enabled: true,
          color: "#4285f4"
        },
        {
          name: "Work",
          label: "💼 Work",
          thresholds: [900, 1800, 3600, 7200, 14400], // 15m, 30m, 1h, 2h, 4h
          positive: true,
          enabled: true,
          color: "#34a853"
        },
        {
          name: "Social Media",
          label: "📱 Social Media",
          thresholds: [900, 1800, 3600], // 15m, 30m, 1h
          positive: false,
          enabled: true,
          color: "#ea4335"
        }
      ],
      device_tokens: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
  }
}
```

## 7. Multi-device Synchronization

### 7.1 Device Management
```typescript
// firebase-device-manager.ts
class DeviceManager {
  private db: any;
  private userId: string;
  private deviceId: string;

  constructor(db: any, userId: string, deviceId: string) {
    this.db = db;
    this.userId = userId;
    this.deviceId = deviceId;
  }

  async registerDevice(): Promise<void> {
    const deviceRef = doc(this.db, `users/${this.userId}/devices/${this.deviceId}`);
    
    await setDoc(deviceRef, {
      device_id: this.deviceId,
      hostname: this.getHostname(),
      platform: this.getPlatform(),
      last_seen: Timestamp.now(),
      notifications_enabled: true,
      created_at: Timestamp.now()
    }, { merge: true });
  }

  async updateLastSeen(): Promise<void> {
    const deviceRef = doc(this.db, `users/${this.userId}/devices/${this.deviceId}`);
    
    await updateDoc(deviceRef, {
      last_seen: Timestamp.now()
    });
  }

  async getActiveDevices(): Promise<any[]> {
    const devicesQuery = query(
      collection(this.db, `users/${this.userId}/devices`),
      where('last_seen', '>', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
    );

    const snapshot = await getDocs(devicesQuery);
    return snapshot.docs.map(doc => doc.data());
  }

  async enableNotifications(enabled: boolean): Promise<void> {
    const deviceRef = doc(this.db, `users/${this.userId}/devices/${this.deviceId}`);
    
    await updateDoc(deviceRef, {
      notifications_enabled: enabled,
      updated_at: Timestamp.now()
    });
  }

  private getHostname(): string {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return process.env.HOSTNAME || 'unknown';
  }

  private getPlatform(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }
    return process.env.PLATFORM || 'unknown';
  }
}

// Cross-device notification deduplication
class NotificationDeduplicator {
  private static readonly DEDUP_WINDOW = 5000; // 5 seconds
  private static sentNotifications = new Map<string, number>();

  static shouldSend(notificationId: string): boolean {
    const now = Date.now();
    const lastSent = this.sentNotifications.get(notificationId);
    
    if (!lastSent || (now - lastSent) > this.DEDUP_WINDOW) {
      this.sentNotifications.set(notificationId, now);
      return true;
    }
    
    return false;
  }

  static generateId(userId: string, type: string, category: string, threshold?: number): string {
    return `${userId}:${type}:${category}:${threshold || 'none'}`;
  }
}
```

## 8. Performance Optimization

### 8.1 Efficient Data Loading
```typescript
// firebase-cache-manager.ts
class FirebaseCacheManager {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>();
  private readonly DEFAULT_TTL = 60000; // 1 minute

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.DEFAULT_TTL): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now, ttl });
    
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Batch operations for efficiency
class BatchOperationsManager {
  private operations: any[] = [];
  private readonly BATCH_SIZE = 500;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor(private db: any) {
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  addOperation(operation: any): void {
    this.operations.push(operation);
    
    if (this.operations.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.operations.length === 0) return;

    const batch = writeBatch(this.db);
    const operationsToProcess = this.operations.splice(0, this.BATCH_SIZE);

    operationsToProcess.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Batch operation failed:', error);
      // Optionally retry or handle failed operations
    }
  }
}
```

### 8.2 Background Sync
```typescript
// background-sync.ts
class BackgroundSyncManager {
  private syncQueue: any[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupEventListeners();
    this.startSyncLoop();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  addToSyncQueue(operation: any): void {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      retries: 0
    });

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const operation = this.syncQueue[0];
      
      try {
        await this.executeOperation(operation);
        this.syncQueue.shift(); // Remove successful operation
      } catch (error) {
        operation.retries++;
        if (operation.retries >= 3) {
          console.error('Operation failed after 3 retries:', operation);
          this.syncQueue.shift(); // Remove failed operation
        } else {
          // Move to end of queue for retry
          this.syncQueue.push(this.syncQueue.shift());
        }
        break; // Stop processing on error
      }
    }
  }

  private async executeOperation(operation: any): Promise<void> {
    switch (operation.type) {
      case 'notification_sent':
        await this.syncNotificationHistory(operation.data);
        break;
      case 'preferences_updated':
        await this.syncPreferences(operation.data);
        break;
      case 'stats_updated':
        await this.syncCategoryStats(operation.data);
        break;
    }
  }

  private async syncNotificationHistory(data: any): Promise<void> {
    // Sync notification history to Firebase
  }

  private async syncPreferences(data: any): Promise<void> {
    // Sync preferences to Firebase
  }

  private async syncCategoryStats(data: any): Promise<void> {
    // Sync category stats to Firebase
  }

  private startSyncLoop(): void {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000); // Check every 30 seconds
  }
}
```

## 9. Integration Example

### 9.1 Main Application Integration
```typescript
// firebase-notify-main.ts
class FirebaseNotifyApp {
  private firebaseClient: FirebaseNotifyClient;
  private timeTracker: FirebaseTimeTracker;
  private preferencesManager: NotificationPreferencesManager;
  private deviceManager: DeviceManager;
  private categoryAlerts: Map<string, FirebaseCategoryAlert> = new Map();

  async initialize(userId: string, deviceId: string): Promise<void> {
    // Initialize Firebase clients
    this.firebaseClient = new FirebaseNotifyClient(userId, deviceId);
    this.timeTracker = new FirebaseTimeTracker(db, userId, deviceId);
    this.preferencesManager = new NotificationPreferencesManager(db, userId);
    this.deviceManager = new DeviceManager(db, userId, deviceId);

    // Initialize components
    await this.firebaseClient.initialize();
    await this.deviceManager.registerDevice();
    
    // Load preferences and setup alerts
    await this.setupCategoryAlerts();
    
    // Start monitoring loops
    this.startThresholdMonitoring();
    this.startScheduledNotifications();
  }

  private async setupCategoryAlerts(): Promise<void> {
    const preferences = await this.preferencesManager.getPreferences();
    
    for (const categoryConfig of preferences.categories) {
      if (categoryConfig.enabled) {
        const alert = new FirebaseCategoryAlert(
          categoryConfig,
          this.firebaseClient,
          this.timeTracker
        );
        
        this.categoryAlerts.set(categoryConfig.name, alert);
      }
    }
  }

  private startThresholdMonitoring(): void {
    setInterval(async () => {
      for (const alert of this.categoryAlerts.values()) {
        await alert.update();
        await alert.check();
      }
      
      await this.deviceManager.updateLastSeen();
    }, 10000); // Check every 10 seconds
  }

  private startScheduledNotifications(): void {
    this.startHourlyCheckin();
    this.startDailyCheckin();
    this.startNewDayNotification();
  }

  private startHourlyCheckin(): void {
    setInterval(async () => {
      const preferences = await this.preferencesManager.getPreferences();
      
      if (!preferences.general_settings.hourly_checkin.enabled) return;
      
      // Check if user is active (similar to original logic)
      const isActive = await this.checkUserActivity();
      
      if (!isActive && preferences.general_settings.hourly_checkin.only_when_active) {
        return;
      }

      await this.sendCheckinNotification();
    }, 3600000); // Every hour
  }

  private startDailyCheckin(): void {
    // Implementation for daily checkin at specified time
  }

  private startNewDayNotification(): void {
    // Implementation for new day notification
  }

  private async checkUserActivity(): Promise<boolean> {
    // Check latest AFK events to determine if user is active
    return true; // Placeholder
  }

  private async sendCheckinNotification(): Promise<void> {
    const categoryTime = await this.timeTracker.getCategoryTime();
    const topCategories = Object.entries(categoryTime)
      .filter(([_, time]) => time > 0.02 * categoryTime['All'])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    if (topCategories.length === 0) return;

    const message = topCategories
      .map(([category, time]) => `- ${category}: ${this.formatDuration(time)}`)
      .join('\n');

    // Send local notification
    this.showDesktopNotification('Time today', message);

    // Save to history
    await this.saveNotificationHistory({
      type: 'checkin',
      category: 'All',
      message,
      sent_at: Timestamp.now(),
      device_id: this.deviceManager.deviceId,
      acknowledged: false
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (result === '') result += `${seconds}s `;
    
    return result.trim();
  }

  private showDesktopNotification(title: string, message: string): void {
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }

  private async saveNotificationHistory(notification: any): Promise<void> {
    // Implementation to save notification history
  }

  async cleanup(): Promise<void> {
    this.firebaseClient.cleanup();
  }
}

// Usage
const app = new FirebaseNotifyApp();
app.initialize('user123', 'device456');
```

## 10. Migration Strategy

### 10.1 Gradual Migration Plan
```typescript
// migration-manager.ts
class NotificationMigrationManager {
  async migrateFromLocal(localPreferences: any): Promise<void> {
    // Convert local aw-notify preferences to Firebase format
    const firebasePreferences = this.convertLocalToFirebase(localPreferences);
    
    // Save to Firebase
    await this.preferencesManager.updatePreferences(firebasePreferences);
  }

  private convertLocalToFirebase(localPrefs: any): any {
    // Conversion logic from local aw-notify format to Firebase format
    return {
      general_settings: {
        enabled: true,
        // Map local settings to Firebase format
      },
      categories: [
        // Convert local category configurations
      ]
    };
  }

  async enableFirebaseMode(): Promise<void> {
    // Switch from local mode to Firebase mode
    localStorage.setItem('aw-notify-mode', 'firebase');
  }

  async enableLocalMode(): Promise<void> {
    // Fallback to local mode
    localStorage.setItem('aw-notify-mode', 'local');
  }

  isFirebaseModeEnabled(): boolean {
    return localStorage.getItem('aw-notify-mode') === 'firebase';
  }
}
```

Bu Firebase notifications entegrasyonu, aw-notify modülünün tüm özelliklerini Firebase altyapısına taşıyarak real-time, multi-device ve scalable bir notification sistemi sağlıyor. Mevcut functionality korunurken Firebase'in avantajları (real-time sync, push notifications, cloud functions) da kullanılıyor. 