import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
// import { cn } from "../lib/utils";
import { isEqual } from "lodash";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  // Input,
} from "@headlessui/react";
import Editor from "@monaco-editor/react";
import { Button } from "./Button";

export const JsonEditorTab: React.FC = () => {
  // const [initialJsonConfigData, setInitialJsonConfigData] = useState<
  //   Record<string, string>
  // >({});
  // const [jsonConfigData, setJsonConfigData] = useState<Record<string, string>>({});
  const [initialJsonConfigData, setInitialJsonConfigData] = useState<string>("");
  const [jsonConfigData, setJsonConfigData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);

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

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
  //   setJsonConfigData((prev) => ({
  //     ...prev,
  //     [key]: e.target.value,
  //   }));
  // };

  const saveJsonConfigFile = async () => {
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
  };

  const handleReset = () => {
    setJsonConfigData(initialJsonConfigData);
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
      <p className="mt-5 text-xl font-semibold text-gray-200">Edit Config File</p>
      <p className="text-sm text-gray-400 mt-1">
        *DO NOT modify the remote_system_path_check (line 5)
      </p>

      <div className="mt-5">
        <div className="flex flex-col gap-y-1 max-h-[400px] overflow-auto border border-zinc-700 bg-white/[3%] p-4 rounded-lg">
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

          {/* {Object.keys(jsonConfigData).map((key) => (
            <div className="flex gap-x-2 items-center" key={key}>
              <p className="w-[250px] text-sm">{key}:</p>
              <Input
                className={cn(
                  "block w-full bg-white/10 px-3 py-1.5 rounded-lg text-sm",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                )}
                type="text"
                value={jsonConfigData[key]}
                onChange={(e) => handleInputChange(e, key)}
              />
            </div>
          ))} */}
        </div>

        <div className="flex w-full justify-center mt-5 gap-x-4">
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
