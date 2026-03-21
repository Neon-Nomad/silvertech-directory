(() => {
  const trackingRoot = document.querySelector(".sl-state-page");
  const supabaseUrl = (trackingRoot?.getAttribute("data-reg-supabase-url") || "").trim();
  const supabaseAnonKey = (trackingRoot?.getAttribute("data-reg-supabase-anon-key") || "").trim();
  const canIngestRawEvents = Boolean(supabaseUrl && supabaseAnonKey);
  const REGULATION_PATH_REGEX = /^\/regulations\/([^/]+)\/?$/;
  const SESSION_STORAGE_KEY = "std_session_id";

  const copyButtons = Array.from(document.querySelectorAll("[data-copy-citation]"));
  const regSections = Array.from(document.querySelectorAll("[data-reg-section]"));
  const regOpenLinks = Array.from(document.querySelectorAll("[data-reg-open]"));
  const trackedLinks = Array.from(document.querySelectorAll("[data-reg-track]"));

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

  const parseStateFromPath = () => {
    const match = location.pathname.match(REGULATION_PATH_REGEX);
    return match?.[1] || null;
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

    const state = props.state || parseStateFromPath();
    const payload = {
      event_name: eventName,
      page_type: "regulations_state",
      state: state || null,
      city: props.city || null,
      position: props.position || null,
      page_path: normalizePath(props.path || location.pathname),
      page_referrer: document.referrer || null,
      session_id: getSessionId(),
      user_id: null,
      timestamp: new Date().toISOString(),
    };

    const sourceEventId = `${eventName}:${payload.session_id}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

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
        position: payload.position,
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
      // Swallow network errors to keep navigation and UX uninterrupted.
    }
  };

  const trackRegulationsPageView = () => {
    const win = window;
    const state = parseStateFromPath();
    if (!state) return;
    if (win.__stdRegPageViewTrackedPath === location.pathname) return;
    win.__stdRegPageViewTrackedPath = location.pathname;
    void ingestRawEvent("page_view", {
      state,
      city: null,
      position: "page",
      path: location.pathname,
    });
  };

  trackRegulationsPageView();

  const fallbackCopyText = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  };

  const copyText = async (text) => {
    if (!text) return false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return fallbackCopyText(text);
      }
    }
    return fallbackCopyText(text);
  };

  for (const copyButton of copyButtons) {
    copyButton.addEventListener("click", async () => {
      const citation = copyButton.getAttribute("data-copy-citation") || "";
      if (!citation) return;
      const defaultLabel = copyButton.getAttribute("data-default-label") || "Copy Full Citation";
      const copied = await copyText(citation);
      copyButton.textContent = copied ? "Copied!" : "Copy failed";
      setTimeout(() => {
        copyButton.textContent = defaultLabel;
      }, 2000);
    });
  }

  for (const link of trackedLinks) {
    if (link.dataset.regTrackBound === "1") continue;
    link.dataset.regTrackBound = "1";
    link.addEventListener("click", () => {
      const eventName = link.getAttribute("data-reg-track");
      if (!eventName) return;
      const state = link.getAttribute("data-reg-state") || null;
      const city = link.getAttribute("data-reg-city") || null;
      const position = link.getAttribute("data-reg-position") || "unknown";
      trackEvent(eventName, {
        state,
        city,
        position,
      });
      void ingestRawEvent(eventName, {
        state,
        city,
        position,
        path: location.pathname,
      });
    });
  }

  if (regSections.length === 0) return;

  const getPanel = (section) => section.querySelector("[data-reg-panel]");
  const getToggle = (section) => section.querySelector("[data-reg-toggle]");
  const getIndicator = (section) => section.querySelector("[data-reg-indicator]");

  const setSectionOpen = (section, shouldOpen) => {
    const panel = getPanel(section);
    const toggle = getToggle(section);
    const indicator = getIndicator(section);
    if (!panel || !toggle || !indicator) return;

    panel.hidden = !shouldOpen;
    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    indicator.textContent = shouldOpen ? "Hide" : "Show";
    section.classList.toggle("is-open", shouldOpen);
  };

  const setActiveJumpLink = (slug) => {
    for (const link of regOpenLinks) {
      const linkSlug = link.getAttribute("data-reg-open");
      link.classList.toggle("is-active", Boolean(slug && linkSlug === slug));
    }
  };

  const openSectionBySlug = (slug, options = {}) => {
    const opts = {
      scroll: false,
      updateHash: false,
      ...options,
    };

    let opened = null;
    for (const section of regSections) {
      const isTarget = section.id === slug;
      setSectionOpen(section, isTarget);
      if (isTarget) opened = section;
    }
    if (!opened) return false;

    setActiveJumpLink(slug);
    if (opts.updateHash) {
      history.replaceState(null, "", `#${slug}`);
    }
    if (opts.scroll) {
      opened.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  };

  for (const section of regSections) {
    setSectionOpen(section, false);
  }
  setActiveJumpLink("");

  for (const link of regOpenLinks) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const slug = link.getAttribute("data-reg-open");
      if (!slug) return;
      openSectionBySlug(slug, { scroll: true, updateHash: true });
    });
  }

  for (const section of regSections) {
    const toggle = getToggle(section);
    if (!toggle) continue;
    toggle.addEventListener("click", () => {
      const isOpen = section.classList.contains("is-open");
      if (isOpen) {
        setSectionOpen(section, false);
        setActiveJumpLink("");
        history.replaceState(null, "", `${location.pathname}${location.search}`);
        return;
      }
      openSectionBySlug(section.id, { updateHash: true });
    });
  }

  const readHashSlug = () => {
    try {
      return decodeURIComponent(location.hash.replace(/^#/, ""));
    } catch {
      return "";
    }
  };

  const hashSlug = readHashSlug();
  if (hashSlug) {
    openSectionBySlug(hashSlug, { scroll: false, updateHash: false });
  }

  window.addEventListener("hashchange", () => {
    const nextSlug = readHashSlug();
    if (!nextSlug) return;
    openSectionBySlug(nextSlug, { scroll: false, updateHash: false });
  });
})();
