import type { Script, Tab } from "../App";
import { Button } from "./Button";
import type { Status } from "./Dashboard";

export const ScriptTab: React.FC<{
  tab: Tab;
  output: string[];
  runScript: (sciptName: Script) => void;
  status: Status;
  isDisabled: boolean;
}> = (props) => {
  const { tab, output, runScript, status, isDisabled } = props;

  return (
    <div className="flex flex-col pb-4">
      <div className="bg-white/[5%] h-[360px] rounded-xl py-4 px-4 break-all">
        <div className="flex flex-col divide-y divide-zinc-700 gap-y-2">
          <span className="text-gray-300">
            {status === "Running"
              ? `${tab.name} is Running...`
              : status === "Completed"
              ? `${tab.name} has Completed`
              : status === "Error"
              ? `${tab.name} has errored out`
              : `${tab.name} is Idle`}
          </span>
          <div className="pt-2 flex flex-col text-sm overflow-y-auto h-[300px]">
            {output.map((x, i) => (
              <span key={`${x}-${i}`} className="">
                {x}
              </span>
            ))}
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
