import { useState, useEffect } from "react";
import { useOutputStore, useStatusStore } from "../stores";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";

import { cn } from "../utils/styles";
import type { Script } from "../types/scripts";

import ScriptOutput from "../components/scripts/ScriptOutput";
import ConfigEditor from "../components/ConfigEditor";
import SenBatchEditor from "../components/SenBatchEditor";
import Log from "../components/Log";
import SlurmOutput from "../components/SlurmOutput";

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
  "monitor_download",
  "cancel",
];

const scriptPathMap: Record<Script, string> = {
  automate:
    "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/1_Automate.sh",
  upload:
    "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/2_1_Upload.sh",
  remote_run:
    "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/3_RemoteRun.sh",
  monitor_download:
    "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/4_1_Monitor_with_Download.sh",
  cancel:
    "C:/Users/mattberhe/pALM/pALM2.1te/pALMLiability/pALMLauncher/Cloud_Auto/6_Cancel.sh",
};

const isDev = process.env.NODE_ENV === "development";

export default function Root() {
  const { addOutput, clearOutput } = useOutputStore();
  const { status, startScript, completeScript, setError, resetStatus } = useStatusStore();

  const [selectedTab, setSelectedTab] = useState<number>(tabs[0].id);

  const runShellScript = async (scriptName: Script, scriptPathOverride?: string) => {
    try {
      const args = isDev ? { scriptName, scriptPathOverride } : { scriptName };
      return await invoke<string[]>("run_shell_script", args);
    } catch (err) {
      setError(scriptName, `Error executing script "${scriptName}": ${err}`);
    }
  };

  useEffect(() => {
    const unlistenFns: Record<
      string,
      {
        output: Promise<UnlistenFn>;
        error: Promise<UnlistenFn>;
        finished: Promise<UnlistenFn>;
      }
    > = {};

    scripts.forEach((scriptName) => {
      const unlistenOutput = listen<string>(`script-output-${scriptName}`, (e) => {
        addOutput(scriptName, e.payload);

        // add cancel output to the monitor output
        if (scriptName === "cancel") {
          addOutput("monitor_download", e.payload);
        }
      });

      const unlistenError = listen<string>(`script-error-${scriptName}`, (e) => {
        setError(scriptName, e.payload);
      });

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, (e) => {
        // if there was an error, don't complete and reset status
        if (!status[scriptName].error) {
          if (scriptName === "cancel") {
            // do not complete
          } else if (scriptName === "monitor_download") {
            // cancel script is only fully completed once monitor_download finishes
            completeScript("cancel");
            completeScript(scriptName);
          } else if (scriptName === "automate") {
            completeScript(scriptName);
            resetStatus("upload");
            resetStatus("remote_run");
            resetStatus("monitor_download");
          } else {
            completeScript(scriptName);
          }

          // auto trigger monitor_download after remote_run is finished
          if (scriptName === "remote_run") {
            runScript("monitor_download");
          }
        }
      });

      unlistenFns[scriptName] = {
        output: unlistenOutput,
        error: unlistenError,
        finished: unlistenFinished,
      };
    });

    // unlisten each listener event on cleanup
    return () => {
      scripts.forEach((scriptName) => {
        const { output, error, finished } = unlistenFns[scriptName];
        output.then((fn) => fn());
        error.then((fn) => fn());
        finished.then((fn) => fn());
      });
    };
  }, []);

  // whenever we open the app, check monitor_download
  useEffect(() => {
    const checkMonitorDownload = async () => {
      try {
        startScript("monitor_download");
        const response = await runShellScript(
          "monitor_download",
          scriptPathMap["monitor_download"]
        );
        if (response?.find((x) => x === "No Job ID found in log.log.")) {
          resetStatus("monitor_download");
        }
      } catch (err) {
        setError("monitor_download", err as string);
      }
    };

    checkMonitorDownload();
  }, []);

  const runScript = async (script: Script) => {
    clearOutput(script);
    startScript(script);

    runShellScript(script, scriptPathMap[script]);
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
          {selectedTab === 1 && <ConfigEditor />}
          {selectedTab === 2 && <SenBatchEditor />}
          {selectedTab === 3 && <Log />}
          {selectedTab === 4 && <SlurmOutput />}
        </div>
      </div>
    </main>
  );
}
