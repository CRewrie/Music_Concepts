// Language switch (English / German). All text calls tr(en, de); switching reloads the page.
const I18N = (() => {
  const KEY = 'musicConcepts.lang';
  let lang;
  try { lang = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
  if (lang !== 'en' && lang !== 'de') lang = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  document.documentElement.lang = lang;

  return {
    lang: () => lang,
    tr: (en, de) => (lang === 'de' ? de : en),
    set(l) {
      try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
      location.reload();
    },
  };
})();
const tr = I18N.tr;
