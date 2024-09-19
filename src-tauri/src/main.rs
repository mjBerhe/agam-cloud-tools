// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Window;
use std::process::{Command, Stdio};
use std::io::BufRead;
use std::env;
use std::path::Path;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![run_bash_script])
    .invoke_handler(tauri::generate_handler![run_bash_script_test])
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

  // Spawn the bash script process
  let mut child = Command::new("bash")
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

