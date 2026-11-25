import type {
  CollectMachineConditionsProps,
  CountDemoCsvSizeProps,
  DemoCsvSize,
  MachineConditions,
} from "./types/collectConditions";

export const countDemoCsvSize = (
  props: CountDemoCsvSizeProps,
): DemoCsvSize => {
  const { csvText } = props;
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  const dataLines = lines.slice(1);
  const playerIds = new Set<string>();

  for (const line of dataLines) {
    const comma = line.indexOf(",");
    const personId = comma === -1 ? line : line.slice(0, comma);
    if (personId !== "") {
      playerIds.add(personId);
    }
  }

  return {
    csvRowCount: dataLines.length,
    csvPlayerCount: playerIds.size,
  };
};

export const collectMachineConditions = (
  props: CollectMachineConditionsProps,
): MachineConditions => {
  const { osImpl } = props;
  const cpus = osImpl.cpus();
  return {
    hostname: osImpl.hostname(),
    platform: osImpl.platform(),
    release: osImpl.release(),
    arch: osImpl.arch(),
    cpuModel: cpus[0]?.model.trim() ?? "unknown",
    cpuCount: cpus.length,
    totalMemoryBytes: osImpl.totalmem(),
  };
};