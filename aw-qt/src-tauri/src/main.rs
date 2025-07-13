#!/usr/bin/env rust-script
#![allow(unused_variables)]
#![allow(unused_mut)]
#![allow(unused_imports)]
#![allow(dead_code)]

use tauri::{Manager, CustomProtocol, MenuItem};
use tauri::menu::{Menu, MenuItem as MenuEntry, Submenu};
use tauri::SystemTrayEvent; // Import SystemTrayEvent

mod commands;
mod speech_recognition;
mod notifications;
mod tray;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    // let quit = MenuItem::new("quit".to_string(), "Quit");
    // let hide = MenuItem::new("hide".to_string(), "Hide");
    // let show = MenuItem::new("show".to_string(), "Show");

    // let tray_menu = SystemTrayMenu::new()
    //     .add_item(show)
    //     .add_item(hide)
    //     .add_native_item(SystemTrayMenuItem::Separator)
    //     .add_item(quit);

    tauri::Builder::default()
        .system_tray(tray::create_system_tray())
        .on_system_tray_event(tray::handle_system_tray_event)
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            },
            _ => {},
        })
        .setup(|app| {
            app.listen_global("tauri://custom-protocol", move |event| {
                if let Some(url) = event.payload() {
                    if url.starts_with("awfork://disable-rule") {
                        let app_handle = event.window().app_handle();
                        if let Ok(parsed_url) = url::Url::parse(url) {
                            if let Some(id) = parsed_url.query_pairs().find(|(key, _)| key == "id").map(|(_, value)| value.into_owned()) {
                                tauri::async_runtime::spawn(async move {
                                    match commands::get_automation_rule_by_id_command(id.clone()).await {
                                        Ok(rule) => {
                                            let user_id = rule.user_id;
                                            match commands::delete_automation_rule_command(user_id, id.clone()).await {
                                                Ok(_) => println!("Kural başarıyla devre dışı bırakıldı: {}", id),
                                                Err(e) => eprintln!("Kural devre dışı bırakılırken hata oluştu: {}", e),
                                            }
                                        },
                                        Err(e) => eprintln!("Kural bulunamadı veya getirilirken hata oluştu: {}", e),
                                    }
                                });
                            }
                        }
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::create_goal_command,
            commands::get_all_goals_command,
            commands::update_goal_command,
            commands::delete_goal_command,
            commands::send_notification_command,
            commands::create_automation_rule_command,
            commands::get_all_automation_rules_command,
            commands::update_automation_rule_command,
            commands::delete_automation_rule_command,
            commands::get_automation_rule_by_id_command,
            commands::get_system_info_command,
            commands::check_resource_usage_for_alerts, // Yeni eklenen komutu buraya ekle
            commands::evaluate_and_execute_rules,
            speech_recognition::start_voice_input,
            notifications::show_smart_notification,
            commands::enable_auto_start,
            commands::disable_auto_start,
            commands::encrypt_local_data,
            commands::decrypt_local_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 