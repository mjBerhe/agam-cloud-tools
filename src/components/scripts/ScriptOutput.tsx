import { useState, useRef, useEffect } from "react";

import { Script } from "../../types/scripts";
import { cn } from "../../utils/styles";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useOutputStore, useStatusStore } from "../../stores";
import { Button } from "../ui/Button";

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
    name: "Monitor & Download",
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
  const status = allStatuses[selectedScript.scriptName];

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [output]);

  return (
    <div className="flex gap-x-6">
      <div className="flex flex-col w-1/3">
        <p className="text-xl font-semibold">Status</p>

        <div className="mt-4 bg-dark-700 rounded-lg border border-dark-600">
          <div className="py-4 px-5">
            <div className="flex flex-col gap-y-2 relative border-s">
              {tabs.map((tab, i) => (
                <div className="mb-8 ms-6">
                  <span className="absolute -start-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                    <svg
                      className="h-3 w-3 text-black"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <div>
                    <p>{tab.name}</p>
                    {allStatuses[tab.scriptName].isRunning
                      ? "Running"
                      : allStatuses[tab.scriptName].isCompleted
                      ? "Completed"
                      : "Idle"}
                  </div>
                </div>
                // <div className="flex flex-col">
                //   <div key={tab.id} className="flex w-full items-center gap-x-2">
                //     <div className="flex">
                //       <div className="w-5 h-5 rounded-full bg-transparent border border-gray-300"></div>
                //     </div>

                //     <div className="flex flex-col">
                //       <p>{tab.name}</p>
                //       <div>
                //         {allStatuses[tab.scriptName].isRunning
                //           ? "Running"
                //           : allStatuses[tab.scriptName].isCompleted
                //           ? "Completed"
                //           : "Idle"}
                //       </div>
                //     </div>
                //   </div>

                //   {i !== tabs.length - 1 && (
                //     <div className="h-7 w-0 border-x ml-[9px] mt-1 border-dark-500"></div>
                //   )}
                // </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-2/3">
        <p className="text-xl font-semibold">Scripts</p>

        <div className="mt-4 bg-dark-700 rounded-lg border border-dark-600">
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

            <TabPanels className="mt-0">
              {tabs.map((tab) => (
                <TabPanel className="pt-0" key={tab.id}>
                  <div className="flex flex-col min-h-[360px] px-4 py-2">
                    <p>
                      {status.isRunning
                        ? `${selectedScript.name} is running`
                        : status.isCompleted
                        ? `${selectedScript.name} has completed`
                        : status.error
                        ? `${selectedScript.name} has error: ${status.error}`
                        : `${selectedScript.name} is idle`}
                    </p>

                    <div className="flex flex-col text-sm/6 overflow-y-auto text-gray-300 h-[300px]">
                      {output.map((x, i) => (
                        <p key={`${x}-${i}`} className="">
                          {x}
                        </p>
                      ))}
                      <div ref={bottomRef}></div>
                    </div>

                    <div>
                      <Button onClick={() => runScript(selectedScript.scriptName)}>
                        Run {selectedScript.name}
                      </Button>
                    </div>
                  </div>

                  {/* <ScriptTab
                  tab={tab}
                  output={
                    tab.scriptName === "monitor" ? monitorOutput : outputs[tab.scriptName]
                  }
                  status={
                    isRunning[tab.scriptName]
                      ? "Running"
                      : isCompleted[tab.scriptName]
                      ? "Completed"
                      : errors[tab.scriptName]
                      ? "Error"
                      : "Idle"
                  }
                  runScript={runScript}
                  isDisabled={isAnyScriptRunning}
                  // isDisabled={
                  //   tab.scriptName === "remote_run"
                  //     ? isRemoteRunDisabled
                  //     : tab.scriptName === "download"
                  //     ? isDownloadDisabled
                  //     : isRunning[tab.scriptName] || isAnyScriptRunning
                  // }
                /> */}
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
