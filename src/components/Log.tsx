import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { Editor } from "@monaco-editor/react";

export const Log: React.FC = () => {
  const [logData, setLogData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogFile = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_log_file");
        setLogData(data);
      } catch (err) {
        setError(`Failed to read log file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadLogFile();
  }, []);

  if (loading)
    return (
      <div className="mt-5 border border-zinc-700 bg-white/[3%] p-4 rounded-lg">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="mt-5 border border-zinc-700 bg-white/[3%] p-4 rounded-lg text-sm text-red-300">
        {error}
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full">
      <p className="mt-5 text-xl font-semibold text-gray-200">Read Log File</p>
      <div className="mt-5">
        <div className="flex flex-col max-h-[400px] bg-white/[3%] p-4 rounded-lg border border-zinc-700">
          <Editor
            height="100vh"
            value={logData}
            defaultLanguage="json"
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};
