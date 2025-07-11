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