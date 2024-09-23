import { useState } from "react";
import { useSlurmOutputFile } from "../hooks/useSlurmOutputFile";
import { SlurmDisplay } from "./slurmOutput";
import { spawn } from "child_process";

export const OutputTab: React.FC<{ slurmNumber: string }> = ({ slurmNumber }) => {
  const [outputData, setOutputData] = useState("");
  const { slurmData } = useSlurmOutputFile(slurmNumber);

  return (
    <div className="flex flex-col">
      {slurmData && slurmData !== "" ? (
        <SlurmDisplay contents={slurmData} number={slurmNumber} />
      ) : (
        <span>no output file found</span>
      )}
    </div>
  );
};
