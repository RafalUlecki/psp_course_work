import type { TestClientId } from "./settings/constants";
import {
  readStoredClientId,
  writeStoredClientId,
} from "./settings/clientIdStorage";
import { isTestClientId } from "./settings/parseStoredClientId";

const radios = (): HTMLInputElement[] =>
  [...document.querySelectorAll<HTMLInputElement>('input[name="clientId"]')];

const selectClient = (clientId: TestClientId): void => {
  for (const radio of radios()) {
    radio.checked = radio.value === clientId;
  }
};

const bindRadios = (): void => {
  for (const radio of radios()) {
    radio.addEventListener("change", () => {
      if (!radio.checked || !isTestClientId(radio.value)) {
        return;
      }

      void writeStoredClientId(radio.value);
    });
  }
};

const main = async (): Promise<void> => {
  const clientId = await readStoredClientId();
  selectClient(clientId);
  bindRadios();
};

void main();
