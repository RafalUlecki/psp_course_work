import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { collectMachineConditions, countDemoCsvSize } from "./collectConditions";

describe("countDemoCsvSize", () => {
  it("should count data rows excluding the header", () => {
    const csvText = "personId,playerName\n203999,Jokic\n1629029,Doncic\n";
    assert.equal(countDemoCsvSize({ csvText }).csvRowCount, 2);
  });

  it("should count unique player ids", () => {
    const csvText = "personId,playerName\n203999,Jokic\n203999,Jokic\n1,A\n";
    assert.equal(countDemoCsvSize({ csvText }).csvPlayerCount, 2);
  });
});

describe("collectMachineConditions", () => {
  it("should copy the CPU model from the first cpu", () => {
    const machine = collectMachineConditions({
      osImpl: {
        hostname: () => "box",
        platform: () => "linux",
        release: () => "6.12",
        arch: () => "x64",
        cpus: () => [{ model: " Test CPU " }],
        totalmem: () => 8,
      },
    });
    assert.equal(machine.cpuModel, "Test CPU");
  });
});
