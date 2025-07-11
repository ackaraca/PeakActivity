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