import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export const useLogFile = (dependencies: unknown[]) => {
  const [logData, setLogData] = useState<string>("");
  const [slurmNumber, setSlurmNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const regex = /Submitted batch job (\d{7})/g;

  useEffect(() => {
    const fetchLogFile = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_log_file");
        if (data) {
          const matches = [...logData.matchAll(regex)];
          if (matches.length > 0) {
            const lastJobId = matches[matches.length - 1][1];
            setSlurmNumber(lastJobId);
          }
        }
        setLogData(data);
      } catch (err) {
        setError(`Failed to read log file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLogFile();
  }, [...dependencies]);

  return { logData, slurmNumber, error, loading };
};
