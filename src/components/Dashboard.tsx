import { cn } from "../lib/utils";
import { Check, X } from "lucide-react";
import type { Script } from "../App";

export type Status = "Checking" | "Running" | "Idle" | "Error" | "Completed" | "Ready";

export const Dashboard: React.FC<{
  overallStatus: Status;
  runningStatus: Record<Script, boolean>;
  completedStatus: Record<Script, boolean>;
  errorStatus: Record<Script, string | null>;
  selectedScript: string;
}> = (props) => {
  const { overallStatus, runningStatus, completedStatus, errorStatus, selectedScript } =
    props;

  // logic for finding current status of a script
  const checkScriptStatus = (scriptName: Script): Status => {
    if (runningStatus[scriptName]) return "Running";
    if (completedStatus[scriptName]) return "Completed";
    if (errorStatus[scriptName]) return "Error";
    if (scriptName === "automate" && !completedStatus["upload"]) return "Ready";
    if (
      scriptName === "upload" &&
      completedStatus["automate"] &&
      !completedStatus["remote_run"]
    )
      return "Ready";
    if (
      scriptName === "remote_run" &&
      completedStatus["upload"] &&
      !completedStatus["download"]
    )
      return "Ready";
    if (
      scriptName === "download" &&
      completedStatus["remote_run"] &&
      !completedStatus["output"]
    )
      return "Ready";
    if (scriptName === "output" && completedStatus["download"]) return "Ready";
    return "Idle";
  };

  const isSomethingRunning = Object.values(runningStatus).includes(true);
  const isSomethingErrored = Object.values(errorStatus).some(
    (x) => x !== null && x !== ""
  );

  // logic for finding current status of the application
  const currentStatus = isSomethingRunning ? (
    <p className="text-green-400">Running</p>
  ) : isSomethingErrored ? (
    <p className="text-red-400"></p>
  ) : (
    <p className="text-white">
      {completedStatus["monitor"] && !completedStatus["automate"]
        ? "Ready to Automate"
        : completedStatus["automate"] && !completedStatus["upload"]
        ? "Ready to Upload"
        : completedStatus["upload"] && !completedStatus["remote_run"]
        ? "Ready to Remote Run"
        : completedStatus["remote_run"] && !completedStatus["download"]
        ? "Ready to Download"
        : completedStatus["download"] && !completedStatus["output"]
        ? "Output Ready"
        : "Idle"}
    </p>
  );

  const scripts = Object.keys(runningStatus) as Script[];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center border-b pb-1 border-zinc-700">
        <p className="text-gray-200">Status</p>
        <p className="font-medium">{currentStatus}</p>
      </div>

      <div className="mt-5">
        {scripts.map((scriptName, i) => (
          <div
            className={cn(
              "flex justify-between items-center py-2 px-2 hover:bg-white/[5%] text-sm",
              selectedScript === scriptName && "bg-white/[8%]"
            )}
            key={scriptName}
          >
            {checkScriptStatus(scriptName) === "Running" ? (
              <div className="flex justify-between w-full">
                <div className="flex gap-1 items-center">
                  <Loader />
                  <p>{scriptName}</p>
                </div>
                <p className="text-white">Running</p>
              </div>
            ) : checkScriptStatus(scriptName) === "Completed" ? (
              <div className="flex justify-between w-full">
                <div className="flex gap-1 items-center">
                  <Check className="text-green-400 h-4 w-4" />
                  <p>{scriptName}</p>
                </div>
                <p className="text-green-400">Completed</p>
              </div>
            ) : checkScriptStatus(scriptName) === "Error" ? (
              <div className="flex justify-between w-full">
                <div className="flex gap-1 items-center">
                  <X className="text-red-400 h-4 w-4" />
                  <p>{scriptName}</p>
                </div>
                <p className="text-red-400">Error</p>
              </div>
            ) : checkScriptStatus(scriptName) === "Ready" ? (
              <div className="flex justify-between w-full">
                <div className="flex gap-1 items-center">
                  <div className="h-4 w-4" />
                  <p>{scriptName}</p>
                </div>
                <p className="text-white-400">Ready</p>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <div className="flex gap-1 items-center">
                  <div className="h-4 w-4" />
                  <p>{scriptName}</p>
                </div>
                <p className="text-white-400">Idle</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Loader: React.FC = () => {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500"
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
  );
};
