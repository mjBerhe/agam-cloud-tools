import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "../utils/styles";
import { ChevronUp, ChevronDown } from "lucide-react";

import { Listbox, ListboxOption, ListboxOptions, ListboxButton } from "@headlessui/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/Accordion";

type Job = {
  jobMessage: string;
  jobNumber: string;
};

type SlurmOption = {
  id: number;
  name: string;
  value: string[];
};

const regex = /Submitted batch job (\d{7})/g;
const jobRegex = /Job (\d+)/;

const SlurmOutput: React.FC = () => {
  const [, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  // const [jobID, setJobID] = useState<string>("2104887");
  const [jobID, setJobID] = useState<string>("");

  const [slurmOptions, setSlurmOptions] = useState<SlurmOption[]>([]);
  const [selectedSlurmFile, setSelectedSlurmFile] = useState<SlurmOption>();

  useEffect(() => {
    // loading current slurm file
    const loadLogFile = async () => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_log_file");
        if (data) {
          const matches = [...data.matchAll(regex)];
          if (matches.length > 0) {
            const lastJobId = matches[matches.length - 1][1];
            console.log(lastJobId);
            setJobID(lastJobId);
          }
        }
      } catch (err) {
        setError(`Failed to read log file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    // loading slurm file options
    const loadSlurmFiles = async () => {
      try {
        setLoading(true);

        const files = await invoke<string[][]>("read_all_slurm_files");
        const options = files.map((file, i) => ({
          id: i + 1,
          name: file[0].split(".out")[0],
          value: file[1].split(/\r?\n/),
        }));
        setSlurmOptions(options);
        // console.log(files);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    loadLogFile();
    loadSlurmFiles();
  }, []);

  useEffect(() => {
    const loadSlurmOutput = async (id: string) => {
      try {
        setLoading(true);
        const data = await invoke<string>("read_slurm_file", {
          fileName: id,
        });
        setSelectedSlurmFile({
          id: 0,
          name: `slurm-${id}`,
          value: data.split(/\r?\n/),
        });
      } catch (err) {
        setError(`Failed to read slurm file: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    if (jobID) {
      loadSlurmOutput(jobID);
    }
  }, [jobID]);

  // TODO: add no data state
  if (!selectedSlurmFile && slurmOptions.length === 0) {
    return "No data found";
  }

  // const allStrings = slurmData.split(/\r?\n/);
  const allStrings = selectedSlurmFile?.value;

  const totalJobs = [
    ...new Set(
      allStrings
        ?.map((x) => {
          const match = x.match(jobRegex);
          return match ? match[1] : null;
        })
        .filter((x) => x !== null)
    ),
  ].length;

  const allCompletedJobs = allStrings?.filter((x) =>
    x.includes("completed successfully.")
  );
  // all completed jobs in order of job ID
  const uniqueCompletedJobs: Job[] = [...new Set(allCompletedJobs)]
    .map((x) => ({
      jobMessage: x,
      jobNumber: x.match(jobRegex)?.[1] as string,
    }))
    .sort((a, b) => parseInt(a.jobNumber) - parseInt(b.jobNumber));
  const uniqueCompletedJobIds = uniqueCompletedJobs.map((x) => x.jobNumber);

  // all jobs that failed
  const failedJobs: Job[] | undefined = allStrings
    ?.filter(
      (x) =>
        x.includes("failed") ||
        x.includes("does not end with: pALM successfully finishes the run")
    )
    .map((x) => {
      return {
        jobMessage: x,
        jobNumber: x.match(jobRegex)?.[1] as string,
      };
    })
    .sort((a, b) => parseInt(a.jobNumber) - parseInt(b.jobNumber));

  // all jobs that failed and never completed after being resubmitted
  const actuallyFailedJobs = failedJobs?.filter(
    (x) => !uniqueCompletedJobIds.includes(x.jobNumber)
  );

  const isComplete = uniqueCompletedJobs.length === totalJobs;

  return (
    <div className="flex flex-col h-full w-full">
      <p className="text-xl font-semibold">Output</p>
      <div className="mt-5">
        <div className="flex flex-col min-h-[300px] bg-dark-700 p-4 rounded-lg border border-dark-600">
          <div className="flex flex-col items-center">
            <div className="flex flex-col gap-y-1 items-center w-full justify-center">
              <p
                className={cn(
                  "text-2xl font-light",
                  isComplete ? "text-[#74ec88]" : "text-red-300"
                )}
              >
                {uniqueCompletedJobs.length} / {totalJobs} Jobs Completed Successfully
              </p>

              <div className="flex items-center gap-x-2 mt-1 w-full justify-center">
                <p>Slurm ID: </p>
                <Listbox
                  value={selectedSlurmFile}
                  onChange={(val) => setSelectedSlurmFile(val)}
                >
                  <ListboxButton
                    className={cn(
                      "relative block w-[250px] rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                      "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                    )}
                  >
                    {selectedSlurmFile?.name ?? "Select Slurm File"}
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                  </ListboxButton>
                  <ListboxOptions
                    anchor="bottom"
                    className={cn(
                      "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                      "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                    )}
                  >
                    {slurmOptions?.map((option) => (
                      <ListboxOption
                        key={option.id}
                        value={option}
                        className="flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                      >
                        <p className="text-sm/6 text-white">{option.name}</p>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>
            </div>

            {selectedSlurmFile && (
              <div className="mt-8 flex w-full gap-x-8">
                <Accordion
                  className="flex w-1/2 flex-col"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <AccordionItem
                    value="jobs-completed"
                    className="py-2 flex flex-col items-center"
                  >
                    <AccordionTrigger className="">
                      <div className="flex gap-x-2 items-center">
                        <div className="text-lg font-light text-[#74ec88]">
                          {uniqueCompletedJobs.length} Jobs Completed
                        </div>
                        <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-[expanded]:-rotate-180 dark:text-zinc-50" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col pt-2">
                      {uniqueCompletedJobs.map((x) => (
                        <p className="text-gray-300 text-sm/6" key={x.jobNumber}>
                          {x.jobMessage}
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Accordion
                  className="flex w-1/2 flex-col"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <AccordionItem
                    value="jobs-failed"
                    className="py-2 flex flex-col items-center"
                  >
                    <AccordionTrigger className="">
                      <div className="flex gap-x-2 items-center">
                        <div className="text-lg font-light text-red-300">
                          {actuallyFailedJobs?.length} Jobs Failed
                        </div>
                        <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-[expanded]:-rotate-180 dark:text-zinc-50" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col pt-2">
                      {actuallyFailedJobs?.map((x) => (
                        <p className="text-gray-300 text-sm/6" key={x.jobNumber}>
                          {x.jobMessage}
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlurmOutput;
