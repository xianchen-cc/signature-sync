/**
 * NotaSign business component: SigningFooter
 *
 * Encapsulates the page footer and language switcher. Language changes are
 * broadcast through components/i18n.js so all settled components update
 * together.
 */
(function () {
  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function i18n() {
    return window.NotaSignComponents && window.NotaSignComponents.i18n;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderLanguageItems(activeLanguage) {
    var service = i18n();
    var languages = service ? service.languages : [];
    return languages
      .map(function (language) {
        return (
          '<button type="button" class="ns-app__footer-lang-option' +
          (language.key === activeLanguage ? " is-selected" : "") +
          '" role="menuitemradio" aria-checked="' +
          (language.key === activeLanguage ? "true" : "false") +
          '" data-footer-language="' +
          language.key +
          '"><span class="ns-i18n-ellipsis">' +
          escapeHtml(language.label) +
          "</span></button>"
        );
      })
      .join("");
  }

  function renderSigningFooter(root, options) {
    var assetBase = options.assetBase || "assets/signing-list";
    var service = i18n();
    var activeLanguage = service ? service.getLanguage() : "zh-CN";
    var activeLabel = service ? service.getLanguageLabel(activeLanguage) : "中文（简体）";
    var switchLabel = service ? service.t("footer.language") : "切换语言";

    root.innerHTML =
      '<footer class="ns-app__footer ns-business-signing-footer">' +
      '<div class="ns-app__flyout-wrap ns-app__footer-lang-wrap">' +
      '<button type="button" class="ns-app__footer-lang" aria-label="' +
      escapeHtml(switchLabel) +
      '" aria-expanded="false" aria-haspopup="menu" data-footer-language-trigger>' +
      '<span class="ns-app__footer-lang-label ns-i18n-ellipsis">' +
      escapeHtml(activeLabel) +
      "</span>" +
      '<img src="' +
      joinAsset(assetBase, "footer-lang-chevron.svg") +
      '" width="12" height="12" alt="" />' +
      "</button>" +
      '<div class="ns-app__flyout ns-app__flyout--footer-lang" role="menu" aria-label="' +
      escapeHtml(switchLabel) +
      '" data-footer-language-menu hidden>' +
      renderLanguageItems(activeLanguage) +
      "</div>" +
      "</div>" +
      '<span class="ns-app__footer-divider" aria-hidden="true"><img src="' +
      joinAsset(assetBase, "footer-divider.svg") +
      '" width="1" height="12" alt="" /></span>' +
      '<p class="ns-app__footer-copy">©2016 Nota Sign</p>' +
      "</footer>";

    initSigningFooter(root);
  }

  function initSigningFooter(scope) {
    var root = scope || document;
    root.querySelectorAll(".ns-app__footer-lang-wrap").forEach(function (wrap) {
      if (wrap.getAttribute("data-ns-footer-language-ready") === "true") return;
      var trigger = wrap.querySelector("[data-footer-language-trigger]");
      var menu = wrap.querySelector("[data-footer-language-menu]");
      if (!trigger || !menu) return;

      function close() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      }

      function open() {
        document.querySelectorAll(".ns-app__footer-lang-wrap.is-open").forEach(function (openWrap) {
          if (openWrap !== wrap && openWrap.NotaSignFooterLanguageClose) openWrap.NotaSignFooterLanguageClose();
        });
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        menu.removeAttribute("hidden");
      }

      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        wrap.classList.contains("is-open") ? close() : open();
      });

      menu.addEventListener("click", function (event) {
        var option = event.target.closest("[data-footer-language]");
        if (!option) return;
        event.preventDefault();
        event.stopPropagation();
        if (i18n()) i18n().setLanguage(option.getAttribute("data-footer-language"));
        close();
      });

      document.addEventListener(
        "click",
        function (event) {
          if (!wrap.contains(event.target)) close();
        },
        true
      );

      wrap.NotaSignFooterLanguageClose = close;
      wrap.setAttribute("data-ns-footer-language-ready", "true");
    });
  }

  function initSigningFooters() {
    document.querySelectorAll("[data-ns-business-signing-footer]").forEach(function (root) {
      renderSigningFooter(root, {
        assetBase: root.getAttribute("data-asset-base") || undefined,
      });
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderSigningFooter = renderSigningFooter;
  window.NotaSignComponents.initSigningFooter = initSigningFooter;
  window.NotaSignComponents.initSigningFooters = initSigningFooters;

  initSigningFooters();
  window.addEventListener("notasign:languagechange", initSigningFooters);
})();
