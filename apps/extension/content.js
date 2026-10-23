const row = document.querySelector("[data-player][data-stat][data-line]");
if (row) {
  const player = row.getAttribute("data-player");
  const stat = row.getAttribute("data-stat");
  const line = row.getAttribute("data-line");
  console.log(`[PropHover] fixture detected: ${player} ${stat} ${line}`);
}
