// Real sportsbook selectors are future work, out of the MVP demo.
const row = document.querySelector(
  "[data-prophover-row][data-prophover-player][data-prophover-stat][data-prophover-line]"
);
if (row) {
  const player = row.getAttribute("data-prophover-player");
  const stat = row.getAttribute("data-prophover-stat");
  const line = row.getAttribute("data-prophover-line");
  console.log(`[PropHover] fixture detected: ${player} ${stat} ${line}`);

  let card = null;

  row.addEventListener("mouseenter", () => {
    if (card) {
      return;
    }
    const rect = row.getBoundingClientRect();
    card = document.createElement("div");
    card.textContent = `${stat} over ${line} — 70% · 7/10`;
    card.setAttribute("data-prophover-card", "");
    card.style.cssText = [
      "position:fixed",
      `top:${rect.bottom + 8}px`,
      `left:${rect.left}px`,
      "z-index:2147483647",
      "background:#111",
      "color:#fff",
      "padding:8px 12px",
      "border-radius:6px",
      "font:14px/1.4 system-ui,sans-serif",
      "box-shadow:0 2px 8px rgba(0,0,0,.35)",
      "white-space:nowrap",
    ].join(";");
    document.body.appendChild(card);
  });

  row.addEventListener("mouseleave", () => {
    if (!card) {
      return;
    }
    card.remove();
    card = null;
  });
}
