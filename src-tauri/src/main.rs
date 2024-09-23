// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Window;
use std::process::{Command, Stdio};
use std::io::{BufRead, self, Read};
use std::env;
use std::path::Path;
use std::fs::File;
use std::fs;

fn main() {
  tauri::Builder::default()
    // .invoke_handler(tauri::generate_handler![run_bash_script])
    .invoke_handler(tauri::generate_handler![read_log_file, read_slurm_file, run_bash_script_test])    
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// let exe_path = std::env::current_exe();
  // let exe_path_parent = std::env::current_exe().unwrap().parent();

  // println!("{:?}", (exe_path));

const TEST_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/test.sh";
const AUTOMATE_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/1_Automate.sh";
const UPLOAD_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/2_1_Upload.sh";
const REMOTE_RUN_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/3_RemoteRun.sh";
const MONITOR_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/4_Monitor.sh";
const DOWNLOAD_SCRIPT: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/5_Download.sh";

const LOG_FILE: &str = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/log.log";

// this works, however the output is only sent when the whole script finishes
#[tauri::command]
fn run_bash_script(script_name: String) -> Result<String, String> {
  let script_path: &str;

  match script_name.as_str() {
    "test" => script_path = TEST_SCRIPT,
    "automate" => script_path = AUTOMATE_SCRIPT,
    "upload" => script_path = UPLOAD_SCRIPT,
    "remote_run" => script_path = REMOTE_RUN_SCRIPT,
    "monitor" => script_path = MONITOR_SCRIPT,
    "download" => script_path = DOWNLOAD_SCRIPT,
    _ => return Err(format!("Unsupported script name: {}", script_name)),
  }

  let output = match Command::new("bash")
    .arg(script_path)  // Use the provided script path
    .output() {
      Ok(output) => output,
      Err(err) => return Err(format!("Failed to run script: {}", err)),
  };

  let output_string = String::from_utf8(output.stdout)
    .map_err(|err| format!("Failed to convert output to string: {}", err))?;

  println!("Script output: {}", output_string);
  Ok(output_string)

}

#[tauri::command]
fn read_log_file(file_path: String) -> Result<String, String> {
  // Check if the file exists
  let file_path = LOG_FILE;
  if !Path::new(&file_path).exists() {
      return Err(format!("File not found: {}", file_path));
  }

  // Open the log file
  let mut file = File::open(&file_path).map_err(|e| e.to_string())?;
  let mut contents = String::new();

  // Read the entire file into a single string
  file.read_to_string(&mut contents).map_err(|e| e.to_string())?;

  // Return the file contents as the result
  Ok(contents)
}

#[tauri::command]
fn read_slurm_file(folder_path: String, file_name: String) -> Result<String, String> {
  let folder_path = "C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/outputSlurm";
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
async fn run_bash_script_test(window: Window, script_name: String) -> Result<(), String> {
  // Determine the script path based on the passed script_name
  let script_path: &str = match script_name.as_str() {
    "test" => TEST_SCRIPT,
    "automate" => AUTOMATE_SCRIPT,
    "upload" => UPLOAD_SCRIPT,
    "remote_run" => REMOTE_RUN_SCRIPT,
    "monitor" => MONITOR_SCRIPT,
    "download" => DOWNLOAD_SCRIPT,
    _ => return Err(format!("Unsupported script name: {}", script_name)),
  };

  // getting the parent directory of where the script_path is located
  let script_dir = Path::new(script_path).parent().unwrap();

  let bash_command = "C:/Program Files/Git/bin/bash.exe";

   let mut child = Command::new(bash_command)
    .arg(script_path)
    .current_dir(script_dir)
    .envs(env::vars()) // Pass the current environment variables
    .stdout(Stdio::piped()) // Pipe stdout
    .spawn()
    .map_err(|e| e.to_string())?;

  let stdout = child.stdout.as_mut().ok_or("Failed to open stdout")?;
  let reader = std::io::BufReader::new(stdout);

  // Read lines from the script's output and emit as Tauri events
  for line in reader.lines() {
    match line {
      Ok(output) => {
        println!("Emitting: {}", output);  // Add this line to debug
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
    .emit(format!("script-finished-{}", script_name).as_str(), "Script completed") 
    .map_err(|e| e.to_string())?;

  Ok(())
}

