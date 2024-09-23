import { useEffect, useRef } from "react";
import type { Script, Tab } from "../App";
import { Button } from "./Button";
import type { Status } from "./Dashboard";

export const ScriptTab: React.FC<{
  tab: Tab;
  output: string[];
  logData?: string;
  runScript: (sciptName: Script) => void;
  status: Status;
  isDisabled: boolean;
}> = (props) => {
  const { tab, output, logData, runScript, status, isDisabled } = props;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [output]);

  return (
    <div className="flex flex-col pb-4">
      <div className="bg-white/[5%] h-[360px] rounded-xl py-4 px-4 break-all">
        <div className="flex flex-col divide-y divide-zinc-700 gap-y-2">
          <p className="text-gray-100 font-medium text-lg">
            {status === "Running"
              ? `${tab.name} is Running...`
              : status === "Completed"
              ? `${tab.name} has Completed`
              : status === "Error"
              ? `${tab.name} has errored out`
              : `${tab.name} is Idle`}
          </p>
          <div className="pt-2 flex flex-col text-sm overflow-y-auto h-[300px] text-gray-300">
            {output.map((x, i) => (
              <p key={`${x}-${i}`} className="">
                {x}
              </p>
            ))}
            <div ref={bottomRef}></div>
          </div>
        </div>
      </div>
      <div className="flex mt-4 justify-center">
        <Button onClick={() => runScript(tab.scriptName)} disabled={isDisabled}>
          Run {tab.name} Script
        </Button>
      </div>
    </div>
  );
};
