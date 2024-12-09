import { useState, useRef, useEffect } from "react";

import { Script } from "../../types/scripts";
import { cn } from "../../utils/styles";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Check } from "lucide-react";
import { useOutputStore, useStatusStore } from "../../stores";
import { Button } from "../ui/Button";
import { TextEffect } from "../ui/TextEffect";

type ScriptTab = { name: string; scriptName: Script; id: number };

const tabs: ScriptTab[] = [
  // {
  //   name: "Monitor",
  //   scriptName: "monitor",
  //   id: 0,
  // },
  {
    name: "Automate",
    scriptName: "automate",
    id: 1,
  },
  {
    name: "Upload",
    scriptName: "upload",
    id: 2,
  },
  {
    name: "Remote Run",
    scriptName: "remote_run",
    id: 3,
  },
  {
    name: "Download & Monitor",
    scriptName: "monitor_download",
    id: 4,
  },
  // {
  //   name: "Download",
  //   scriptName: "download",
  //   id: 5,
  // },
];

const ScriptOutput: React.FC<{ runScript: (script: Script) => void }> = ({
  runScript,
}) => {
  // headlessUI tabs use index
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedScript = tabs[selectedIndex];

  const { status: allStatuses } = useStatusStore();
  const { outputs } = useOutputStore();

  const output = outputs[selectedScript.scriptName];

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [output]);

  return (
    <div className="flex gap-x-6">
      <div className="flex flex-col w-1/3 gap-y-4">
        <p className="text-xl font-semibold">Status</p>

        <div className="bg-dark-700 rounded-lg border border-dark-600 py-4 px-5">
          <div className="flex flex-col gap-y-2 relative border-s border-gray-500">
            {tabs.map((tab) => (
              <div className="mb-8 ms-6" key={tab.id}>
                <span
                  className={cn(
                    "absolute -start-2.5 flex h-5 w-5 items-center justify-center rounded-full",
                    allStatuses[tab.scriptName].isRunning
                      ? "bg-primary-500"
                      : allStatuses[tab.scriptName].isCompleted
                      ? "bg-[#3f834a]"
                      : "bg-gray-500"
                  )}
                >
                  {allStatuses[tab.scriptName].isRunning ? (
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-primary-400"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  ) : allStatuses[tab.scriptName].isCompleted ? (
                    <Check width={15} height={15} color="#74ec88" strokeWidth={3} />
                  ) : (
                    ""
                  )}
                </span>
                <div>
                  <p className="text-lg/6 font-light text-gray-200">{tab.name}</p>
                  {allStatuses[tab.scriptName].isRunning ? (
                    <p className="text-sm/6 text-primary-400 font-medium">Running</p>
                  ) : allStatuses[tab.scriptName].isCompleted ? (
                    <p className="text-sm/6 font-medium text-[#74ec88]">Completed</p>
                  ) : (
                    <p className="text-sm/6 text-gray-400 font-medium">Idle</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-center">
          <Button
            variant={"outline"}
            className="w-full"
            onClick={() => runScript("cancel")}
            disabled={
              allStatuses["cancel"].isRunning ||
              !allStatuses["monitor_download"].isRunning
            }
          >
            {allStatuses["cancel"].isRunning ? (
              <div className="flex gap-x-2 items-center">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-primary-400"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                Cancelling Jobs...
              </div>
            ) : (
              "Cancel Jobs"
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col w-2/3 gap-y-4">
        <p className="text-xl font-semibold">Scripts</p>

        <div className="bg-dark-700 rounded-lg border border-dark-600">
          <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className="w-full"
          >
            <TabList className="pt-1 w-full px-2">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className={cn(
                    "w-1/4 rounded-t-lg border border-dark-600 p-2 text-sm/6 font-medium cursor-pointer focus:outline-none",
                    "bg-dark-800 data-[hover]:bg-dark-700 text-gray-300",
                    "data-[selected]:bg-dark-600 data-[selected]:text-white"
                  )}
                >
                  {tab.name}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {tabs.map((tab) => (
                <TabPanel className="pt-0" key={tab.id}>
                  <div className="flex flex-col min-h-[360px] px-4 pb-4 pt-2">
                    <div className="bg-black flex flex-col overflow-y-auto h-[300px] shadow-lg px-4 py-3 mt-2 rounded-lg">
                      {output.map((x, i) => (
                        <TextEffect
                          key={`${x}-${i}`}
                          per="line"
                          preset="slide"
                          className="text-sm/6 text-gray-300 font-light"
                        >
                          {x}
                        </TextEffect>
                      ))}
                      <div ref={bottomRef}></div>
                    </div>

                    <div className="flex justify-center mt-4 gap-x-4">
                      <Button
                        onClick={() => runScript(selectedScript.scriptName)}
                        disabled={
                          allStatuses["automate"].isRunning ||
                          allStatuses["upload"].isRunning ||
                          allStatuses["remote_run"].isRunning ||
                          allStatuses["monitor_download"].isRunning
                        }
                      >
                        {allStatuses[tab.scriptName].isRunning ? (
                          <div className="flex gap-x-2 items-center">
                            <svg
                              aria-hidden="true"
                              className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-primary-400"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                            Running {selectedScript.name}...
                          </div>
                        ) : (
                          `Run ${selectedScript.name}`
                        )}
                      </Button>
                    </div>
                  </div>
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
};

export default ScriptOutput;
