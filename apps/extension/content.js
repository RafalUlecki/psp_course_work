// Real sportsbook selectors are future work, out of the MVP demo.
const LAST_N_DEFAULT = 10;
const LAST_N_OPTIONS = [5, 10];
const ALL_FILTER = "";
const VENUE_OPTIONS = [
  { value: ALL_FILTER, label: "All" },
  { value: "home", label: "Home" },
  { value: "away", label: "Away" },
];

const parseOpponentCodes = (raw) =>
  (raw ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

const row = document.querySelector(
  "[data-prophover-row][data-prophover-player][data-prophover-stat][data-prophover-line][data-prophover-player-id]"
);
if (row) {
  const player = row.getAttribute("data-prophover-player");
  const playerId = row.getAttribute("data-prophover-player-id");
  const stat = row.getAttribute("data-prophover-stat");
  const line = row.getAttribute("data-prophover-line");
  const opponentCodes = parseOpponentCodes(
    row.getAttribute("data-prophover-opponents")
  );
  console.log(`[PropHover] fixture detected: ${player} ${stat} ${line}`);

  let card = null;
  let selectedLastN = LAST_N_DEFAULT;
  let selectedOpponent = ALL_FILTER;
  let selectedVenue = ALL_FILTER;
  let requestId = 0;

  const formatSummary = (hitRate, hits, n) => {
    if (n === 0) {
      return `${stat} over ${line} — Not enough data`;
    }
    const percent = hitRate === null ? "—" : `${Math.round(hitRate * 100)}%`;
    return `${stat} over ${line} — ${percent} · ${hits}/${n}`;
  };

  const controlStyle = [
    "border:1px solid #666",
    "background:#111",
    "color:#fff",
    "padding:4px 6px",
    "border-radius:4px",
    "font:12px/1.2 system-ui,sans-serif",
  ].join(";");

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

  const loadHitRate = async () => {
    const currentRequest = ++requestId;
    setSummaryText("Loading…");

    try {
      const params = new URLSearchParams({
        playerId,
        stat,
        line,
        lastN: String(selectedLastN),
      });
      if (selectedOpponent !== ALL_FILTER) {
        params.set("opponent", selectedOpponent);
      }
      if (selectedVenue !== ALL_FILTER) {
        params.set("venue", selectedVenue);
      }
      const response = await fetch(`/api/hit-rate?${params.toString()}`);
      if (currentRequest !== requestId || !card) {
        return;
      }
      if (!response.ok) {
        setSummaryText("error");
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
      setSummaryText("error");
    }
  };

  const createFilterSelect = (name, values, onChange) => {
    const label = document.createElement("label");
    label.style.cssText =
      "display:flex;align-items:center;gap:6px;font:12px/1.2 system-ui,sans-serif";
    label.append(name);

    const select = document.createElement("select");
    select.setAttribute(`data-prophover-${name.toLowerCase()}`, "");
    select.style.cssText = controlStyle;

    for (const optionValue of values) {
      const option = document.createElement("option");
      option.value = optionValue.value;
      option.textContent = optionValue.label;
      select.appendChild(option);
    }

    select.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    select.addEventListener("change", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onChange(select.value);
      loadHitRate();
    });

    label.appendChild(select);
    return label;
  };

  const showCard = () => {
    if (card) {
      return;
    }

    selectedLastN = LAST_N_DEFAULT;
    selectedOpponent = ALL_FILTER;
    selectedVenue = ALL_FILTER;
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
        loadHitRate();
      });
      toggle.appendChild(button);
    }

    const filters = document.createElement("div");
    filters.setAttribute("data-prophover-filters", "");
    filters.style.cssText = "display:flex;gap:10px;align-items:center";

    const opponentOptions = [
      { value: ALL_FILTER, label: "All" },
      ...opponentCodes.map((code) => ({ value: code, label: code })),
    ];
    filters.appendChild(
      createFilterSelect("Opponent", opponentOptions, (value) => {
        selectedOpponent = value;
      })
    );
    filters.appendChild(
      createFilterSelect("Venue", VENUE_OPTIONS, (value) => {
        selectedVenue = value;
      })
    );

    panel.appendChild(summary);
    panel.appendChild(toggle);
    panel.appendChild(filters);
    card.appendChild(panel);
    row.appendChild(card);
    paintToggle();
    loadHitRate();
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
