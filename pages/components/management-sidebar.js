/**
 * NotaSign business component: ManagementSidebar
 *
 * Admin-area navigation with grouped section titles and icon menu items.
 * Typical management pages should render this component from this single source.
 */
(function () {
  var DEFAULT_SECTIONS = [
    {
      titleKey: "mgmt.section.admin",
      items: [
        { key: "workspace", labelKey: "mgmt.workspace", icon: "sidebar-workspace.svg" },
        { key: "members", labelKey: "mgmt.members", icon: "sidebar-members.svg" },
        { key: "roles", labelKey: "mgmt.roles", icon: "sidebar-roles.svg" },
        { key: "digital-sign", labelKey: "mgmt.digitalSign", icon: "sidebar-digital-sign.svg" },
        { key: "seal-manage", labelKey: "mgmt.sealManage", icon: "sidebar-seal-manage.svg" },
        { key: "e-seal", labelKey: "mgmt.eSeal", icon: "sidebar-e-seal.svg" },
        { key: "send-settings", labelKey: "mgmt.sendSettings", icon: "sidebar-send-settings.svg" },
        { key: "signing-prefs", labelKey: "mgmt.signingPrefs", icon: "sidebar-signing-prefs.svg" },
        { key: "security", labelKey: "mgmt.security", icon: "sidebar-security.svg" },
        { key: "cfr", labelKey: "mgmt.cfr", icon: "sidebar-cfr.svg" },
      ],
    },
    {
      titleKey: "mgmt.section.billing",
      items: [
        { key: "purchased", labelKey: "mgmt.purchased", icon: "sidebar-purchased.svg" },
        { key: "usage", labelKey: "mgmt.usage", icon: "sidebar-usage.svg" },
      ],
    },
    {
      titleKey: "mgmt.section.integration",
      items: [{ key: "apps", labelKey: "mgmt.apps", icon: "sidebar-apps.svg" }],
    },
  ];

  function t(key) {
    return window.NotaSignComponents && window.NotaSignComponents.i18n ? window.NotaSignComponents.i18n.t(key) : key;
  }

  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function renderItems(items, activeKey, assetBase) {
    return items
      .map(function (item) {
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

  function renderSections(sections, activeKey, assetBase) {
    return sections
      .map(function (section) {
        return (
          '<div class="ns-app__sidebar-section">' +
          '<p class="ns-app__sidebar-section-title">' +
          (section.titleKey ? t(section.titleKey) : section.title) +
          "</p>" +
          '<ul class="ns-app__sidebar-nav">' +
          renderItems(section.items, activeKey, assetBase) +
          "</ul>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderManagementSidebar(root, options) {
    var assetBase = options.assetBase || "assets/send-settings";
    var activeItem = options.activeItem || "send-settings";
    var sections = options.sections || DEFAULT_SECTIONS;

    root.innerHTML =
      '<aside class="ns-app__sidebar ns-business-management-sidebar" aria-label="' +
      t("mgmt.sidebar.label") +
      '">' +
      "<nav>" +
      renderSections(sections, activeItem, assetBase) +
      "</nav>" +
      "</aside>";
  }

  function initManagementSidebars() {
    document.querySelectorAll("[data-ns-business-management-sidebar]").forEach(function (root) {
      renderManagementSidebar(root, {
        assetBase: root.getAttribute("data-asset-base") || undefined,
        activeItem: root.getAttribute("data-active-item") || undefined,
      });
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderManagementSidebar = renderManagementSidebar;
  window.NotaSignComponents.initManagementSidebars = initManagementSidebars;

  initManagementSidebars();
  window.addEventListener("notasign:languagechange", initManagementSidebars);
})();
