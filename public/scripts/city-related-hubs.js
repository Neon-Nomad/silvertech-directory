(() => {
  const root = document.querySelector(".sl-state-page[data-city-state]");
  if (!root) return;

  const supabaseUrl = (root.getAttribute("data-city-supabase-url") || "").trim();
  const supabaseAnonKey = (root.getAttribute("data-city-supabase-anon-key") || "").trim();
  const canIngestRawEvents = Boolean(supabaseUrl && supabaseAnonKey);
  const SESSION_STORAGE_KEY = "std_session_id";

  const pageContext = {
    state: (root.getAttribute("data-city-state") || "").trim() || null,
    city: (root.getAttribute("data-city-name") || "").trim() || null,
    careType: (root.getAttribute("data-city-care") || "").trim() || null,
    path: location.pathname,
  };

  const trackedLinks = Array.from(document.querySelectorAll("[data-city-track]"));

  const trackEvent = (name, props) => {
    if (!name) return;
    const win = window;
    if (typeof win.gtag === "function") {
      win.gtag("event", name, props || {});
    }
    if (typeof win.plausible === "function") {
      win.plausible(name, { props: props || {} });
    }
    if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: name, ...(props || {}) });
    }
  };

  const createUuid = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  };

  const getSessionId = () => {
    try {
      const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (existing) return existing;
      const created = createUuid();
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
      return created;
    } catch {
      return createUuid();
    }
  };

  const normalizePath = (value) => {
    if (!value) return location.pathname;
    return value.startsWith("/") ? value : `/${value}`;
  };

  const ingestRawEvent = async (eventName, props = {}) => {
    if (!canIngestRawEvents || !eventName) return;

    const payload = {
      event_name: eventName,
      page_type: "city_hub",
      state: props.state || pageContext.state || null,
      city: props.city || pageContext.city || null,
      care_type: props.careType || pageContext.careType || null,
      target_city: props.targetCity || null,
      position: props.position || null,
      authority_rank: props.authorityRank ?? null,
      statute_id: props.statuteId || null,
      is_verified: props.isVerified ?? null,
      user_intent: props.userIntent || null,
      edge_type: props.edgeType || null,
      page_path: normalizePath(props.path || location.pathname),
      page_referrer: document.referrer || null,
      session_id: getSessionId(),
      user_id: null,
      timestamp: new Date().toISOString(),
    };

    const sourceEventId = `${eventName}:${payload.session_id}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const body = {
      p_source_system: "web",
      p_canonical_entity: "lead_event",
      p_payload: payload,
      p_source_event_id: sourceEventId,
      p_occurred_at: payload.timestamp,
      p_schema_version: "1.0.0",
      p_metadata: {
        state: payload.state,
        city: payload.city,
        care_type: payload.care_type,
        target_city: payload.target_city,
        position: payload.position,
        authority_rank: payload.authority_rank,
        statute_id: payload.statute_id,
        is_verified: payload.is_verified,
        user_intent: payload.user_intent,
        edge_type: payload.edge_type,
        path: payload.page_path,
        page_type: payload.page_type,
      },
    };

    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/ingest_raw_event`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: supabaseAnonKey,
          authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {
      // Ignore transport failures to keep UX uninterrupted.
    }
  };

  const trackCityPageView = () => {
    const win = window;
    if (win.__stdCityPageViewTrackedPath === location.pathname) return;
    win.__stdCityPageViewTrackedPath = location.pathname;
    void ingestRawEvent("page_view", {
      state: pageContext.state,
      city: pageContext.city,
      careType: pageContext.careType,
      position: "page",
      path: location.pathname,
      userIntent: "research",
    });
  };

  trackCityPageView();

  for (const link of trackedLinks) {
    if (link.dataset.cityTrackBound === "1") continue;
    link.dataset.cityTrackBound = "1";
    link.addEventListener("click", () => {
      const eventName = link.getAttribute("data-city-track");
      if (!eventName) return;

      const position = link.getAttribute("data-city-position") || "unknown";
      const targetCity = link.getAttribute("data-city-target") || null;
      const statuteId = link.getAttribute("data-city-statute-id") || null;
      const userIntent = link.getAttribute("data-city-user-intent") || "research";
      const edgeType = link.getAttribute("data-city-edge-type") || null;
      const authorityRankRaw = link.getAttribute("data-city-authority-rank");
      const authorityRank = authorityRankRaw ? Number(authorityRankRaw) : null;
      const isVerified = (link.getAttribute("data-city-is-verified") || "").toLowerCase() === "true";

      const analyticsPayload = {
        state: pageContext.state,
        city: pageContext.city,
        care_type: pageContext.careType,
        target_city: targetCity,
        position,
        authority_rank: authorityRank,
        statute_id: statuteId,
        is_verified: isVerified,
        user_intent: userIntent,
        edge_type: edgeType,
      };

      trackEvent(eventName, analyticsPayload);
      void ingestRawEvent(eventName, {
        state: pageContext.state,
        city: pageContext.city,
        careType: pageContext.careType,
        targetCity,
        position,
        authorityRank,
        statuteId,
        isVerified,
        userIntent,
        edgeType,
        path: location.pathname,
      });
    });
  }
})();

