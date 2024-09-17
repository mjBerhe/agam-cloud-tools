import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { readTextFile, readDir, FileEntry } from "@tauri-apps/api/fs";
import { listen } from "@tauri-apps/api/event";

import { CleanedOutput } from "./components/cleanedOutput";

// const testScript = "./src/test.sh";
// const automateScript = "./src/1_Automate.sh";

const testScript = "test";
const automateScript = "automate";

type Script = "test" | "automate" | "upload" | "remote_run" | "monitor" | "download";

function App() {
  const [selectedFile, setSelectedFile] = useState<{
    pathName: string;
    contents: string;
  }>();

  const [loading, setLoading] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string>();
  const [automateOutput, setAutomateOutput] = useState<string>();
  const [uploadOutput, setUploadOutput] = useState<string>();

  //TODO
  //FIND OUT HOW TAURI EVENTS WORK!!!

  const handleRunScript = async (script: Script) => {
    setLoading(true);
    try {
      if (script === "test") {
        const result = await invoke("run_bash_script", {
          scriptName: testScript,
        });
        console.log(result);
        setAutomateOutput(result as string);
        setLoading(false);
      }
      if (script === "automate") {
        const result = await invoke("run_bash_script", {
          scriptName: automateScript,
        });
        setAutomateOutput(result as string);
        setLoading(false);
      }
      setLoading(false);
      // console.log(result);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenFile = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        title: "Open Text File",
      });
      // if null or multiple files selected, return
      if (!selectedPath || Array.isArray(selectedPath)) return;
      const contents = await readTextFile(selectedPath);
      console.log(selectedPath, contents);
      setSelectedFile({ pathName: selectedPath, contents: contents });
      // now we have the file contents
    } catch (err) {
      console.error(err);
    }
  };

  // splits file contents line by line

  useEffect(() => {
    const test = async () => {
      return await listen("shell_script_output", (event) => {
        console.log(event);
      });
    };
    const unlisten = test();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center text-white w-screen bg-gray-800">
      <div className="flex flex-col gap-y-4 py-4 px-4">
        {/* <button
          onClick={handleOpenFile}
          className="border border-dashed px-4 py-2 rounded-lg font-medium max-w-[180px] bg-gray-600 border-black"
        >
          Select Config File
        </button> */}

        <div className="flex flex-col items-center">
          <button
            onClick={() => !loading && handleRunScript("test")}
            disabled={loading}
            className="border px-4 py-2 rounded-lg font-medium min-w-[200px] bg-gray-900 hover:bg-gray-900/80 disabled:opacity-50 border-gray-600"
          >
            Run Automate
          </button>
          {automateOutput && <CleanedOutput output={automateOutput} />}
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => !loading && handleRunScript("upload")}
            disabled={loading}
            className="border px-4 py-2 rounded-lg font-medium min-w-[200px] bg-gray-900 hover:bg-gray-900/80 disabled:opacity-50 border-gray-600"
          >
            Run Upload
          </button>
          {uploadOutput && <CleanedOutput output={uploadOutput} />}
        </div>
      </div>
    </main>
  );
}

export default App;
