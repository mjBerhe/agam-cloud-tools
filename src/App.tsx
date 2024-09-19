import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
// import { CleanedOutput } from "./components/cleanedOutput";
import { Button } from "./components/Button";

type Script = "test" | "automate" | "upload" | "remote_run" | "monitor" | "download";

const tabs = [
  {
    name: "Test",
    id: -1,
  },
  {
    name: "Automate",
    id: 0,
  },
  {
    name: "Upload",
    id: 1,
  },
  {
    name: "Remote Run",
    id: 2,
  },
  {
    name: "Monitor",
    id: 3,
  },
  {
    name: "Download",
    id: 4,
  },
];

const scripts: Script[] = [
  "test",
  "automate",
  "upload",
  "remote_run",
  "monitor",
  "download",
];

function App() {
  const [output, setOutput] = useState<string[]>([]);
  const [outputs, setOutputs] = useState({
    test: [],
    automate: [],
    upload: [],
    remote_run: [],
    monitor: [],
    download: [],
  });
  // const [buffer, setBuffer] = useState<string[]>([]);
  // const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState({
    test: false,
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

    scripts.forEach((scriptName) => {
      const unlistenOutput = listen<string>(`script-output-${scriptName}`, (e) => {
        // setOutput((prevOutput) => [...prevOutput, e.payload]);
        setOutputs((prev) => ({
          ...prev,
          [scriptName]: [...prev[scriptName], e.payload],
        }));
        console.log(e.payload);
      });

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, (e) => {
        console.log(e.payload);
        setIsRunning((prev) => ({ ...prev, [scriptName]: false }));
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

  // Clean up the listeners
  // return () => {
  //   scripts.forEach((scriptName) => {
  //     if (unlistenOutput) unlistenOutput.then((fn) => fn());
  //     if (unlistenFinished) unlistenFinished.then((fn) => fn());
  //   });
  // };

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
    <main className="container mx-auto px-4 h-screen">
      <div className="flex flex-col gap-y-4 py-4 w-full items-center">
        {/* <div className="">
          <span className="text-3xl font-bold">Cloud Tools</span>
        </div> */}

        <div className="w-full flex items-center justify-center mt-6">
          <TabGroup className="w-full">
            <TabList className="flex gap-x-4 justify-center">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className="rounded-full py-1 px-3 text-sm font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white"
                >
                  {tab.name}
                </Tab>
              ))}
            </TabList>

            <TabPanels className="mt-3">
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 min-h-[360px] rounded-xl py-4 px-4 break-words ">
                  <div className="flex flex-col">
                    {outputs["test"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button onClick={() => runScript("test")} disabled={isRunning["test"]}>
                    Run Test Script
                  </Button>
                </div>
              </TabPanel>
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 min-h-[360px] rounded-xl py-4 px-4 break-words ">
                  <div className="flex flex-col">
                    {outputs["automate"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button
                    onClick={() => runScript("automate")}
                    disabled={isRunning["automate"]}
                  >
                    Run Automate Script
                  </Button>
                </div>
              </TabPanel>
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 h-[360px] rounded-xl py-4 px-4 break-words] overflow-y-auto">
                  <div className="flex flex-col">
                    {outputs["upload"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button
                    onClick={() => runScript("upload")}
                    disabled={isRunning["upload"]}
                  >
                    Run Upload Script
                  </Button>
                </div>
              </TabPanel>
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 h-[360px] rounded-xl py-4 px-4 break-words] overflow-y-auto">
                  <div className="flex flex-col">
                    {outputs["remote_run"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button
                    onClick={() => runScript("remote_run")}
                    disabled={isRunning["remote_run"]}
                  >
                    Run Remote Run Script
                  </Button>
                </div>
              </TabPanel>
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 h-[360px] rounded-xl py-4 px-4 break-words] overflow-y-auto">
                  <div className="flex flex-col">
                    {outputs["monitor"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button
                    onClick={() => runScript("monitor")}
                    disabled={isRunning["monitor"]}
                  >
                    Run Monitor Script
                  </Button>
                </div>
              </TabPanel>
              <TabPanel className="flex flex-col py-2">
                <div className="bg-white/5 h-[360px] rounded-xl py-4 px-4 break-words] overflow-y-auto">
                  <div className="flex flex-col">
                    {outputs["download"].map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </div>
                </div>
                <div className="flex mt-4 justify-center">
                  <Button
                    onClick={() => runScript("download")}
                    disabled={isRunning["download"]}
                  >
                    Run Download Script
                  </Button>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </main>
  );
}

export default App;
