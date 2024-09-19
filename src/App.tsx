import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
// import { CleanedOutput } from "./components/cleanedOutput";
import { ScriptTab } from "./components/ScriptTab";
import { Dashboard } from "./components/Dashboard";
import { cn } from "./lib/utils";

export type Script =
  | "test"
  | "automate"
  | "upload"
  | "remote_run"
  | "monitor"
  | "download";
export type Tab = {
  name: string;
  scriptName: Script;
  id: number;
};

const tabs: Tab[] = [
  {
    name: "Automate",
    scriptName: "automate",
    id: 0,
  },
  {
    name: "Upload",
    scriptName: "upload",
    id: 1,
  },
  {
    name: "Remote Run",
    scriptName: "remote_run",
    id: 2,
  },
  {
    name: "Monitor",
    scriptName: "monitor",
    id: 3,
  },
  {
    name: "Download",
    scriptName: "download",
    id: 4,
  },
];

const scripts: Script[] = [
  "test",
  "automate",
  "upload",
  "remote_run",
  // "monitor",
  "download",
];

function App() {
  const [outputs, setOutputs] = useState({
    test: [],
    automate: [],
    upload: [],
    remote_run: [],
    monitor: [],
    download: [],
  });
  const [isRunning, setIsRunning] = useState<{ [key: string]: boolean }>({
    automate: false,
    upload: false,
    remote_run: false,
    monitor: false,
    download: false,
  });
  const [isCompleted, setIsCompleted] = useState<{ [key: string]: boolean }>({
    automate: false,
    upload: false,
    remote_run: false,
    monitor: false,
    download: false,
  });

  useEffect(() => {
    const unlistenFns: Record<
      string,
      { output: Promise<UnlistenFn>; finished: Promise<UnlistenFn> }
    > = {};

    // loop over each script, and create a listener events for incoming output and a finish message
    scripts.forEach((scriptName) => {
      const unlistenOutput = listen<string>(`script-output-${scriptName}`, (e) => {
        setOutputs((prev) => ({
          ...prev,
          [scriptName]: [...prev[scriptName], e.payload],
        }));
      });

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, (e) => {
        console.log(e.payload);
        setIsRunning((prev) => ({ ...prev, [scriptName]: false }));
        setIsCompleted((prev) => ({ ...prev, [scriptName]: true }));
      });

      unlistenFns[scriptName] = { output: unlistenOutput, finished: unlistenFinished };
    });

    // Cleanup function
    return () => {
      scripts.forEach((scriptName) => {
        // Unlisten to each event
        const { output, finished } = unlistenFns[scriptName];
        output.then((fn) => fn());
        finished.then((fn) => fn());
      });
    };
  }, []);

  const runScript = (scriptName: Script) => {
    setOutputs((prev) => ({ ...prev, [scriptName]: [] })); // Clear output for the script
    setIsRunning((prev) => ({ ...prev, [scriptName]: true }));

    // Call the Tauri command to run the shell script
    invoke("run_bash_script_test", { scriptName: scriptName })
      .then(() => {
        console.log(`$${scriptName} script started`);
      })
      .catch((err) => console.error(err));
  };

  return (
    <main className={cn("container mx-auto px-4 h-screen font-geist")}>
      <div className="flex py-4 w-full gap-x-6">
        <div className="flex flex-col h-full w-1/3 flex-shrink-0">
          <span className="mt-5 text-xl font-semibold text-gray-200">Overview</span>
          <div className="mt-5 bg-white/[3%] p-4 rounded-lg border border-zinc-700">
            <Dashboard runningStatus={isRunning} completedStatus={isCompleted} />
          </div>
        </div>

        <div className="flex flex-col justify-center w-2/3">
          <span className="mt-5 text-xl font-semibold text-gray-200">Scripts</span>
          <div className="mt-5 bg-white/[3%] rounded-lg border border-zinc-700">
            <TabGroup className="w-full">
              <TabList className="pt-1 w-full px-2">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    className={cn(
                      "w-1/5 rounded-t-lg bg-white/[1%] px-4 py-2 text-sm font-medium cursor-pointer transition duration-100",
                      "data-[selected]:bg-white/[5%] data-[hover]:bg-white/5 text-gray-300 data-[selected]:text-white",
                      "focus:outline-none"
                    )}
                  >
                    {tab.name}
                  </Tab>
                ))}
              </TabList>

              <TabPanels className="mt-0">
                {/* <TabPanel>
                <Dashboard />
              </TabPanel> */}

                {tabs.map((tab) => (
                  <TabPanel className="pt-0" key={tab.id}>
                    <ScriptTab
                      tab={tab}
                      output={outputs[tab.scriptName]}
                      runScript={runScript}
                      isDisabled={isRunning[tab.scriptName]}
                    />
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
