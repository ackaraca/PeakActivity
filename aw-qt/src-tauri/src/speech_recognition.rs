use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeechResult {
    pub text: String,
    pub confidence: f32,
}

#[tauri::command]
pub async fn start_voice_input() -> Result<SpeechResult, String> {
    // Windows Speech Recognition API kullanımı
    // PowerShell script ile entegrasyon
    let output = Command::new("powershell")
        .arg("-Command")
        .arg(r#"
            Add-Type -AssemblyName System.Speech
            $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
            $recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
            $recognizer.SetInputToDefaultAudioDevice()
            $result = $recognizer.Recognize()
            if ($result) { $result.Text } else { "No speech detected" }
        "#)
        .output()
        .map_err(|e| format!("Ses tanıma başlatılamadı: {}", e))?;

    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    
    Ok(SpeechResult {
        text,
        confidence: 0.8, // PowerShell'den güven oranı alınamadığı için sabit değer
    })
} 