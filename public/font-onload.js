// Switches print-media font stylesheets to all media once they load.
// Replaces an inline onload handler, which the Content Security Policy blocks.
document.querySelectorAll('link[data-font-onload]').forEach((link) => {
  const apply = () => { link.media = 'all'; };
  if (link.sheet) apply();
  else link.addEventListener('load', apply, { once: true });
});
