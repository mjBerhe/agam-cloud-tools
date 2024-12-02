import { useState, useEffect } from "react";
import { useOutputStore, useStatusStore } from "../stores";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import type { Script } from "../types/scripts";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

const tabs = ["Cloud Tools", "Config File", "Sen Batch File", "Log File", "Output Slurm"];

const scripts: Script[] = [
  "automate",
  "upload",
  "remote_run",
  "monitor",
  "monitor_download",
  "cancel",
  "output",
];

export default function Root() {
  const { outputs, addOutput, clearOutput } = useOutputStore();
  const { status, startScript, completeScript, resetStatus, setError } = useStatusStore();

  // loop over each script (EXCLUDING MONITOR) and create listener events for incoming output and a finish message
  useEffect(() => {
    const unlistenFns: Record<
      string,
      { output: Promise<UnlistenFn>; finished: Promise<UnlistenFn> }
    > = {};

    scripts.forEach((scriptName) => {
      const unlistenOutput = listen<string>(`script-output-${scriptName}`, (e) => {
        addOutput(scriptName, e.payload);

        // add cancel output to the monitor output
        if (scriptName === "cancel") {
          addOutput("monitor", e.payload);
        }
      });

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, (e) => {
        completeScript(scriptName);
        // if (scriptName === "cancel") {
        //   console.log(e.payload);
        //   setIsRunning((prev) => ({ ...prev, cancel: false }));
        //   setIsCompleted((prev) => ({
        //     ...prev,
        //     remote_run: false,
        //     upload: false,
        //     cancel: true,
        //   }));
        // } else if (scriptName !== "remote_run") {
        //   console.log(e.payload);
        //   setIsRunning((prev) => ({ ...prev, [scriptName]: false }));
        //   setIsCompleted((prev) => ({ ...prev, [scriptName]: true }));
        // }
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

  return (
    <main className="container mx-auto min-h-screen">
      <div className="py-8 flex flex-col justify-center px-2">
        <TabGroup className="">
          <TabList className="flex gap-x-4">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className="rounded-full py-1 px-3 text-sm/6 font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white"
              >
                {tab}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            <TabPanel>
              <div></div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </main>
  );
}
