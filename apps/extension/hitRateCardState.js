(() => {
  const HIT_RATE_CARD_LOADING_TEXT = "Loading…";
  const HIT_RATE_CARD_ERROR_TEXT = "error";

  const createLatestRequestGuard = () => {
    let requestId = 0;

    const begin = () => {
      requestId += 1;
      return requestId;
    };

    const invalidate = () => {
      requestId += 1;
    };

    const isCurrent = (id) => id === requestId;

    return { begin, invalidate, isCurrent };
  };

  const resolveHitRateCardStatus = (input) => {
    if (input.status === "loading") {
      return "loading";
    }
    if (input.status === "error") {
      return "error";
    }
    if (input.n === 0) {
      return "empty";
    }
    return "data";
  };

  const resolveHitRateCardSummary = (input) => {
    if (input.status === "loading") {
      return HIT_RATE_CARD_LOADING_TEXT;
    }
    if (input.status === "error") {
      return HIT_RATE_CARD_ERROR_TEXT;
    }
    if (input.n === 0) {
      return `${input.stat} over ${input.line} — Not enough data`;
    }
    const percent =
      input.hitRate === null ? "—" : `${Math.round(input.hitRate * 100)}%`;
    return `${input.stat} over ${input.line} — ${percent} · ${input.hits}/${input.n}`;
  };

  const PropHoverHitRateCardState = {
    HIT_RATE_CARD_LOADING_TEXT,
    HIT_RATE_CARD_ERROR_TEXT,
    createLatestRequestGuard,
    resolveHitRateCardStatus,
    resolveHitRateCardSummary,
  };

  globalThis.PropHoverHitRateCardState = PropHoverHitRateCardState;

  if (typeof module === "object" && module !== null && module.exports) {
    module.exports = PropHoverHitRateCardState;
  }
})();
