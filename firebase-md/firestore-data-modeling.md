### 3. users/{userId}/goals/{goalId}
```typescript
interface GoalDocument {
  // Basic goal information
  id: string;                        // Document ID
  user_id: string;                   // User ID
  title: string;                     // Goal title
  description?: string;              // Description
  
  // Goal type and metrics
  type: 'time_based' | 'count_based' | 'habit_based' | 'milestone_based';
  
  // For time-based goals
  target_duration?: number;          // Target duration (seconds)
  target_daily_duration?: number;    // Daily target duration
  target_weekly_duration?: number;   // Weekly target duration
  
  // For count-based goals
  target_count?: number;             // Target count
  current_count?: number;            // Current count
  
  // Goal filter
  target_criteria: {
    app_names?: string[];            // Targeted applications
    categories?: string[];           // Targeted categories
    tags?: string[];                 // Targeted tags
  };
  
  // Progress tracking
  progress: {
    current_duration: number;        // Current duration (seconds)
    current_streak: number;          // Current streak (days)
    longest_streak: number;          // Longest streak (days)
    last_updated: number;            // Last updated time
  };
  
  // Metadata
  created_at: number;                // Creation time
  updated_at: number;                // Update time
  version: number;                   // Document version
}
```

**Veri Yapısı Optimizasyonu Notları:**
- `goals` alt koleksiyonu kullanıcıya özel hedefler için uygun. Genel hedefler sorgulanacaksa Collection Group indekslemesi gerekebilir.
- İlerleme takibi (`progress`) alanlarının güncellemelerinde atomik işlemler (transactions) kullanılmalı.

### 4. users/{userId}/insights/{insightId} 

### 5. users/{userId}/automation_rules/{ruleId}
```typescript
interface AutomationRuleDocument {
  id: string;                     // Document ID
  user_id: string;                // User ID
  name: string;                   // Rule name
  description?: string;           // Optional description
  is_active: boolean;             // Whether the rule is currently active
  priority: number;               // Rule priority (higher value = higher priority)
  
  // Trigger definition: When should this rule activate?
  trigger: {
    type: 'time_spent' | 'schedule' | 'app_opened' | 'category_time' | 'idle_time' | 'focus_mode_change';
    
    // time_spent trigger specific
    threshold_seconds?: number;   // e.g., 3600 for 1 hour
    app_names?: string[];         // Specific apps to monitor
    categories?: string[];        // Specific categories to monitor

    // schedule trigger specific
    cron_expression?: string;     // e.g., "0 9 * * 1-5" for 9 AM on weekdays
    
    // app_opened trigger specific
    target_app_name?: string;     // e.g., "chrome.exe"
    
    // category_time trigger specific
    target_category?: string;     // e.g., "social"
    threshold_minutes?: number;   // e.g., 30
    
    // idle_time trigger specific
    idle_threshold_seconds?: number; // e.g., 300 for 5 minutes
    
    // focus_mode_change trigger specific
    from_mode?: string;           // e.g., "work"
    to_mode?: string;             // e.g., "break"

    // General conditions (can apply to any trigger)
    conditions?: Array<{
      field: string;              // e.g., "current_time", "activity_category"
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
      value: any;
    }>;
  };
  
  // Action definition: What should happen when the rule activates?
  action: {
    type: 'show_notification' | 'block_app' | 'suggest_break' | 'switch_focus_mode' | 'log_mood' | 'context_prompt';
    
    // show_notification action specific
    title?: string;
    message?: string;
    
    // block_app action specific
    app_to_block?: string;
    duration_minutes?: number;

    // suggest_break action specific
    break_duration_minutes?: number;

    // switch_focus_mode action specific
    target_focus_mode?: string;

    // log_mood action specific
    mood_options?: string[]; // e.g., ["happy", "neutral", "stressed"]

    // context_prompt action specific
    prompt_text?: string;
  };

  // Cooldown mechanism to prevent rapid re-triggering
  cooldown_seconds?: number;      // e.g., 300 for 5 minutes
  last_triggered_at?: number;     // Timestamp of last trigger (Unix epoch milliseconds)
  
  // Metadata
  created_at: number;             // Creation timestamp
  updated_at: number;             // Last update timestamp
  version: number;                // Document version
}
```

**Veri Yapısı Optimizasyonu Notları:**
- Tetikleyici ve eylem türlerine göre sıkça sorgulama yapılacaksa denormalize alanlar veya alt koleksiyonlar düşünülebilir.

### 6. users/{userId}/projects/{projectId}
```typescript
interface ProjectDocument {
  id: string;                         // Document ID
  user_id: string;                    // User ID
  title: string;                      // Project title
  description?: string;               // Optional description
  status: 'active' | 'completed' | 'archived' | 'cancelled'; // Project status
  
  // Dates
  start_date: number;                 // Project start timestamp
  due_date?: number;                  // Project planned due timestamp
  completion_date?: number;           // Actual completion timestamp

  // Progress metrics (can be updated by background functions)
  total_tracked_duration: number;     // Total duration tracked for this project (seconds)
  estimated_remaining_duration?: number; // Estimated remaining work (seconds)
  progress_percentage: number;        // Calculated progress percentage (0-100)

  // Associated entities
  associated_goals?: string[];        // List of goal IDs associated with this project
  associated_tasks?: string[];        // List of task IDs associated with this project

  // Factors for prediction
  activity_breakdown?: {              // Breakdown of activity by category for this project
    [category: string]: number;       // e.g., "coding": 36000
  };
  focus_score_average?: number;       // Average focus quality score for this project

  // Metadata
  created_at: number;                 // Creation timestamp
  updated_at: number;                 // Last update timestamp
  version: number;                    // Document version
}
```

