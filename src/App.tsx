import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { readTextFile, readDir, FileEntry } from "@tauri-apps/api/fs";
import { CleanedOutput } from "./components/cleanedOutput";

const testScript = "./src/test.sh";
// const automateScript = "./src/1_Automate.sh";

const automateScript = "automate";

function App() {
  const [selectedFile, setSelectedFile] = useState<{
    pathName: string;
    contents: string;
  }>();

  const [automateOutput, setAutomateOutput] = useState<string>();

  const handleClick = async (script: string) => {
    try {
      if (script === "automate") {
        const result = await invoke("run_bash_script", {
          scriptName: automateScript,
        });
        setAutomateOutput(result as string);
      }
      // console.log(result);
    } catch (err) {
      console.error(err);
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

  return (
    <main className="flex min-h-screen flex-col items-center text-white w-screen bg-gray-800">
      <div className="py-4 px-4">
        {/* <button
          onClick={handleOpenFile}
          className="border border-dashed px-4 py-2 rounded-lg font-medium max-w-[180px] bg-gray-600 border-black"
        >
          Select Config File
        </button> */}

        <button onClick={() => handleClick("automate")}>Run Automate Script</button>

        {automateOutput && <CleanedOutput output={automateOutput} />}
      </div>
    </main>
  );
}

export default App;
