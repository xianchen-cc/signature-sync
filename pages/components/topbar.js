/**
 * NotaSign business component: TopBar
 *
 * Atomic design contract:
 * - TopBar is a business component composed from foundation components.
 * - Main navigation MUST use the foundation Tabs primitive:
 *   .ns-tabs + .ns-tabs--topbar + .ns-tabs__button.
 * - Tab behavior MUST be initialized by components/tabs.js.
 * - Typical pages and UI Kit examples should render this component from this
 *   single source instead of duplicating topbar HTML.
 */
(function () {
  var DEFAULT_NAV_ITEMS = [
    { key: "home", labelKey: "nav.home" },
    { key: "signing", labelKey: "nav.signing" },
    { key: "templates", labelKey: "nav.templates" },
    { key: "admin", labelKey: "nav.admin" },
  ];

  var ADMIN_NAV_ITEMS = [
    { key: "signing", labelKey: "nav.signing" },
    { key: "templates", labelKey: "nav.templates" },
    { key: "admin", labelKey: "nav.admin" },
  ];

  function t(key) {
    return window.NotaSignComponents && window.NotaSignComponents.i18n ? window.NotaSignComponents.i18n.t(key) : key;
  }

  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function renderNav(items, activeKey) {
    return items
      .map(function (item) {
        var active = item.key === activeKey;
        return (
          '<li class="ns-tabs__tab" role="presentation">' +
          '<button type="button" class="ns-tabs__button' +
          (active ? " ns-tabs__button--active is-active" : "") +
          '" role="tab" aria-selected="' +
          (active ? "true" : "false") +
          '"' +
          (active ? "" : ' tabindex="-1"') +
          ' data-topbar-tab="' +
          item.key +
          '">' +
          (item.labelKey ? t(item.labelKey) : item.label) +
          "</button>" +
          "</li>"
        );
      })
      .join("");
  }

  function renderTopbar(root, options) {
    var assetBase = options.assetBase || "assets/signing-list";
    var activeTab = options.activeTab || "signing";
    var userName = options.userName || "包小豸";
    var userEmail = options.userEmail || "lovelywhitego@gmail.com";
    var workspaceName = options.workspaceName || "Merckgroup's workspace";
    var workspaceId = options.workspaceId || "101158366669039106";
    var navItems = options.navItems || (options.navProfile === "admin" ? ADMIN_NAV_ITEMS : DEFAULT_NAV_ITEMS);

    root.innerHTML =
      '<header class="ns-app__topbar ns-business-topbar" role="banner">' +
      '<div class="ns-app__topbar-start">' +
      '<a class="ns-app__brand" href="#" aria-label="NotaSign">' +
      '<img class="ns-app__brand-logo" src="' +
      joinAsset(assetBase, "logo-notasign.svg") +
      '" width="68" height="38" alt="NotaSign" />' +
      "</a>" +
      '<nav class="ns-tabs ns-tabs--topbar ns-app__main-nav" aria-label="主导航" data-ns-tabs>' +
      '<ul class="ns-tabs__list" role="tablist">' +
      renderNav(navItems, activeTab) +
      "</ul>" +
      "</nav>" +
      "</div>" +
      '<div class="ns-app__topbar-end">' +
      '<div class="ns-app__flyout-wrap">' +
      '<button type="button" class="ns-app__help-btn" aria-label="' +
      t("help.label") +
      '" aria-expanded="false" aria-haspopup="menu" data-flyout-trigger="help">' +
      '<img class="ns-app__help-icon" src="' +
      joinAsset(assetBase, "icon-help.svg") +
      '" width="18" height="18" alt="" />' +
      "</button>" +
      '<div class="ns-app__flyout ns-app__flyout--help" role="menu" aria-label="' +
      t("help.label") +
      '" data-flyout="help">' +
      '<a href="#" class="ns-app__flyout-menu-item" role="menuitem"><img src="' +
      joinAsset(assetBase, "help-center.svg") +
      '" width="20" height="20" alt="" /><span class="ns-i18n-ellipsis">' +
      t("help.center") +
      "</span></a>" +
      '<a href="#" class="ns-app__flyout-menu-item" role="menuitem"><img src="' +
      joinAsset(assetBase, "help-service.svg") +
      '" width="20" height="20" alt="" /><span class="ns-i18n-ellipsis">' +
      t("help.service") +
      "</span></a>" +
      '<a href="#" class="ns-app__flyout-menu-item" role="menuitem"><img src="' +
      joinAsset(assetBase, "help-feedback.svg") +
      '" width="20" height="20" alt="" /><span class="ns-i18n-ellipsis">' +
      t("help.feedback") +
      "</span></a>" +
      "</div>" +
      "</div>" +
      '<div class="ns-app__flyout-wrap ns-app__flyout-wrap--user">' +
      '<button type="button" class="ns-app__user-trigger" aria-label="' +
      t("account.menu") +
      '" aria-expanded="false" aria-haspopup="menu" data-flyout-trigger="user">' +
      '<span class="ns-app__user-avatar" aria-hidden="true">' +
      '<img class="ns-app__user-avatar-bg" src="' +
      joinAsset(assetBase, "avatar-bg.svg") +
      '" width="32" height="32" alt="" />' +
      '<img class="ns-app__user-avatar-photo" src="' +
      joinAsset(assetBase, "avatar-photo.svg") +
      '" width="25" height="27" alt="" />' +
      "</span>" +
      '<span class="ns-app__user-name">' +
      userName +
      "</span>" +
      '<img class="ns-app__user-chevron" src="' +
      joinAsset(assetBase, "icon-chevron-down.svg") +
      '" width="14" height="14" alt="" />' +
      "</button>" +
      '<div class="ns-app__flyout ns-app__flyout--user" role="menu" aria-label="' +
      t("account.label") +
      '" data-flyout="user">' +
      '<div class="ns-app__user-panel-head"><p class="ns-app__user-panel-name">' +
      userName +
      '</p><p class="ns-app__user-panel-email">' +
      userEmail +
      "</p></div>" +
      '<div class="ns-app__user-panel-workspace">' +
      '<div class="ns-app__user-panel-workspace-row"><span>' +
      workspaceName +
      '</span><span class="ns-app__user-panel-badge">' +
      t("account.default") +
      "</span></div>" +
      '<p class="ns-app__user-panel-id">ID: ' +
      workspaceId +
      "</p>" +
      '<button type="button" class="ns-app__user-panel-switch"><img src="' +
      joinAsset(assetBase, "icon-switch-space.svg") +
      '" width="14" height="14" alt="" /><span>' +
      t("account.switchWorkspace") +
      "</span></button>" +
      "</div>" +
      '<hr class="ns-app__user-panel-divider" />' +
      '<div class="ns-app__user-panel-actions">' +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--plain" role="menuitem">' +
      t("account.profile") +
      "</a>" +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--plain" role="menuitem">' +
      t("account.settings") +
      "</a>" +
      '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--plain" role="menuitem">' +
      t("account.logout") +
      "</a>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</header>";
  }

  function initTopbars() {
    document.querySelectorAll("[data-ns-business-topbar]").forEach(function (root) {
      renderTopbar(root, {
        assetBase: root.getAttribute("data-asset-base") || undefined,
        activeTab: root.getAttribute("data-active-tab") || undefined,
        navProfile: root.getAttribute("data-nav-profile") || undefined,
        userName: root.getAttribute("data-user-name") || undefined,
      });
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderTopbar = renderTopbar;
  window.NotaSignComponents.initTopbars = initTopbars;

  initTopbars();
  window.addEventListener("notasign:languagechange", initTopbars);
})();
