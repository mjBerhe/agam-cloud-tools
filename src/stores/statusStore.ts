import { create } from "zustand";
import { Script } from "../types/scripts";

type ScriptStatus = {
  isRunning: boolean;
  isCompleted: boolean;
  error: string | null;
};

type StatusStore = {
  status: Record<Script, ScriptStatus>;
  startScript: (script: Script) => void;
  completeScript: (script: Script) => void;
  setError: (script: Script, error: string) => void;
  resetStatus: (script: Script) => void;
};

const useStatusStore = create<StatusStore>((set) => ({
  status: {
    automate: { isRunning: false, isCompleted: false, error: null },
    upload: { isRunning: false, isCompleted: false, error: null },
    remote_run: { isRunning: false, isCompleted: false, error: null },
    monitor: { isRunning: false, isCompleted: false, error: null },
    monitor_download: { isRunning: false, isCompleted: false, error: null },
    download: { isRunning: false, isCompleted: false, error: null },
    cancel: { isRunning: false, isCompleted: false, error: null },
    output: { isRunning: false, isCompleted: false, error: null },
  },

  startScript: (script) =>
    set((state) => ({
      status: {
        ...state.status,
        [script]: { isRunning: true, isCompleted: false, error: null },
      },
    })),

  completeScript: (script) =>
    set((state) => ({
      status: {
        ...state.status,
        [script]: { ...state.status[script], isRunning: false, isCompleted: true },
      },
    })),

  setError: (script, error) =>
    set((state) => ({
      status: {
        ...state.status,
        [script]: {
          ...state.status[script],
          isRunning: false,
          isCompleted: false,
          error,
        },
      },
    })),

  resetStatus: (script) =>
    set((state) => ({
      status: {
        ...state.status,
        [script]: { isRunning: false, isCompleted: false, error: null },
      },
    })),
}));

export default useStatusStore;
