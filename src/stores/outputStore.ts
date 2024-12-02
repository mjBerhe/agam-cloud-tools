import { create } from "zustand";
import { Script } from "../types/scripts";

type OutputStore = {
  outputs: Record<Script, string[]>;
  addOutput: (script: Script, output: string) => void;
  clearOutput: (script: Script) => void;
};

const useOutputStore = create<OutputStore>((set) => ({
  outputs: {
    automate: [],
    upload: [],
    remote_run: [],
    monitor: [],
    monitor_download: [],
    download: [],
    cancel: [],
    output: [],
  },

  addOutput: (script, output) =>
    set((prev) => ({
      outputs: {
        ...prev.outputs,
        [script]: [...prev.outputs[script], output],
      },
    })),

  clearOutput: (script) =>
    set((prev) => ({
      outputs: {
        ...prev.outputs,
        [script]: [],
      },
    })),
}));

export default useOutputStore;
