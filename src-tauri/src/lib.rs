// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::env;
use std::fs;
use std::fs::File;
use std::io::{BufRead, Read};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Emitter;
use tauri::Window;
use winapi::um::winbase::CREATE_NO_WINDOW;

const MONITOR_SCRIPT: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_Final/4_Monitor.sh";

const LOG_FILE: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_Final/log.log";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![run_bash_script_test])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn run_bash_script_test(window: Window, script_name: String) -> Result<(), String> {
  let script_path: PathBuf;

  if cfg!(debug_assertions) {
    // dev mode
    script_path = match script_name.as_str() {
      //   "test" => PathBuf::from(TEST_SCRIPT),
      //   "automate" => PathBuf::from(AUTOMATE_SCRIPT),
      //   "upload" => PathBuf::from(UPLOAD_SCRIPT),
      //   "upload_sh" => PathBuf::from(UPLOAD_SCRIPT_SH),
      //   "remote_run" => PathBuf::from(REMOTE_RUN_SCRIPT),
      "monitor" => PathBuf::from(MONITOR_SCRIPT),
      //   "download" => PathBuf::from(DOWNLOAD_SCRIPT),
      //   "cancel" => PathBuf::from(CANCEL_SCRIPT),
      _ => return Err(format!("Unsupported script name: {}", script_name)),
    }
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    script_path = match script_name.as_str() {
      "test" => exe_path.parent().unwrap().join("test.sh"),
      "automate" => exe_path.parent().unwrap().join("1_Automate.sh"),
      "upload" => exe_path.parent().unwrap().join("2_1_Upload.sh"),
      "upload_sh" => exe_path.parent().unwrap().join("2_2_Upload_sh.sh"),
      "remote_run" => exe_path.parent().unwrap().join("3_RemoteRun.sh"),
      "monitor" => exe_path.parent().unwrap().join("4_Monitor.sh"),
      "download" => exe_path.parent().unwrap().join("5_Download.sh"),
      "cancel" => exe_path.parent().unwrap().join("6_Cancel.sh"),
      _ => return Err(format!("Unsupported script name: {}", script_name)),
    };
  }

  // getting the parent directory of where the script_path is located
  let script_dir = script_path
    .parent()
    .ok_or("Failed to get script directory")?;

  let bash_command = "C:/Program Files/Git/bin/bash.exe";
  // Find the Python executable path
  let python_path = find_python_path()?;

  let mut child = Command::new(bash_command)
    .arg(script_path.clone())
    .current_dir(script_dir)
    .envs(env::vars()) // Pass the current environment variables
    .env("PYTHON_PATH", python_path) // Set the PYTHON_PATH environment variable if needed
    .stdout(Stdio::piped()) // Pipe stdout
    .creation_flags(CREATE_NO_WINDOW) // suppress console window from popping up after each script
    .spawn()
    .map_err(|e| e.to_string())?;

  let stdout = child.stdout.as_mut().ok_or("Failed to open stdout")?;
  let reader = std::io::BufReader::new(stdout);

  // Read lines from the script's output and emit as Tauri events
  for line in reader.lines() {
    match line {
      Ok(output) => {
        println!("Emitting: {}", output); // Add this line to debug
        window
          .emit(format!("script-output-{}", script_name).as_str(), output) // Emit event with output
          .map_err(|e| e.to_string())?;
      }
      Err(e) => return Err(e.to_string()),
    }
  }

  // Wait for the script to finish
  child.wait().map_err(|e| e.to_string())?;

  // Emit a final event indicating the script has finished
  window
    .emit(
      format!("script-finished-{}", script_name.clone()).as_str(),
      (script_name.clone(), "Script completed"),
    )
    .map_err(|e| e.to_string())?;

  // if running cancel, delete "Submitted batch job {7digits}" from log file
  if script_name == "cancel" {
    let log_file_path = if cfg!(debug_assertions) {
      PathBuf::from(LOG_FILE)
    } else {
      let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
      exe_path.parent().unwrap().join("log.log")
    };

    // Read the log file
    let contents = std::fs::read_to_string(&log_file_path).map_err(|e| e.to_string())?;

    // Split the contents into lines and remove the last line
    let mut lines: Vec<&str> = contents.lines().collect();
    if !lines.is_empty() {
      lines.pop(); // Remove the last line
    }

    // Write the modified contents back to the log file
    std::fs::write(&log_file_path, lines.join("\n")).map_err(|e| e.to_string())?;
  }

  Ok(())
}

// Function to find the Python executable path
fn find_python_path() -> Result<String, String> {
  // let python_command = if cfg!(target_os = "windows") {
  //     "where python"  // On Windows, use 'where'
  // } else {
  //     "which python"  // On Linux/macOS, use 'which'
  // };

  // only testing on windows
  let python_command = "where python";

  // Execute the command to find the Python path
  let output = Command::new("cmd") // Use "cmd" for Windows if running as shell
    .arg("/C")
    .arg(python_command)
    .stdout(Stdio::piped())
    .creation_flags(CREATE_NO_WINDOW) // suppress console window from popping up after each script
    .output()
    .map_err(|e| format!("Failed to run Python path check: {}", e))?;

  if output.status.success() {
    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if !path.is_empty() {
      Ok(path)
    } else {
      Err("Python executable not found".to_string())
    }
  } else {
    let error_message = String::from_utf8_lossy(&output.stderr).to_string();
    Err(format!("Error finding Python path: {}", error_message))
  }
}
