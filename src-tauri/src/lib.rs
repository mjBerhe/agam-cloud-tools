// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// use anyhow::{Context, Result};
use regex::Regex;
use std::env;
use std::fs;
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Emitter;
use tauri::Window;
use winapi::um::winbase::CREATE_NO_WINDOW;

const LOG_FILE: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/log.log";
const CONFIG_JSON_FILE: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/config.json";
const SEN_BATCH_FILE: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/Sen_Batch.sh";
const SLURM_FOLDER: &str =
  "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/outputSlurm";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      run_shell_script,
      read_json_file,
      save_json_file,
      read_shell_file,
      save_shell_file,
      read_log_file,
      read_slurm_file,
      read_all_slurm_files
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn run_shell_script(
  window: Window,
  script_name: String,
  script_path_override: Option<String>, // Optional argument for development mode
) -> Result<(), String> {
  // Determine if the current script is one that requires MSYS64 bash (rsync-related)
  let is_rsync_script = match script_name.as_str() {
    "upload" | "upload_sh" | "monitor_download" | "download" => true,
    _ => false,
  };

  // Determine the script path
  let script_path = if let Some(override_path) = script_path_override {
    // Convert the override_path (String) to a PathBuf
    PathBuf::from(override_path)
  } else {
    // Production mode: derive the script path based on the executable's location
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    match script_name.as_str() {
      "automate" => exe_path.parent().unwrap().join("1_Automate.sh"),
      "upload" => exe_path.parent().unwrap().join("2_1_Upload.sh"),
      "upload_sh" => exe_path.parent().unwrap().join("2_2_Upload_sh.sh"),
      "remote_run" => exe_path.parent().unwrap().join("3_RemoteRun.sh"),
      "monitor" => exe_path.parent().unwrap().join("4_Monitor.sh"),
      "monitor_download" => exe_path
        .parent()
        .unwrap()
        .join("4_1_Monitor_with_Download.sh"),
      "download" => exe_path.parent().unwrap().join("5_Download.sh"),
      "cancel" => exe_path.parent().unwrap().join("6_Cancel.sh"),
      _ => return Err(format!("Unsupported script name: {}", script_name)),
    }
  };

  // getting the parent directory of where the script_path is located
  let script_dir = script_path
    .parent()
    .ok_or("Failed to get script directory")?;

  // Dynamically find bash path, passing `is_rsync_script` to prioritize MSYS64 bash if needed
  // let bash_command = match find_bash_path(false) {
  //   Some(path) => path,
  //   None => return Err("Bash executable not found".to_string()),
  // };
  let bash_command = "C:/Program Files/Git/bin/bash.exe";
  println!("Using bash from: {}", bash_command); // Debugging

  // Find the Python executable path
  let python_path = match find_python_path() {
    Ok(path) => path,
    Err(e) => return Err(format!("Failed to find Python: {}", e)), // Handle error explicitly
  };

  let mut child = Command::new(bash_command)
    .arg(script_path.clone())
    .current_dir(script_dir)
    .envs(env::vars()) // Pass the current environment variables
    .env("PYTHON_PATH", python_path) // Set the PYTHON_PATH environment variable if needed
    .stdout(Stdio::piped()) // Pipe stdout
    .stderr(Stdio::piped()) // pipe stderr
    .creation_flags(CREATE_NO_WINDOW) // suppress console window from popping up after each script
    .spawn()
    .map_err(|e| e.to_string())?;

  let stdout = child.stdout.as_mut().ok_or("Failed to open stdout")?;
  let stderr = child.stderr.as_mut().ok_or("Failed to capture stderr")?;

  let stdout_reader = BufReader::new(stdout);
  let stderr_reader = BufReader::new(stderr);

  // Emit lines from stdout
  for line in stdout_reader.lines() {
    match line {
      Ok(output) => {
        println!("Stdout: {}", output); // Debugging
        window
          .emit(format!("script-output-{}", script_name).as_str(), output) // Emit event with output
          .map_err(|e| e.to_string())?;
      }
      Err(e) => return Err(format!("Error reading stdout: {}", e)),
    }
  }

  // Emit lines from stderr
  for line in stderr_reader.lines() {
    match line {
      Ok(output) => {
        println!("Stderr: {}", output); // Debugging
        window
          .emit(format!("script-error-{}", script_name).as_str(), output) // Emit event with output
          .map_err(|e| e.to_string())?;
      }
      Err(e) => return Err(format!("Error reading stderr: {}", e)),
    }
  }

  // Wait for the process to finish
  let status = child.wait().map_err(|e| e.to_string())?;

  // Emit a final event indicating the process has finished
  let result_message = if status.success() {
    "Process completed successfully"
  } else {
    "Process finished with errors"
  };

  window
    .emit(
      format!("script-finished-{}", script_name.clone()).as_str(),
      (script_name.clone(), "Script completed"),
    )
    .map_err(|e| e.to_string())?;

  Ok(())
}

fn find_bash_path(is_rsync: bool) -> Option<String> {
  let output = Command::new("where")
    .arg("bash")
    .creation_flags(0x08000000) // CREATE_NO_WINDOW flag
    .output()
    .map_err(|e| format!("Failed to run 'where' command: {}", e))
    .ok();

  // If we found a valid bash path, return it
  if let Some(output) = output {
    if output.status.success() {
      let bash_paths = String::from_utf8_lossy(&output.stdout);

      if is_rsync {
        // Prefer the MSYS2 bash path when rsync is used
        let msys_bash = bash_paths.lines().find(|path| path.contains("msys64"));
        if let Some(msys_path) = msys_bash {
          return Some(msys_path.trim().to_string());
        }
      }

      // For other scripts, return the first available bash path
      if let Some(first_path) = bash_paths.lines().next() {
        return Some(first_path.trim().to_string());
      }
    }
  }

  // If no bash executable found, return None
  None
}

// Function to find the Python executable path
fn find_python_path() -> Result<String, String> {
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
fn read_all_slurm_files() -> Result<Vec<(String, String)>, String> {
  let folder_path: PathBuf;

  if cfg!(debug_assertions) {
    // development mode
    folder_path = PathBuf::from(SLURM_FOLDER);
  } else {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    folder_path = exe_path.parent().unwrap().join("../outputSlurm");
  }

  // Ensure the folder path exists and is a directory
  let dir = Path::new(&folder_path);
  if !dir.is_dir() {
    return Err("Provided path is not a valid directory".to_string());
  }

  // Regex pattern for "slurm-{7 digits}.out"
  let re =
    Regex::new(r"^slurm-(\d{7})\.out$").map_err(|e| format!("Failed to compile regex: {}", e))?;

  // Vector to store file names and their contents
  let mut results = Vec::new();

  // Iterate through the directory entries
  for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
    let entry = entry.map_err(|e| e.to_string())?;
    let file_name = entry.file_name();
    let file_name_str = file_name.to_string_lossy();

    // Check if the file matches the regex pattern
    if re.is_match(&file_name_str) {
      let file_path = entry.path();

      // Read the file content
      let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;

      // Store the file name and content as a tuple
      results.push((file_name_str.to_string(), content));
    }
  }

  // Return the results
  Ok(results)
}