**Veri Yapısı Optimizasyonu Notları:**
- `associated_goals` ve `associated_tasks` gibi referans listeleri çok büyürse, ayrı bir alt koleksiyon (örn. `projects/{projectId}/goals`) düşünülebilir.
- `activity_breakdown` gibi haritalar üzerinde karmaşık sorgular gerekirse, bu verilerin de denormalize edilmesi veya ayrı bir alt koleksiyonda tutulması faydalı olabilir.

### 7. users/{userId}/reports/{reportId}
```typescript
interface ReportDocument {
  id: string;                         // Document ID
  user_id: string;                    // User ID
  name: string;                       // Report or dashboard name
  description?: string;               // Optional description
  type: 'report' | 'dashboard';       // Type of document
  
  // Report/Dashboard configuration
  configuration: {
    // Common filters
    time_range: 'daily' | 'weekly' | 'monthly' | 'custom';
    start_date?: number;              // Unix epoch milliseconds
    end_date?: number;                // Unix epoch milliseconds
    
    // Data granularity
    granularity: 'hourly' | 'daily' | 'weekly';

    // Specific data points/metrics to include
    metrics: Array<{
      metric_name: string;            // e.g., "total_time_spent", "focus_score_average", "anomaly_count"
      filter_criteria?: {
        app_names?: string[];
        categories?: string[];
        tags?: string[];
      };
    }>;

    // Layout and visualization (for dashboards)
    layout?: any;                     // JSON object describing dashboard layout
    chart_types?: {                   // Mapping of metric_name to chart_type
      [metric_name: string]: string;  // e.g., "total_time_spent": "bar_chart"
    };
  };

  // Generated data (can be cached or dynamically generated)
  generated_data?: any;               // JSON object containing the report/dashboard data
  last_generated_at?: number;         // Timestamp of last data generation

  // Metadata
  created_at: number;                 // Creation timestamp
  updated_at: number;                 // Last update timestamp
  version: number;                    // Document version
}
```

**Veri Yapısı Optimizasyonu Notları:**
- `generated_data` alanı potansiyel olarak çok büyük olabileceği için, eğer büyük raporlar bekleniyorsa Cloud Storage'da depolayıp Firestore belgesinde sadece URL referansı tutmak daha verimli olabilir.
- Rapor metriklerine göre sıkça sorgulama yapılacaksa, `metrics` array yerine denormalize alanlar veya alt koleksiyonlar düşünülebilir.

### 8. users/{userId}/custom_events/{eventId}
```typescript
interface CustomEventDocument {
  id: string;                         // Document ID
  user_id: string;                    // User ID
  name: string;                       // Event name
  description?: string;               // Optional description
  type: 'app_opened' | 'app_closed' | 'category_time' | 'focus_mode_change' | 'idle_time' | 'custom'; // Event type
  
  // Event details
  details: {
    app_name?: string;                // e.g., "chrome.exe"
    category?: string;                 // e.g., "social"
    duration_seconds?: number;        // e.g., 300 for 5 minutes
    from_mode?: string;               // e.g., "work"
    to_mode?: string;                 // e.g., "break"
    idle_duration_seconds?: number;  // e.g., 300 for 5 minutes
  };

  // Metadata
  created_at: number;                 // Creation timestamp
  updated_at: number;                 // Last update timestamp
  version: number;                    // Document version
}
``` 

**Veri Yapısı Optimizasyonu Notları:**
- `details` objesindeki alanlara göre sıkça sorgulama yapılacaksa (örn. belirli bir uygulama adı için tüm olaylar), bu alanları üst düzeye denormalize etmek daha iyi indeksleme ve sorgu performansı sağlayabilir.

### 9. users/{userId}/notifications/{notificationId}
```typescript
interface NotificationDocument {
  id: string;                         // Document ID
  user_id: string;                    // User ID
  title: string;                      // Notification title
  message: string;                    // Notification message content
  type: 'info' | 'warning' | 'alert' | 'goal_progress' | 'insight_available' | 'automation_trigger'; // Type of notification
  read: boolean;                      // Whether the user has read the notification
  timestamp: number;                  // When the notification was created (Unix epoch milliseconds)
  action_link?: string;               // Optional link to related content
  related_entity_id?: string;         // ID of related entity (goal, insight, etc.)
  version: number;                    // Document version
}
```

**Veri Yapısı Optimizasyonu Notları:**
- Kullanıcı bildirimleri için uygun yapı. Okunmamış bildirimler için sorgulama performansı önemlidir, `read` alanı için indeksleme sağlanmalı.

### 10. users/{userId}/focus_modes/{modeId}
```typescript
interface FocusModeDocument {
  id: string;                         // Document ID
  user_id: string;                    // User ID
  name: string;                       // Name of the focus mode (e.g., "Deep Work", "Break")
  description?: string;               // Optional description
  is_active: boolean;                 // Whether this mode is currently active for the user
  
  // Configuration for the focus mode
  configuration: {
    block_apps?: string[];            // List of app names to block
    block_categories?: string[];      // List of categories to block
    mute_notifications?: boolean;     // Whether to mute system/app notifications
    auto_suggest_breaks?: boolean;    // Whether to suggest breaks during this mode
    break_interval_minutes?: number;  // How often to suggest breaks
    break_duration_minutes?: number;  // How long each suggested break should be
    allowed_apps?: string[];          // List of apps specifically allowed (whitelist)
    allowed_categories?: string[];    // List of categories specifically allowed (whitelist)
    // Future: integration with external tools (e.g., Slack status, music)
  };

  // Metadata
  created_at: number;                 // Creation timestamp
  updated_at: number;                 // Last update timestamp
  version: number;                    // Document version
}
``` 