import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { collectMachineConditions } from "../src/lib/perf/collectConditions";
import {
  PERF_COMMAND,
  PERF_REPORT_RELATIVE_PATH,
} from "../src/lib/perf/constants";
import { parsePerfArgs } from "../src/lib/perf/parsePerfArgs";
import { runHitRatePerf } from "../src/lib/perf/runHitRatePerf";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(scriptDir, "..");
const repoRoot = path.join(webRoot, "..", "..");

const main = async (): Promise<void> => {
  const parsed = parsePerfArgs({
    argv: process.argv.slice(2),
    env: {
      PERF_BASE_URL: process.env.PERF_BASE_URL,
      PERF_N: process.env.PERF_N,
      PERF_WARMUP: process.env.PERF_WARMUP,
    },
  });

  if (!parsed.ok) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }

  const csvText = readFileSync(
    path.join(webRoot, "data", "PlayerStatistics.csv"),
    "utf8",
  );

  const result = await runHitRatePerf({
    baseUrl: parsed.args.baseUrl,
    measuredCount: parsed.args.measuredCount,
    warmupCount: parsed.args.warmupCount,
    csvText,
    fetchImpl: fetch,
    nowMs: () => performance.now(),
    measuredAt: new Date(),
    machine: collectMachineConditions({ osImpl: os }),
    command: PERF_COMMAND,
  });

  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  console.log(result.report);

  if (parsed.args.writeReport) {
    const reportPath = path.join(repoRoot, PERF_REPORT_RELATIVE_PATH);
    mkdirSync(path.dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, result.report);
    console.error(`Wrote ${path.relative(repoRoot, reportPath)}`);
  }
};

const run = async (): Promise<void> => {
  try {
    await main();
  } catch (thrown) {
    if (thrown instanceof Error) {
      console.error(thrown.message);
    } else {
      console.error("perf failed");
    }
    process.exitCode = 1;
  }
};

void run();