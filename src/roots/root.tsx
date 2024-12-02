import { useState, useEffect } from "react";
import { useOutputStore, useStatusStore } from "../stores";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { cn } from "../utils/styles";
import { motion } from "framer-motion";
import type { Script } from "../types/scripts";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import ScriptOutput from "../components/scripts/ScriptOutput";

// const tabs = ["Cloud Tools", "Config File", "Sen Batch File", "Log File", "Output Slurm"];
const tabs = [
  { id: 0, label: "Cloud Tools" },
  { id: 1, label: "Config File" },
  { id: 2, label: "Sen Batch File" },
  { id: 3, label: "Log File" },
  { id: 4, label: "Output Slurm" },
];

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

  const [selectedTab, setSelectedTab] = useState<number>(tabs[0].id);

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

  const runScript = async (script: Script) => {
    clearOutput(script);
    startScript(script);

    try {
      const run = await invoke("run_bash_script_test", { scriptName: script });
    } catch (err) {
      // do we need to complete if errored?
      setError(script, err as string);
    }
  };

  return (
    <main className="container mx-auto min-h-screen">
      <div className="flex flex-col">
        <div className="pt-8 flex space-x-2 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                selectedTab === tab.id ? "" : "hover:text-white/60",
                "relative rounded-full px-3 py-1.5 text-sm/6 font-light text-white outline-sky-400 transition focus-visible:outline-2"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {selectedTab === tab.id && (
                <motion.span
                  layoutId="bubble"
                  className="absolute inset-0 z-10 bg-blue-50 mix-blend-difference"
                  style={{ borderRadius: 9999 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {selectedTab === 0 && <ScriptOutput runScript={runScript} />}
        </div>
      </div>
    </main>
  );
}
