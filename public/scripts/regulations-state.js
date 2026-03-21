(() => {
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
