// Real sportsbook selectors are future work, out of the MVP demo.
const LAST_N_DEFAULT = 10;
const LAST_N_OPTIONS = [5, 10];

const row = document.querySelector(
  "[data-prophover-row][data-prophover-player][data-prophover-stat][data-prophover-line][data-prophover-player-id]"
);
if (row) {
  const player = row.getAttribute("data-prophover-player");
  const playerId = row.getAttribute("data-prophover-player-id");
  const stat = row.getAttribute("data-prophover-stat");
  const line = row.getAttribute("data-prophover-line");
  console.log(`[PropHover] fixture detected: ${player} ${stat} ${line}`);

  let card = null;
  let selectedLastN = LAST_N_DEFAULT;
  let requestId = 0;

  const formatSummary = (hitRate, hits, n) => {
    const percent = hitRate === null ? "—" : `${Math.round(hitRate * 100)}%`;
    return `${stat} over ${line} — ${percent} · ${hits}/${n}`;
  };

  const toggleButtonStyle = (isSelected) =>
    [
      "border:1px solid #666",
      `background:${isSelected ? "#fff" : "transparent"}`,
      `color:${isSelected ? "#111" : "#fff"}`,
      "padding:4px 10px",
      "border-radius:4px",
      "font:12px/1.2 system-ui,sans-serif",
      "cursor:pointer",
    ].join(";");

  const setSummaryText = (text) => {
    if (!card) {
      return;
    }
    const summary = card.querySelector("[data-prophover-summary]");
    if (!summary) {
      return;
    }
    summary.textContent = text;
  };

  const paintToggle = () => {
    if (!card) {
      return;
    }
    const buttons = card.querySelectorAll("[data-prophover-last-n]");
    for (const button of buttons) {
      const value = Number(button.getAttribute("data-prophover-last-n"));
      const isSelected = value === selectedLastN;
      button.style.cssText = toggleButtonStyle(isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    }
  };

  const loadHitRate = async (lastN) => {
    const currentRequest = ++requestId;
    setSummaryText("Loading…");

    try {
      const params = new URLSearchParams({
        playerId,
        stat,
        line,
        lastN: String(lastN),
      });
      const response = await fetch(`/api/hit-rate?${params.toString()}`);
      if (currentRequest !== requestId || !card) {
        return;
      }
      if (!response.ok) {
        setSummaryText("Couldn't load hit rate");
        return;
      }
      const body = await response.json();
      if (currentRequest !== requestId || !card) {
        return;
      }
      setSummaryText(formatSummary(body.hitRate, body.hits, body.n));
    } catch {
      if (currentRequest !== requestId || !card) {
        return;
      }
      setSummaryText("Couldn't load hit rate");
    }
  };

  const showCard = () => {
    if (card) {
      return;
    }

    selectedLastN = LAST_N_DEFAULT;
    const rect = row.getBoundingClientRect();
    card = document.createElement("div");
    card.setAttribute("data-prophover-card", "");
    card.style.cssText = [
      "position:fixed",
      `top:${rect.bottom}px`,
      `left:${rect.left}px`,
      "z-index:2147483647",
      "padding-top:8px",
      "background:transparent",
      "font:14px/1.4 system-ui,sans-serif",
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      "background:#111",
      "color:#fff",
      "padding:8px 12px",
      "border-radius:6px",
      "box-shadow:0 2px 8px rgba(0,0,0,.35)",
      "display:flex",
      "flex-direction:column",
      "gap:8px",
      "width:max-content",
    ].join(";");

    const summary = document.createElement("div");
    summary.setAttribute("data-prophover-summary", "");
    summary.style.whiteSpace = "nowrap";
    summary.textContent = "Loading…";

    const toggle = document.createElement("div");
    toggle.setAttribute("data-prophover-last-n-toggle", "");
    toggle.style.cssText = "display:flex;gap:6px";

    for (const lastN of LAST_N_OPTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-prophover-last-n", String(lastN));
      button.textContent = `Last ${lastN}`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectedLastN = lastN;
        paintToggle();
        loadHitRate(lastN);
      });
      toggle.appendChild(button);
    }

    panel.appendChild(summary);
    panel.appendChild(toggle);
    card.appendChild(panel);
    row.appendChild(card);
    paintToggle();
    loadHitRate(selectedLastN);
  };

  const hideCard = () => {
    requestId += 1;
    if (!card) {
      return;
    }
    card.remove();
    card = null;
  };

  row.addEventListener("mouseenter", showCard);
  row.addEventListener("mouseleave", hideCard);
}
