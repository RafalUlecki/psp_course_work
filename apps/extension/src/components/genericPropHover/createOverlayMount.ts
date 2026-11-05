import { OVERLAY_HOST_ATTR } from "../../lib/genericProp/constants/genericPropConstants";
import type { OverlayMount } from "./types/genericPropHover";

const PAGE_EVENTS = [
  "click",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "auxclick",
  "touchstart",
  "touchend",
] as const;

const isolateOverlayEvents = (host: HTMLElement): void => {
  for (const eventName of PAGE_EVENTS) {
    host.addEventListener(eventName, (event: Event) => {
      event.stopPropagation();
    });
  }
};

export const createOverlayMount = (): OverlayMount => {
  const overlayHost = document.createElement("div");
  overlayHost.setAttribute(OVERLAY_HOST_ATTR, "");
  overlayHost.style.position = "fixed";
  overlayHost.style.inset = "0";
  overlayHost.style.pointerEvents = "none";
  overlayHost.style.zIndex = "2147483647";
  isolateOverlayEvents(overlayHost);

  const shadow = overlayHost.attachShadow({ mode: "open" });
  const styleTarget = document.createElement("div");
  const mountElement = document.createElement("div");
  mountElement.style.pointerEvents = "auto";
  shadow.append(styleTarget, mountElement);
  document.body.append(overlayHost);

  return { overlayHost, styleTarget, mountElement };
};
