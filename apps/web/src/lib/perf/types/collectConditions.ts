export interface DemoCsvSize {
  csvRowCount: number;
  csvPlayerCount: number;
}

export interface CountDemoCsvSizeProps {
  csvText: string;
}

export interface MachineConditions {
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  cpuModel: string;
  cpuCount: number;
  totalMemoryBytes: number;
}

export interface CpuInfo {
  model: string;
}

export interface OsLike {
  hostname: () => string;
  platform: () => string;
  release: () => string;
  arch: () => string;
  cpus: () => CpuInfo[];
  totalmem: () => number;
}

export interface CollectMachineConditionsProps {
  osImpl: OsLike;
}