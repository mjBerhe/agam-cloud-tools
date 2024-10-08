import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { isEqual } from "lodash";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import Editor from "@monaco-editor/react";
import { Button } from "./Button";

export const SenBatchEditorTab: React.FC = () => {
  const [initialShellData, setInitialShellData] = useState<string[]>([]);
  const [shellData, setShellData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  useEffect(() => {
    const loadShellFile = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_shell_file");
        setShellData(data);
        setInitialShellData(data.split("\n"));
      } catch (err) {
        setError(`Error loading sen batch file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadShellFile();
  }, []);

  const handleSaveChanges = async () => {
    const split = shellData.split("\n");

    if (split[4] !== initialShellData[4] || split[5] !== initialShellData[5]) {
      setEditorError("Lines 5 or 6 have been modified, please revert those changes");
    } else {
      try {
        await invoke("save_shell_file", { shellData: shellData });
        setInitialShellData(split);
        setIsOpen(true);
      } catch (err) {
        setError(`Error saving file: ${err}`);
      }
    }
  };

  const handleReset = () => {
    setShellData(initialShellData.join("\n"));
  };

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
      <p className="mt-5 text-xl font-semibold text-gray-200">Edit Sen Batch File</p>
      <p className="text-sm text-gray-400 mt-1">
        *DO NOT modify lines 5 or 6 as it will change the slurm output structure
      </p>
      <div className="mt-5">
        <div className="flex flex-col gap-y-1 max-h-[400px] overflow-auto border border-zinc-700 bg-white/[3%] p-4 rounded-lg">
          <Editor
            height="100vh"
            value={shellData}
            onChange={(value) => setShellData(value || "")}
            defaultLanguage="shell"
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="flex mt-5 items-center justify-center gap-x-4">
          <Button
            onClick={handleSaveChanges}
            disabled={isEqual(shellData.split("\n"), initialShellData)}
          >
            Save Changes
          </Button>
          <Button onClick={handleReset} variant={"destructive"}>
            Reset
          </Button>
        </div>

        {editorError && (
          <p className="text-red-400 text-sm text-center mt-2">{editorError}</p>
        )}
      </div>

      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => setIsOpen(false)}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <DialogBackdrop className="fixed inset-0 bg-black/80" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="border border-zinc-700 w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              <DialogTitle as="h3" className="text-lg font-medium text-white">
                Changes Saved!
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-white/50">
                Your Sen_Batch.sh changes have been saved successfully.
              </p>
              <div className="mt-4">
                <Button className="" onClick={() => setIsOpen(false)}>
                  Got it, thanks!
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
