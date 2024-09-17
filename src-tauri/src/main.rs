// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};
use std::process::{Command, Stdio};
use std::io::Read;
use std::io::{BufReader, BufRead};

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![run_bash_script])
    .invoke_handler(tauri::generate_handler![run_test_script])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// let exe_path = std::env::current_exe();
  // let exe_path_parent = std::env::current_exe().unwrap().parent();

  // println!("{:?}", (exe_path));

const TEST_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/test.sh";
const AUTOMATE_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/1_Automate.sh";
const UPLOAD_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/2_1_Upload.sh";
const REMOTE_RUN_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/3_RemoteRun.sh";
const MONITOR_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/4_Monitor.sh";
const DOWNLOAD_SCRIPT: &str = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/5_Download.sh";


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
fn run_test_script(script_path: String, app_handle: AppHandle) -> Result<(), String> {
  let script_path = TEST_SCRIPT;

  let mut command = Command::new("bash")
    .arg(script_path)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| format!("Failed to spawn command: {}", e))?;

let mut stdout = command.stdout.unwrap();
let mut stderr = command.stderr.unwrap();

// Read and stream output in a loop
loop {
    let mut buffer = [0; 1024];
    let read_bytes = stdout.read(&mut buffer).map_err(|e| format!("Failed to read stdout: {}", e))?;

    if read_bytes == 0 {
        break;
    }

    let output_str = String::from_utf8(buffer[..read_bytes].to_vec()).map_err(|e| format!("Invalid UTF-8 output: {}", e))?;

    // Send output to the frontend using app_handle.emit
    app_handle.emit_all("shell_script_output", output_str);
}

// Handle errors or incomplete output
// let exit_status = command.wait().map_err(|e| format!("Failed to wait for command: {}", e))?;

// if !exit_status.success() {
//     // Handle errors
// }

Ok(())
}



// fn main() -> Result<(), String> {
//   let automate_path = "/C:/Users/mattberhe/Code/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/test.sh";
//   let test_path = "./../../pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto_0010/1_Automate.sh";

//   let output = match Command::new("bash")
//     .arg(automate_path)
//     .output() {
//       Ok(output) => output,
//       Err(err) => return Err(format!("Failed to run script: {}", err)),
//     };

//     if output.status.success() {
//       println!("Script ran successfully.");
//   } else {
//       println!("Script failed with exit code: {}", output.status);
//   }

//     let output_string = String::from_utf8(output.stdout)
//     .map_err(|err| format!("Failed to convert output to string: {}", err))?;

//     println!("Script output: {}", output_string);
//     Ok(())
// }
