export const Log: React.FC<{ logData?: string }> = ({ logData }) => {
  return (
    <div className="flex flex-col text-sm overflow-y-auto text-gray-300">
      {logData
        ? logData.split("\n").map((line, i) => <p key={i}>{line}</p>)
        : "No log file found"}
    </div>
  );
};
