// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::fs::File;
use std::io::{BufRead, Read};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Window;
use winapi::um::winbase::CREATE_NO_WINDOW;

fn main() {
  tauri::Builder::default()
    // .invoke_handler(tauri::generate_handler![run_bash_script])
    .invoke_handler(tauri::generate_handler![
      read_log_file,
      read_slurm_file,
      run_bash_script_test,
      read_json_file,
      save_json_file,
      read_shell_file,
      save_shell_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

const TEST_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/test.sh";
const AUTOMATE_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/1_Automate.sh";
const UPLOAD_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/2_1_Upload.sh";
const REMOTE_RUN_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/3_RemoteRun.sh";
const MONITOR_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/4_Monitor.sh";
const DOWNLOAD_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/5_Download.sh";
const CANCEL_SCRIPT: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/6_Cancel.sh";

const LOG_FILE: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/log.log";
const SLURM_FOLDER: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/outputSlurm";
const CONFIG_JSON_FILE: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/config.json";
const SEN_BATCH_FILE: &str =
  "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/Sen_Batch.sh";

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

#[tauri::command]
async fn run_bash_script_test(window: Window, script_name: String) -> Result<(), String> {
  let script_path: PathBuf;

  if cfg!(debug_assertions) {
    // development mode
    script_path = match script_name.as_str() {
      "test" => PathBuf::from(TEST_SCRIPT),
      "automate" => PathBuf::from(AUTOMATE_SCRIPT),
      "upload" => PathBuf::from(UPLOAD_SCRIPT),
      "remote_run" => PathBuf::from(REMOTE_RUN_SCRIPT),
      "monitor" => PathBuf::from(MONITOR_SCRIPT),
      "download" => PathBuf::from(DOWNLOAD_SCRIPT),
      "cancel" => PathBuf::from(CANCEL_SCRIPT),
      _ => return Err(format!("Unsupported script name: {}", script_name)),
    }
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    script_path = match script_name.as_str() {
      "test" => exe_path.parent().unwrap().join("test.sh"),
      "automate" => exe_path.parent().unwrap().join("1_Automate.sh"),
      "upload" => exe_path.parent().unwrap().join("2_1_Upload.sh"),
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
      format!("script-finished-{}", script_name).as_str(),
      (script_name, "Script completed"),
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
fn read_log_file() -> Result<String, String> {
  // Check if the file exists
  let file_path: PathBuf;

  if cfg!(debug_assertions) {
    // development mode
    file_path = PathBuf::from(LOG_FILE);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    file_path = exe_path.parent().unwrap().join("log.log");
  }

  // Check if the log file exists
  if !file_path.exists() {
    return Err(format!("File not found: {:?}", file_path));
  }

  // Open the log file
  let mut file = File::open(&file_path).map_err(|e| e.to_string())?;
  let mut contents = String::new();

  // Read the entire file into a single string
  file
    .read_to_string(&mut contents)
    .map_err(|e| e.to_string())?;

  // Return the file contents as the result
  Ok(contents)
}

#[tauri::command]
fn read_slurm_file(file_name: String) -> Result<String, String> {
  let folder_path: PathBuf;

  if cfg!(debug_assertions) {
    // development mode
    folder_path = PathBuf::from(SLURM_FOLDER);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    folder_path = exe_path.parent().unwrap().join("../outputSlurm");
  }

  // Construct the file name like "slurm-{file_name}.out"
  let expected_file_name = format!("slurm-{}.out", file_name);

  // Read the directory contents
  let dir = Path::new(&folder_path);
  if !dir.is_dir() {
    return Err("Provided path is not a valid directory".to_string());
  }

  // Check if the expected file exists in the directory
  let file_path = dir.join(&expected_file_name);
  if !file_path.exists() {
    return Err(format!("No file found with name {}", expected_file_name));
  }

  // Read the file content
  let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;

  // Return the file content
  Ok(content)
}

#[tauri::command]
fn read_json_file() -> Result<String, String> {
  let file_path: PathBuf;

  if cfg!(debug_assertions) {
    // dev mode
    file_path = PathBuf::from(CONFIG_JSON_FILE);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    file_path = exe_path.parent().unwrap().join("config.json");
  }

  let content =
    std::fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;
  Ok(content)
}

#[tauri::command]
fn save_json_file(json_data: String) -> Result<String, String> {
  let file_path: PathBuf;

  if cfg!(debug_assertions) {
    // dev mode
    file_path = PathBuf::from(CONFIG_JSON_FILE);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    file_path = exe_path.parent().unwrap().join("config.json");
  }

  // Try to write to the file
  match std::fs::write(file_path, json_data) {
    Ok(_) => Ok("File saved successfully".to_string()), // Return success message
    Err(err) => Err(format!("Failed to save file: {}", err)), // Return error message
  }
}

#[tauri::command]
fn read_shell_file() -> Result<String, String> {
  let file_path: PathBuf;

  if cfg!(debug_assertions) {
    // dev mode
    file_path = PathBuf::from(SEN_BATCH_FILE);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    file_path = exe_path.parent().unwrap().join("Sen_Batch.sh");
  }

  let content =
    std::fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;
  Ok(content)
}

#[tauri::command]
fn save_shell_file(shell_data: String) -> Result<String, String> {
  let file_path: PathBuf;

  if cfg!(debug_assertions) {
    // dev mode
    file_path = PathBuf::from(SEN_BATCH_FILE);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    file_path = exe_path.parent().unwrap().join("Sen_Batch.sh");
  }

  // Try to write to the file
  match std::fs::write(file_path, shell_data) {
    Ok(_) => Ok("File saved successfully".to_string()), // Return success message
    Err(err) => Err(format!("Failed to save file: {}", err)), // Return error message
  }
}
