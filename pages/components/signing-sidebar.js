/**
 * NotaSign business component: SigningSidebar
 *
 * Atomic design contract:
 * - SigningSidebar is a business component composed from foundation primitives
 *   such as buttons, links, icons, and flyouts.
 * - Typical signing pages and UI Kit business docs should render this component
 *   from this single source instead of duplicating sidebar HTML.
 */
(function () {
  var DEFAULT_ITEMS = [
    { key: "all", labelKey: "sidebar.all", icon: "sidebar-all-tasks.svg" },
    { type: "divider" },
    { key: "inbox", labelKey: "sidebar.inbox", icon: "sidebar-inbox.svg" },
    { key: "sent", labelKey: "sidebar.sent", icon: "sidebar-sent.svg" },
    { key: "drafts", labelKey: "sidebar.drafts", icon: "sidebar-drafts.svg" },
    { key: "bulk", labelKey: "sidebar.bulk", icon: "sidebar-all-tasks.svg" },
    { type: "divider" },
    { key: "pending-me", labelKey: "sidebar.pendingMe", icon: "sidebar-pending-me.svg" },
    { key: "pending-others", labelKey: "sidebar.pendingOthers", icon: "sidebar-pending-others.svg" },
    { key: "completed", labelKey: "sidebar.completed", icon: "sidebar-completed.svg" },
  ];

  function t(key) {
    return window.NotaSignComponents && window.NotaSignComponents.i18n ? window.NotaSignComponents.i18n.t(key) : key;
  }

  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function renderNavItems(items, activeKey, assetBase) {
    return items
      .map(function (item) {
        if (item.type === "divider") {
          return (
            '<li class="ns-app__sidebar-divider" aria-hidden="true">' +
            '<img src="' +
            joinAsset(assetBase, "sidebar-divider.svg") +
            '" width="196" height="8" alt="" />' +
            "</li>"
          );
        }

        return (
          "<li>" +
          '<a class="ns-app__sidebar-item' +
          (item.key === activeKey ? " is-active" : "") +
          '" href="#" data-sidebar-item="' +
          item.key +
          '">' +
          '<img class="ns-app__sidebar-icon" src="' +
          joinAsset(assetBase, item.icon) +
          '" width="16" height="16" alt="" />' +
          '<span class="ns-i18n-ellipsis">' +
          (item.labelKey ? t(item.labelKey) : item.label) +
          "</span>" +
          "</a>" +
          "</li>"
        );
      })
      .join("");
  }

  function renderSigningSidebar(root, options) {
    var assetBase = options.assetBase || "assets/signing-list";
    var activeItem = options.activeItem || "all";
    var items = options.items || DEFAULT_ITEMS;

    root.innerHTML =
      '<aside class="ns-app__sidebar ns-business-signing-sidebar" aria-label="' +
      t("sidebar.label") +
      '">' +
      '<div class="ns-app__sidebar-cta-wrap">' +
      '<div class="ns-app__flyout-wrap ns-app__sidebar-cta-anchor">' +
      '<button type="button" class="ns-btn ns-btn--lg ns-btn--primary ns-btn--block ns-btn--dropdown" aria-expanded="false" aria-haspopup="menu" data-flyout-trigger="sidebar-cta">' +
      '<span class="ns-btn__label">' +
      t("sidebar.cta") +
      "</span>" +
      '<img class="ns-btn__chevron" src="' +
      joinAsset(assetBase, "sidebar-cta-chevron.svg") +
      '" width="16" height="16" alt="" />' +
      "</button>" +
      '<div class="ns-app__flyout ns-app__flyout--sidebar-cta" role="menu" aria-label="' +
      t("sidebar.cta") +
      '" data-flyout="sidebar-cta" hidden>' +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--sidebar" role="menuitem"><img src="' +
      joinAsset(assetBase, "sidebar-cta-send-envelope.svg") +
      '" width="16" height="16" alt="" /><span class="ns-i18n-ellipsis">' +
      t("sidebar.sendEnvelope") +
      "</span></a>" +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--sidebar" role="menuitem"><img src="' +
      joinAsset(assetBase, "sidebar-cta-sign-doc.svg") +
      '" width="16" height="16" alt="" /><span class="ns-i18n-ellipsis">' +
      t("sidebar.signDoc") +
      "</span></a>" +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--sidebar" role="menuitem"><img src="' +
      joinAsset(assetBase, "sidebar-cta-bulk-send.svg") +
      '" width="16" height="16" alt="" /><span class="ns-i18n-ellipsis">' +
      t("sidebar.bulkSend") +
      "</span></a>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "<nav>" +
      '<ul class="ns-app__sidebar-nav">' +
      renderNavItems(items, activeItem, assetBase) +
      "</ul>" +
      "</nav>" +
      "</aside>";
  }

  function initSigningSidebars() {
    document.querySelectorAll("[data-ns-business-signing-sidebar]").forEach(function (root) {
      renderSigningSidebar(root, {
        assetBase: root.getAttribute("data-asset-base") || undefined,
        activeItem: root.getAttribute("data-active-item") || undefined,
      });
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderSigningSidebar = renderSigningSidebar;
  window.NotaSignComponents.initSigningSidebars = initSigningSidebars;

  initSigningSidebars();
  window.addEventListener("notasign:languagechange", initSigningSidebars);
})();
