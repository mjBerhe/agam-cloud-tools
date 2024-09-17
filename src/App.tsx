import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { readTextFile, readDir, FileEntry } from "@tauri-apps/api/fs";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

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

  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    // Listen for the 'script-output' event
    const unlistenOutput: Promise<UnlistenFn> = listen<string>(
      "script-output",
      (event) => {
        console.log(event.payload);
        setOutput((prevOutput) => [...prevOutput, event.payload]);
      }
    );

    // Listen for the 'script-finished' event
    const unlistenFinished: Promise<UnlistenFn> = listen<string>(
      "script-finished",
      (event) => {
        setIsRunning(false);
        console.log(event.payload);
      }
    );

    // Clean up the listeners
    return () => {
      if (unlistenOutput) unlistenOutput.then((fn) => fn());
      if (unlistenFinished) unlistenFinished.then((fn) => fn());
    };
  }, []);

  const runScript = () => {
    setOutput([]);
    setIsRunning(true);
    // Call the Tauri command to run the shell script
    invoke("run_bash_script_test")
      .then(() => {
        console.log("Shell script started");
      })
      .catch((err) => console.error(err));
  };

  console.log(output, isRunning);

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
            onClick={() => runScript()}
            disabled={isRunning}
            className="border px-4 py-2 rounded-lg font-medium min-w-[200px] bg-gray-900 hover:bg-gray-900/80 disabled:opacity-50 border-gray-600"
          >
            Run Test
          </button>

          <div className="text-white flex flex-col">
            {output.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          {/* {automateOutput && <CleanedOutput output={automateOutput} />} */}
        </div>

        {/* <div className="flex flex-col items-center">
          <button
            onClick={() => !loading && handleRunScript("upload")}
            disabled={loading}
            className="border px-4 py-2 rounded-lg font-medium min-w-[200px] bg-gray-900 hover:bg-gray-900/80 disabled:opacity-50 border-gray-600"
          >
            Run Upload
          </button>
          {uploadOutput && <CleanedOutput output={uploadOutput} />}
        </div> */}
      </div>
    </main>
  );
}

export default App;
