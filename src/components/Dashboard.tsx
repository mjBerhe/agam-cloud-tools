import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { cn } from "../lib/utils";
import { Check } from "lucide-react";

type Status = "Checking" | "Running" | "Idle" | "Completed";

export const Dashboard: React.FC<{
  runningStatus: { [key: string]: boolean };
  completedStatus: { [key: string]: boolean };
}> = (props) => {
  const { runningStatus, completedStatus } = props;
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<Status>("Checking");
  // console.log(isRunning);
  const currentStatus: Status = Object.values(runningStatus).includes(true)
    ? "Running"
    : status;

  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) {
      setIsRunning(true);
      // Call the Tauri command to run the shell script
      invoke("run_bash_script_test", { scriptName: "monitor" })
        .then(() => {
          console.log(`monitor script started`);
        })
        .catch((err) => console.error(err));
    }

    const unlistenOutput = listen<string>("script-output-monitor", (e) => {
      console.log(e.payload);
      readMonitorOutputLine(e.payload);
      setOutput((prev) => [...prev, e.payload]);
    });

    const unlistenFinished = listen<string>("script-finished-monitor", (e) => {
      console.log(e.payload);
      setIsRunning(false);
    });

    return () => {
      console.log("dismount?");
      unlistenOutput.then((fn) => fn());
      unlistenFinished.then((fn) => fn());
    };
  }, []);

  const readMonitorOutputLine = (line: string) => {
    if (line.includes("has finished or does not exist. Status: .")) {
      setStatus("Completed");
    }
    if (line.includes("No Job ID found in log.log")) {
      setStatus("Idle");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center border-b pb-1 border-zinc-700">
        <span className="text-gray-200">Current Status:</span>{" "}
        <span
          className={cn(
            "font-bold text-lg",
            currentStatus === "Idle" ? "text-green-400" : ""
          )}
        >
          {currentStatus}
        </span>
      </div>

      <div className="mt-4">
        {Object.keys(runningStatus).map((scriptName, i) => (
          <div
            className={cn(
              "flex justify-between items-center py-2 px-2 hover:bg-white/[5%]",
              i % 2 === 1 ? "" : "bg-white/[1%]"
            )}
          >
            {runningStatus[scriptName] ? (
              <div className="flex items-center gap-x-2">
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span>{scriptName}</span>
              </div>
            ) : completedStatus[scriptName] ? (
              <div className="flex items-center gap-x-1">
                <Check className="text-green-400" />
                {scriptName}
              </div>
            ) : (
              <span>{scriptName}</span>
            )}
            <span>
              {runningStatus[scriptName] ? (
                <span>Running</span>
              ) : completedStatus[scriptName] ? (
                <span className="text-green-400">Completed</span>
              ) : (
                <span className="text-gray-300">Idle</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
