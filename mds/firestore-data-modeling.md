# Firestore Data Modeling Documentation

## Firestore Data Model

### Main Collection Structure
- **users/**: User profiles
  - **{userId}/**
    - **activities/**: User activities
    - **goals/**: Goals
    - **insights/**: AI-generated insights
    - **daily_reports/**: Daily reports
    - **weekly_reports/**: Weekly reports
    - **automation_rules/**: User-defined rules
    - **settings/**: Custom settings
- **teams/**: Team information (Pro tier)
- **subscriptions/**: Subscription information
- **app_categories/**: Application category cache
- **system_insights/**: System-wide insights
- **performance_metrics/**: Performance metrics
- **error_logs/**: Error logs
- **analytics_events/**: Analytics events

## Detailed Collection Schemas

### User Document
- **uid**: Firebase Auth UID
- **email**: Email address
- **display_name**: Display name
- **avatar_url**: Profile picture URL
- **created_at**: Account creation time
- **last_login**: Last login time
- **last_active**: Last active time
- **timezone**: User timezone
- **locale**: Language setting

### Activity Document
- **id**: Document ID
- **user_id**: User ID
- **timestamp**: Activity start time
- **duration**: Duration (seconds)
- **end_timestamp**: Activity end time
- **app_name**: Application name
- **app_id**: Application ID (for Windows)
- **window_title**: Window title
- **process_name**: Process name
- **url**: Full URL
- **domain**: Domain
- **page_title**: Page title
- **category**: Main category
- **subcategory**: Subcategory
- **tags**: Tags
- **productivity_score**: Productivity score
- **focus_quality**: Focus quality
- **interruption_count**: Interruption count
- **context_switches**: Context switch count
- **is_manual**: Is it a manual entry?
- **manual_category**: Manual category
- **manual_notes**: User notes
- **mood_rating**: Mood rating
- **energy_level**: Energy level
- **project_id**: Associated project ID
- **goal_ids**: Related goal IDs
- **device_info**: Device information
- **data_quality**: Data quality
- **synced_to_cloud**: Is it synced to the cloud?
- **local_id**: Local database ID
- **created_at**: Creation time
- **updated_at**: Update time
- **version**: Document version 