import { useEffect, useState } from "react";

import {
  CLIENT_ID_STORAGE_KEY,
  DEFAULT_CLIENT_ID,
  type TestClientId,
} from "./constants";
import { readStoredClientId } from "./clientIdStorage";
import { parseStoredClientId } from "./parseStoredClientId";

export const useClientId = (): TestClientId => {
  const [clientId, setClientId] = useState<TestClientId>(DEFAULT_CLIENT_ID);

  useEffect(() => {
    void readStoredClientId().then(setClientId);

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ): void => {
      if (areaName !== "local") {
        return;
      }

      const change = changes[CLIENT_ID_STORAGE_KEY];
      if (change === undefined) {
        return;
      }

      const nextValue = change.newValue;
      setClientId(
        parseStoredClientId(
          typeof nextValue === "string" ? nextValue : undefined,
        ),
      );
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return clientId;
};
