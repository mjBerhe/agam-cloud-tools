import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import { invoke } from "@tauri-apps/api";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { cn } from "./lib/utils";
import { useLogFile } from "./hooks/useLogFile";
import { useSlurmOutputFile } from "./hooks/useSlurmOutputFile";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Button } from "./components/Button";
import { ScriptTab } from "./components/ScriptTab";
import { Dashboard, Status } from "./components/Dashboard";
import { OutputTab } from "./components/OutputTab";
import { Log } from "./components/Log";
import { JsonEditorTab } from "./components/JsonEditorTab";
import { SenBatchEditorTab } from "./components/SenBatchEditorTab";

export type Script =
  | "automate"
  | "upload"
  | "remote_run"
  | "monitor"
  | "download"
  | "cancel"
  | "output";
export type Tab = {
  name: string;
  scriptName: Script;
  id: number;
};

const tabs: Tab[] = [
  {
    name: "Monitor",
    scriptName: "monitor",
    id: 0,
  },
  {
    name: "Automate",
    scriptName: "automate",
    id: 1,
  },
  {
    name: "Upload",
    scriptName: "upload",
    id: 2,
  },
  {
    name: "Remote Run",
    scriptName: "remote_run",
    id: 3,
  },
  {
    name: "Download",
    scriptName: "download",
    id: 4,
  },
];

const scripts: Script[] = [
  "automate",
  "upload",
  "remote_run",
  // "monitor",
  "download",
  "output",
];

