import { invoke } from "@tauri-apps/api";
import { useState, useEffect } from "react";

export const useSlurmOutputFile = (slurmNumber: string) => {
  const [slurmData, setSlurmData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlurmOutput = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_slurm_file", {
          folderPath: "",
          fileName: slurmNumber,
        });
        setSlurmData(data);
      } catch (err) {
        setError(`Failed to read slurm file: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSlurmOutput();
  }, [slurmNumber]);

  return { slurmData, error, loading };
};
