(function () {
  if (location.hostname === "localhost") {
    return;
  }

  function scheduleIdle(callback, timeout) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: timeout });
      return;
    }
    window.setTimeout(callback, Math.min(timeout, 2000));
  }

  function onPageLoaded(callback) {
    if (document.readyState === "complete") {
      callback();
      return;
    }
    window.addEventListener("load", callback, { once: true });
  }

  function loadAhrefs() {
    if (window.__ahrefsLoaded) {
      return;
    }
    var script = document.createElement("script");
    script.src = "https://analytics.ahrefs.com/analytics.js";
    script.async = true;
    script.setAttribute("data-key", "iMtROZfizx8Kq4EC6g9Nlg");
    document.head.appendChild(script);
    window.__ahrefsLoaded = true;
  }

  function initAds() {
    if (window.__adsPageLevelInitialized) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: "ca-pub-8660191869695450",
        enable_page_level_ads: true,
        overlays: { bottom: true }
      });
      window.__adsPageLevelInitialized = true;
    } catch (error) {
      var message = String((error && error.message) || "");
      if (message.includes("Only one 'enable_page_level_ads'")) {
        window.__adsPageLevelInitialized = true;
      } else {
        console.warn("AdSense initialization failed:", error);
      }
    }
  }

  function loadAdsScriptAndInit() {
    if (window.__adsScriptRequested) {
      return;
    }
    window.__adsScriptRequested = true;

    var script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8660191869695450";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", function () {
      scheduleIdle(initAds, 1500);
    });
    document.head.appendChild(script);
  }

  onPageLoaded(function () {
    scheduleIdle(loadAhrefs, 3000);
    scheduleIdle(loadAdsScriptAndInit, 3500);
  });
})();
