import type { Script, Tab } from "../App";
import { Button } from "./Button";

export const ScriptTab: React.FC<{
  tab: Tab;
  output: string[];
  runScript: (sciptName: Script) => void;
  isDisabled: boolean;
}> = (props) => {
  const { tab, output, runScript, isDisabled } = props;

  return (
    <div className="flex flex-col">
      <div className="bg-white/[5%] h-[360px] rounded-xl py-4 px-4 break-all overflow-y-auto">
        <div className="flex flex-col">
          {output.map((x) => (
            <span key={x} className="text-sm">
              {x}
            </span>
          ))}
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
