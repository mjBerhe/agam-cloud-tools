import { useSlurmOutputFile } from "../hooks/useSlurmOutputFile";
import { SlurmDisplay } from "./slurmOutput";

export const OutputTab: React.FC<{ slurmNumber: string }> = ({ slurmNumber }) => {
  const { slurmData } = useSlurmOutputFile(slurmNumber);

  return (
    <div className="flex flex-col text-sm">
      {slurmData && slurmData !== "" ? (
        <SlurmDisplay contents={slurmData} number={slurmNumber} />
      ) : (
        <p>No output file found</p>
      )}
    </div>
  );
};
