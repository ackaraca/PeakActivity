use tauri::{api::notification::Notification, AppHandle, Manager};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SmartNotification {
    pub id: String,
    pub title: String,
    pub body: String,
    pub notification_type: NotificationType,
    pub actions: Vec<NotificationAction>,
    pub requires_voice_input: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum NotificationType {
    FocusBreakSuggestion,
    ContextLabeling,
    AnomalyDetection,
    GoalProgress,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationAction {
    pub id: String,
    pub label: String,
    pub response_type: ResponseType,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ResponseType {
    Button,
    VoiceInput,
    TextInput,
}

#[tauri::command]
pub async fn show_smart_notification(
    app_handle: AppHandle,
    notification: SmartNotification,
) -> Result<(), String> {
    // Windows native notification API kullan
    let notification_result = Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(&notification.title)
        .body(&notification.body)
        .show();
    
    match notification_result {
        Ok(_) => {
            // Notification event listener'ını aktif et
            setup_notification_listeners(&app_handle, &notification).await?;
            Ok(())
        }
        Err(e) => Err(format!("Bildirim gösterilemedi: {}", e)),
    }
}

async fn setup_notification_listeners(
    app_handle: &AppHandle,
    notification: &SmartNotification,
) -> Result<(), String> {
    // Bildirim yanıtlarını dinle ve frontend'e gönder
    Ok(())
} 