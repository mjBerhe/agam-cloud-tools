import { useState, useEffect } from "react";
import { useOutputStore, useStatusStore } from "../stores";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
// import { TextShimmer } from '@/components/core/text-shimmer';

// export function TextShimmerBasic() {
//   return (
//     <TextShimmer className="font-mono text-sm" duration={1}>
//       Generating code...
//     </TextShimmer>
//   );
// }

import { cn } from "../utils/styles";
import { motion } from "framer-motion";
import type { Script } from "../types/scripts";

import ScriptOutput from "../components/scripts/ScriptOutput";
import ConfigEditor from "../components/ConfigEditor";
import SenBatchEditor from "../components/SenBatchEditor";
import Log from "../components/Log";
import SlurmOutput from "../components/SlurmOutput";

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
  const { addOutput, clearOutput } = useOutputStore();
  const { startScript, completeScript, setError, resetStatus } = useStatusStore();

  const [selectedTab, setSelectedTab] = useState<number>(tabs[0].id);

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

      const unlistenFinished = listen<string>(`script-finished-${scriptName}`, () => {
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

  useEffect(() => {
    const checkMonitorDownload = async () => {
      try {
        startScript("monitor_download");
        const response = await invoke<string[]>("run_bash_script_test", {
          scriptName: "monitor_download",
        });
        if (response.find((x) => x === "No Job ID found in log.log.")) {
          resetStatus("monitor_download");
        }
        // console.log(response);
      } catch (err) {
        setError("monitor_download", err as string);
      }
    };

    checkMonitorDownload();
  }, []);

  const runScript = async (script: Script) => {
    clearOutput(script);
    startScript(script);

    try {
      await invoke("run_bash_script_test", { scriptName: script });
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
          {selectedTab === 1 && <ConfigEditor />}
          {selectedTab === 2 && <SenBatchEditor />}
          {selectedTab === 3 && <Log />}
          {selectedTab === 4 && <SlurmOutput />}
        </div>
      </div>
    </main>
  );
}
