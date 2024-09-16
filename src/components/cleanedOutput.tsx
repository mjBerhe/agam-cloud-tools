export const CleanedOutput: React.FC<{ output: string }> = (props) => {
  const { output } = props;

  const allStrings = output?.split(/\r?\n/);
  console.log(allStrings);

  return (
    <div className="flex flex-col">
      {allStrings.map((x) => (
        <span>{x}</span>
      ))}
    </div>
  );
};