function App() {
  const [outputs, setOutputs] = useState<Record<Script, string[]>>({
    monitor: [],
    automate: [],
    upload: [],
    remote_run: [],
    download: [],
    cancel: [],
    output: [],
  });
  const [isRunning, setIsRunning] = useState<Record<Script, boolean>>({
    monitor: false,
    automate: false,
    upload: false,
    remote_run: false,
    download: false,
    cancel: false,
    output: false,
  });
  const [isCompleted, setIsCompleted] = useState<Record<Script, boolean>>({
    monitor: false,
    automate: false,
    upload: false,
    remote_run: false,
    download: false,
    cancel: false,
    output: false,
  });
  const [errors, setErrors] = useState<Record<Script, string | null>>({
    monitor: null,
    automate: null,
    upload: null,
    remote_run: null,
    download: null,
    cancel: null,
    output: null,
  });

  const [selectedTab, setSelectedTab] = useState<Script>("monitor");
  const [isMonitorListenerReady, setIsMonitorListenerReady] = useState<boolean>(false);
  const [monitorOutput, setMonitorOutput] = useState<string[]>([]);
  const [overallStatus, setOverallStatus] = useState<Status>("Checking");

  const isAnyScriptRunning = Object.values(isRunning).includes(true);

  const isRemoteRunDisabled =
    isCompleted["remote_run"] ||
    isRunning["remote_run"] ||
    isRunning["monitor"] ||
    !isCompleted["upload"];
  const isDownloadDisabled =
    isCompleted["download"] || !isCompleted["remote_run"] || isRunning["download"];

  // hook to get current log.log file
  // TODO: need to edit path param
  const { logData, slurmNumber } = useLogFile([
    isCompleted["automate"],
    isCompleted["monitor"],
  ]);
  const { slurmData } = useSlurmOutputFile(slurmNumber);

  // checking log file to find where we currently are
  if (logData.includes("Bash files generated") && isCompleted["automate"] === false) {
    setIsCompleted((prev) => ({ ...prev, automate: true }));
  }
  if (slurmData && slurmData !== "" && isCompleted["download"] === false) {
    setIsCompleted((prev) => ({ ...prev, download: true }));
  }

  // loop over each script, and create listener events for incoming output and a finish message
  // purposely not going over monitor script as it has its own seperate logic
  useEffect(() => {
    const unlistenFns: Record<
      string,
      { output: Promise<UnlistenFn>; finished: Promise<UnlistenFn> }
    > = {};

    scripts.forEach((scriptName) => {
      const unlistenOutput = listen<string>(`script-output-${scriptName}`, (e) => {
        setOutputs((prev) => ({
          ...prev,
          [scriptName]: [...prev[scriptName], e.payload],
        }));
      });

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, (e) => {
        console.log(e.payload);
        if (scriptName !== "remote_run") {
          setIsRunning((prev) => ({ ...prev, [scriptName]: false }));
          setIsCompleted((prev) => ({ ...prev, [scriptName]: true }));
        }
      });

      unlistenFns[scriptName] = { output: unlistenOutput, finished: unlistenFinished };
    });

    // unlisten each listener event on cleanup
    return () => {
      scripts.forEach((scriptName) => {
        const { output, finished } = unlistenFns[scriptName];
        output.then((fn) => fn());
        finished.then((fn) => fn());
      });
    };
  }, []);

  // setting up my monitor listener event and custom logic
  useEffect(() => {
    let unlistenOutput: UnlistenFn;
    let unlistenFinished: UnlistenFn;

    const setupMonitorListener = async () => {
      try {
        unlistenOutput = await listen<string>("script-output-monitor", (e) => {
          setMonitorOutput((prev) => [...prev, e.payload]);
          const output = readMonitorOutputLine(e.payload);
          if (output) {
            const { status, stage } = output;
            if (stage === 2) {
              setIsCompleted((prev) => ({
                ...prev,
                automate: true,
                upload: true,
              }));
              setIsRunning((prev) => ({
                ...prev,
                remote_run: true,
              }));
            }
            if (stage === 3) {
              setIsCompleted((prev) => ({
                ...prev,
                automate: true,
                upload: true,
                remote_run: true,
              }));
              setIsRunning((prev) => ({
                ...prev,
                remote_run: false,
              }));
            }
            // only update current status if there is a change
            setOverallStatus((prev) => {
              if (prev !== status) {
                return status;
              }
              return prev;
            });
          }
        });
        setIsMonitorListenerReady(true);

        unlistenFinished = await listen<string>("script-finished-monitor", () => {
          setIsRunning((prev) => ({ ...prev, monitor: false }));
          setIsCompleted((prev) => ({ ...prev, monitor: true }));
        });
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          monitor: err as string,
        }));
        console.error(err);
      }
    };

    setupMonitorListener();

    return () => {
      if (unlistenOutput) unlistenOutput();
      if (unlistenFinished) unlistenFinished();
    };
  }, []);

  useEffect(() => {
    if (isMonitorListenerReady) {
      setMonitorOutput([]);
      setIsRunning((prev) => ({ ...prev, monitor: true }));

      invoke("run_bash_script_test", { scriptName: "monitor" })
        .then(() => {
          console.log(`monitor script started`);
        })
        .catch((err) => {
          setErrors((prev) => ({
            ...prev,
            monitor: err,
          }));
          setIsRunning((prev) => ({
            ...prev,
            monitor: false,
          }));
          console.error(err);
        });
    }
  }, [isMonitorListenerReady]);

  const runScript = (scriptName: Script) => {
    setOutputs((prev) => ({ ...prev, [scriptName]: [] })); // clear output for the script
    if (scriptName === "monitor") setMonitorOutput([]); // clear output for monitor specifically
    setIsRunning((prev) => ({ ...prev, [scriptName]: true }));

    // Call the Tauri command to run the shell script
    invoke("run_bash_script_test", { scriptName: scriptName })
      .then(() => {
        // run monitor script directly after remote_run
        if (scriptName === "remote_run") {
          runScript("monitor");
        }
      })
      .catch((err) => {
        console.error(err);
        setIsRunning((prev) => ({ ...prev, [scriptName]: false }));
        setErrors((prev) => ({ ...prev, [scriptName]: err }));
      });
  };

  const cancelAllJobs = () => {
    try {
      invoke("run_bash_script_test", { scriptName: "cancel" });
    } catch (err) {
      if (typeof err === "string") {
        setErrors((prev) => ({ ...prev, cancel: err }));
      } else {
        console.error(err);
      }
    }
  };

  return (
    <main className={cn("container mx-auto px-4 h-screen font-geist")}>
      <TabGroup className="mt-4 pb-12">
        <TabList className="flex gap-x-4">
          <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
            Cloud Tools
          </Tab>
          <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
            Log File
          </Tab>
          <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
            Output Slurm
          </Tab>
          <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
            Config File
          </Tab>
          <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white">
            Sen Batch File
          </Tab>
        </TabList>
        <TabPanels className="px-2">
          <TabPanel>
            <div className="flex w-full gap-x-6">
              <div className="flex flex-col h-full w-1/3">
                <p className="mt-5 text-xl font-semibold text-gray-200">Overview</p>
                <div className="mt-5 bg-white/[3%] p-4 rounded-lg border border-zinc-700">
                  <Dashboard
                    overallStatus={overallStatus}
                    runningStatus={isRunning}
                    completedStatus={isCompleted}
                    selectedScript={selectedTab}
                    errorStatus={errors}
                  />
                </div>

                <div className="mt-4 w-full flex">
                  <Button
                    className="w-full"
                    variant={"destructive"}
                    disabled={
                      !(isRunning["remote_run"] && isRunning["monitor"]) ||
                      isRunning["cancel"]
                    }
                    onClick={cancelAllJobs}
                  >
                    Cancel All Jobs
                  </Button>
                </div>
              </div>

              <div className="flex flex-col justify-center w-2/3">
                <p className="mt-5 text-xl font-semibold text-gray-200">Scripts</p>
                <div className="mt-5 bg-white/[3%] rounded-lg border border-zinc-700">
                  <TabGroup
                    onChange={(i) => setSelectedTab(tabs[i].scriptName)}
                    className="w-full"
                  >
                    <TabList className="pt-1 w-full px-2">
                      {tabs.map((tab) => (
                        <Tab
                          key={tab.id}
                          className={cn(
                            "w-1/5 rounded-t-lg bg-white/[1%] px-2 py-2 text-sm font-medium cursor-pointer transition duration-100",
                            "data-[selected]:bg-white/[5%] data-[hover]:bg-white/5 text-gray-300 data-[selected]:text-white",
                            "focus:outline-none"
                          )}
                        >
                          {tab.name}
                        </Tab>
                      ))}
                    </TabList>

                    <TabPanels className="mt-0">
                      {tabs.map((tab) => (
                        <TabPanel className="pt-0" key={tab.id}>
                          <ScriptTab
                            tab={tab}
                            output={
                              tab.scriptName === "monitor"
                                ? monitorOutput
                                : outputs[tab.scriptName]
                            }
                            status={
                              isRunning[tab.scriptName]
                                ? "Running"
                                : isCompleted[tab.scriptName]
                                ? "Completed"
                                : errors[tab.scriptName]
                                ? "Error"
                                : "Idle"
                            }
                            runScript={runScript}
                            isDisabled={
                              tab.scriptName === "upload"
                                ? isCompleted["upload"] ||
                                  isRunning["upload"] ||
                                  isAnyScriptRunning
                                : tab.scriptName === "remote_run"
                                ? isRemoteRunDisabled
                                : tab.scriptName === "download"
                                ? isDownloadDisabled
                                : isRunning[tab.scriptName] || isAnyScriptRunning
                            }
                          />
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </TabGroup>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="flex flex-col h-full w-full">
              <p className="mt-5 text-xl font-semibold text-gray-200">Log</p>
              <div className="mt-5 bg-white/[3%] p-4 rounded-lg border border-zinc-700">
                <Log logData={logData} />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="flex flex-col h-full w-full">
              <p className="mt-5 text-xl font-semibold text-gray-200">Output</p>
              <div className="mt-5 bg-white/[3%] p-4 rounded-lg border border-zinc-700">
                <OutputTab slurmNumber={slurmNumber} />
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <JsonEditorTab />
          </TabPanel>
          <TabPanel>
            <SenBatchEditorTab />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* <div className="flex flex-col gap-y-2 pb-12"></div> */}
    </main>
  );
}

export default App;

// stage represents where in the process we are
// 0 = nothing is completed
// 1 = automate completed
// 2 = upload completed?? --> TODO
// 3 = remote_run completed

const readMonitorOutputLine = (
  line: string
): { status: Status; stage: number } | undefined => {
  let stage: number = 0;
  let status: Status = "Idle";

  if (
    line.includes(
      "-----------------------------------------------------------------------"
    )
  ) {
    return;
  }

  if (line.includes("No Job ID found in log.log")) {
    status = "Idle";
    stage = 1;
  }
  if (
    line.includes("Status: RUNNING") ||
    line.includes("There are currently") ||
    line.includes("has been lasting for")
  ) {
    status = "Running";
    stage = 2;
  }
  // TODO
  // if monitor returns this, we are ready to download OR download is down
  // we could actually check this with the outputSlurm file and match the job id to the slurm to see that we are done downloading
  if (line.includes("has finished or does not exist. Status: .")) {
    status = "Completed";
    stage = 3;
  }

  return { status, stage };
};
