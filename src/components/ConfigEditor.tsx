import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { isEqual } from "lodash";

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";
import Editor from "@monaco-editor/react";
import { Button } from "./ui/Button";

const ConfigEditor: React.FC = () => {
  const [initialJsonConfigData, setInitialJsonConfigData] = useState<string>("");
  const [jsonConfigData, setJsonConfigData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  useEffect(() => {
    const loadJsonFile = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_json_file");
        // const parsed = JSON.parse(data);
        setJsonConfigData(data);
        setInitialJsonConfigData(data);
      } catch (err) {
        setError(`Error loading json config file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    loadJsonFile();
  }, []);

  // TODO: show error when changing remote_system_path_check

  const saveJsonConfigFile = async () => {
    const split = jsonConfigData.split("\n");

    if (split[4] !== initialJsonConfigData.split("\n")[4]) {
      setEditorError(
        "remote_system_path_check has been modified, please revert those changes"
      );
    } else {
      try {
        await invoke("save_json_file", {
          // jsonData: JSON.stringify(jsonConfigData),
          jsonData: jsonConfigData,
        });
        setInitialJsonConfigData(jsonConfigData);
        setIsOpen(true);
      } catch (err) {
        setError(`Error saving file: ${err}`);
      }
    }
  };

  const handleReset = () => {
    setJsonConfigData(initialJsonConfigData);
  };

  if (loading)
    return (
      <div className="border border-dark-600 bg-dark-700 p-4 rounded-lg">Loading...</div>
    );
  if (error)
    return (
      <div className="border border-dark-600 bg-dark-700 p-4 rounded-lg text-sm text-red-300">
        {error}
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full">
      <p className="text-xl font-semibold">Edit Config File</p>
      <p className="text-sm/6 text-gray-400">
        *DO NOT modify the remote_system_path_check (line 5)
      </p>

      <div className="mt-5">
        <div className="flex flex-col gap-y-1 max-h-[400px] overflow-auto border border-dark-600 bg-dark-700 p-4 rounded-lg">
          <Editor
            height="100vh"
            value={jsonConfigData}
            onChange={(value) => setJsonConfigData(value || "")}
            defaultLanguage="json"
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="flex w-full justify-center mt-4 gap-x-4">
          <Button
            disabled={isEqual(jsonConfigData, initialJsonConfigData)}
            onClick={saveJsonConfigFile}
            className=""
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
                className="border border-dark-600 w-full max-w-md rounded-xl bg-dark-700 p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
              >
                <DialogTitle as="h3" className="text-lg font-medium text-white">
                  Changes Saved!
                </DialogTitle>
                <p className="mt-2 text-sm/6 text-white/50">
                  Your config.json changes have been saved successfully.
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
    </div>
  );
};

export default ConfigEditor;
