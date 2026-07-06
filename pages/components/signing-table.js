/**
 * NotaSign business component: SigningTable
 *
 * Atomic design contract:
 * - SigningTable is the settled Table foundation example composed from Table,
 *   Button, status, flyout, and Pagination primitives.
 * - Typical signing pages and UI Kit business docs should render this component
 *   from this single source instead of duplicating table rows or action logic.
 */
(function () {
  var DEFAULT_ROWS = [
    {
      subject: "劳动合同签署劳动合同签署劳动合同签署",
      displaySubject: "劳动合同签署劳动合同签署劳动合...",
      statusKey: "filling",
      parties: "Bob，Katerina",
      startedAt: "2025-09-09 12:34:56",
      updatedAt: "2025-09-09 12:34:56",
    },
    {
      subject: "采购合同-季度框架协议续签",
      statusKey: "signing",
      parties: "Alice",
      startedAt: "2025-09-08 09:12:00",
      updatedAt: "2025-09-09 10:01:22",
    },
    {
      subject: "保密协议 NDA-2025-Q1",
      statusKey: "completed",
      parties: "法务部",
      startedAt: "2025-08-30 16:20:11",
      updatedAt: "2025-09-01 08:45:33",
    },
    {
      subject: "入职文件包-新员工签署",
      statusKey: "draft",
      parties: "HR 团队",
      startedAt: "2025-08-28 11:00:00",
      updatedAt: "2025-08-28 11:00:00",
    },
    {
      subject: "供应商框架协议 V2",
      statusKey: "filling",
      parties: "供应商 A",
      startedAt: "2025-08-25 14:22:18",
      updatedAt: "2025-08-26 09:15:40",
    },
    {
      subject: "房屋租赁合同续签",
      statusKey: "signing",
      parties: "业主方，租户方",
      startedAt: "2025-08-20 10:30:00",
      updatedAt: "2025-08-22 17:48:02",
    },
    {
      subject: "销售订单确认书-20250815",
      statusKey: "expired",
      parties: "销售一组",
      startedAt: "2025-08-15 08:00:00",
      updatedAt: "2025-08-16 12:00:00",
    },
    {
      subject: "项目验收单-Phase3",
      statusKey: "completed",
      parties: "项目组",
      startedAt: "2025-08-10 15:44:00",
      updatedAt: "2025-08-12 11:20:00",
    },
    {
      subject: "授权委托书-法人变更",
      statusKey: "filling",
      parties: "董事会秘书",
      startedAt: "2025-08-05 13:18:27",
      updatedAt: "2025-08-06 09:02:11",
    },
    {
      subject: "技术服务协议补充条款",
      statusKey: "draft",
      parties: "技术合作方",
      startedAt: "2025-08-01 10:00:00",
      updatedAt: "2025-08-01 10:00:00",
    },
  ];

  var PRIMARY_ACTIONS = {
    filling: { labelKey: "action.fill", tone: "primary" },
    signing: { labelKey: "action.sign", tone: "primary" },
    draft: { labelKey: "action.edit", tone: "muted" },
    completed: { labelKey: "action.view", tone: "muted" },
    expired: { labelKey: "action.view", tone: "muted" },
  };

  var MORE_MENUS = {
    progress: ["menu.reject", "menu.revoke", "menu.urge", "menu.edit", "menu.view", "menu.download"],
    completed: ["menu.view", "menu.download"],
    edit: ["menu.edit", "menu.view"],
  };

  var STATUS_DOT = {
    filling: "info",
    signing: "warning",
    completed: "success",
    draft: "normal",
    expired: "disabled",
  };

  var STATUS_I18N = {
    filling: "status.filling",
    signing: "status.signing",
    completed: "status.completed",
    draft: "status.draft",
    expired: "status.expired",
  };

  var STATUS_KEY_BY_LABEL = {
    填写中: "filling",
    签署中: "signing",
    已完成: "completed",
    完成: "completed",
    草稿: "draft",
    已失效: "expired",
  };

  function t(key) {
    return window.NotaSignComponents && window.NotaSignComponents.i18n ? window.NotaSignComponents.i18n.t(key) : key;
  }

  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function getMenuType(statusKey) {
    if (statusKey === "filling" || statusKey === "signing") return "progress";
    if (statusKey === "completed") return "completed";
    return "edit";
  }

  function normalizeStatusKey(row) {
    return row.statusKey || STATUS_KEY_BY_LABEL[row.status] || "draft";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildRows(total) {
    var count = Number(total || 99);
    var rows = [];
    for (var i = 0; i < count; i += 1) {
      var source = DEFAULT_ROWS[i % DEFAULT_ROWS.length];
      rows.push({
        subject: source.subject,
        displaySubject: source.displaySubject,
        statusKey: source.statusKey,
        parties: source.parties,
        startedAt: source.startedAt,
        updatedAt: source.updatedAt,
      });
    }
    return rows;
  }

  function renderMoreMenu(statusKey, assetBase) {
    var items = MORE_MENUS[getMenuType(statusKey)] || MORE_MENUS.edit;
    return (
      '<div class="ns-app__flyout-wrap ns-app__table-more-wrap">' +
      '<button type="button" class="ns-app__table-more-btn" aria-label="' +
      t("menu.more") +
      '" aria-haspopup="menu" aria-expanded="false" data-flyout-trigger="table-more">' +
      '<img src="' +
      joinAsset(assetBase, "icon-more-horizontal.svg") +
      '" width="24" height="24" alt="" />' +
      "</button>" +
      '<div class="ns-app__flyout ns-app__flyout--table-more" role="menu" aria-label="' +
      t("menu.more") +
      '" data-flyout="table-more" hidden>' +
      items
        .map(function (label) {
          return (
            '<a href="#" class="ns-app__flyout-menu-item ns-app__flyout-menu-item--table-more" role="menuitem">' +
            escapeHtml(t(label)) +
            "</a>"
          );
        })
        .join("") +
      "</div>" +
      "</div>"
    );
  }

  function renderRow(row, assetBase) {
    var statusKey = normalizeStatusKey(row);
    var action = PRIMARY_ACTIONS[statusKey] || PRIMARY_ACTIONS.draft;
    var dot = STATUS_DOT[statusKey] || "normal";
    var subject = row.displaySubject || row.subject;

    return (
      "<tr>" +
      '<td class="ns-table__cell--name"><div class="ns-table__ellipsis" title="' +
      escapeHtml(row.subject) +
      '">' +
      escapeHtml(subject) +
      "</div></td>" +
      '<td><span class="ns-table-status"><span class="ns-table-status__dot ns-table-status__dot--' +
      dot +
      '" aria-hidden="true"></span>' +
      escapeHtml(t(STATUS_I18N[statusKey])) +
      "</span></td>" +
      '<td class="ns-table__cell--meta">' +
      escapeHtml(row.parties) +
      "</td>" +
      '<td class="ns-table__cell--meta">' +
      escapeHtml(row.startedAt) +
      "</td>" +
      '<td class="ns-table__cell--meta">' +
      escapeHtml(row.updatedAt) +
      "</td>" +
      '<td class="ns-table__cell--actions"><div class="ns-table__ops">' +
      '<button type="button" class="ns-btn ns-btn--table ns-btn--table-' +
      action.tone +
      '">' +
      t(action.labelKey) +
      "</button>" +
      renderMoreMenu(statusKey, assetBase) +
      "</div></td>" +
      "</tr>"
    );
  }

  function getPaginationState(root, options) {
    var pageSize = Number(options.pageSize || root.getAttribute("data-page-size") || 10);
    var total = Number(options.total || root.getAttribute("data-total") || 99);
    var currentPage = Number(options.currentPage || root.getAttribute("data-current-page") || 1);
    var pageCount = Math.max(1, Math.ceil(total / pageSize));

    currentPage = Math.min(Math.max(1, currentPage), pageCount);
    return { pageSize: pageSize, total: total, currentPage: currentPage };
  }

  function sliceRowsForPage(allRows, pageSize, currentPage) {
    var start = (currentPage - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }

  function renderSigningTable(root, options) {
    var assetBase = options.assetBase || "assets/signing-list";
    var state = getPaginationState(root, options);

    root.setAttribute("data-page-size", String(state.pageSize));
    root.setAttribute("data-current-page", String(state.currentPage));
    root.setAttribute("data-total", String(state.total));

    var allRows = buildRows(state.total);
    var rows = sliceRowsForPage(allRows, state.pageSize, state.currentPage);
    var pagination = window.NotaSignComponents && window.NotaSignComponents.renderPagination
      ? window.NotaSignComponents.renderPagination({
          assetBase: assetBase,
          total: state.total,
          pageSize: state.pageSize,
          currentPage: state.currentPage,
          pageSizes: [10, 20, 30],
        })
      : "";

    root.innerHTML =
      '<div class="ns-table-wrapper ns-signing-table-wrapper">' +
      '<div class="ns-table-container">' +
      '<div class="ns-table-content">' +
      '<table class="ns-table ns-signing-table">' +
      '<colgroup><col class="col-subject" /><col class="col-status" /><col class="col-parties" /><col class="col-time" /><col class="col-time" /><col class="col-actions" /></colgroup>' +
      '<thead><tr><th scope="col">' +
      t("table.subject") +
      '</th><th scope="col">' +
      t("table.status") +
      '</th><th scope="col">' +
      t("table.parties") +
      '</th><th scope="col">' +
      t("table.startedAt") +
      '</th><th scope="col">' +
      t("table.updatedAt") +
      '</th><th scope="col" class="ns-table__col--actions">' +
      t("table.action") +
      "</th></tr></thead>" +
      "<tbody>" +
      rows
        .map(function (row) {
          return renderRow(row, assetBase);
        })
        .join("") +
      "</tbody></table></div></div>" +
      pagination +
      '<div data-ns-business-signing-footer data-asset-base="' +
      escapeHtml(assetBase) +
      '"></div></div>';

    initSigningTable(root);
    if (window.NotaSignComponents && window.NotaSignComponents.initPagination) {
      window.NotaSignComponents.initPagination(root);
    }
    if (window.NotaSignComponents && window.NotaSignComponents.renderSigningFooter) {
      root.querySelectorAll("[data-ns-business-signing-footer]").forEach(function (footerRoot) {
        window.NotaSignComponents.renderSigningFooter(footerRoot, {
          assetBase: footerRoot.getAttribute("data-asset-base") || undefined,
        });
      });
    }
  }

  function initSigningTable(scope) {
    var root = scope || document;

    root.querySelectorAll(".ns-app__table-more-wrap").forEach(function (wrap) {
      if (wrap.getAttribute("data-ns-table-more-ready") === "true") return;
      var trigger = wrap.querySelector("[data-flyout-trigger]");
      var flyout = wrap.querySelector("[data-flyout]");
      if (!trigger || !flyout) return;

      function positionFlyout() {
        var viewportGap = 8;
        var triggerGap = 4;
        var triggerRect = trigger.getBoundingClientRect();
        var tableContainer = trigger.closest(".ns-table-container");
        var boundaryRect = tableContainer ? tableContainer.getBoundingClientRect() : null;
        var boundaryTop = boundaryRect ? Math.max(viewportGap, boundaryRect.top) : viewportGap;
        var boundaryBottom = boundaryRect ? Math.min(window.innerHeight - viewportGap, boundaryRect.bottom) : window.innerHeight - viewportGap;

        flyout.style.removeProperty("--ns-table-more-flyout-max-height");
        var flyoutWidth = flyout.offsetWidth || 120;
        var flyoutHeight = flyout.offsetHeight || 0;
        var spaceBelow = boundaryBottom - triggerRect.bottom;
        var spaceAbove = triggerRect.top - boundaryTop;
        var shouldOpenUp = flyoutHeight > spaceBelow && spaceAbove > spaceBelow;
        var left = Math.max(8, Math.min(triggerRect.right - flyoutWidth, window.innerWidth - flyoutWidth - 8));
        var top = shouldOpenUp ? triggerRect.top - flyoutHeight - triggerGap : triggerRect.bottom + triggerGap;
        var maxHeight = shouldOpenUp ? spaceAbove - triggerGap : spaceBelow - triggerGap;

        top = Math.max(boundaryTop, Math.min(top, boundaryBottom - flyoutHeight));
        maxHeight = Math.max(120, maxHeight);

        flyout.style.setProperty("--ns-table-more-flyout-left", left + "px");
        flyout.style.setProperty("--ns-table-more-flyout-top", top + "px");
        flyout.style.setProperty("--ns-table-more-flyout-max-height", maxHeight + "px");
        flyout.setAttribute("data-placement", shouldOpenUp ? "top" : "bottom");
      }

      function close() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        flyout.setAttribute("hidden", "");
        flyout.style.removeProperty("--ns-table-more-flyout-left");
        flyout.style.removeProperty("--ns-table-more-flyout-top");
        flyout.style.removeProperty("--ns-table-more-flyout-max-height");
        flyout.removeAttribute("data-placement");
        window.removeEventListener("resize", positionFlyout);
        window.removeEventListener("scroll", positionFlyout, true);
      }

      function open() {
        document.querySelectorAll(".ns-app__table-more-wrap.is-open").forEach(function (openWrap) {
          if (openWrap !== wrap && openWrap.NotaSignTableMoreClose) openWrap.NotaSignTableMoreClose();
        });
        flyout.removeAttribute("hidden");
        positionFlyout();
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        window.addEventListener("resize", positionFlyout);
        window.addEventListener("scroll", positionFlyout, true);
      }

      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (wrap.classList.contains("is-open")) {
          close();
        } else {
          open();
        }
      });

      flyout.addEventListener("click", function (e) {
        if (e.target.closest('[role="menuitem"]')) e.preventDefault();
      });

      document.addEventListener(
        "click",
        function (e) {
          if (!wrap.contains(e.target)) close();
        },
        true
      );

      wrap.NotaSignTableMoreClose = close;
      wrap.setAttribute("data-ns-table-more-ready", "true");
    });

    if (root.matches && root.matches("[data-ns-business-signing-table]") && root.getAttribute("data-ns-signing-table-pagination-ready") !== "true") {
      root.addEventListener("notasign:paginationchange", function (event) {
        var detail = event.detail || {};
        var pageSize = Number(
          detail.pageSize != null ? detail.pageSize : root.getAttribute("data-page-size") || 10
        );
        var currentPage = Number(
          detail.currentPage != null ? detail.currentPage : root.getAttribute("data-current-page") || 1
        );
        renderSigningTable(root, {
          assetBase: root.getAttribute("data-asset-base") || undefined,
          pageSize: pageSize,
          currentPage: currentPage,
          total: root.getAttribute("data-total"),
        });
      });
      root.setAttribute("data-ns-signing-table-pagination-ready", "true");
    }
  }

  function initSigningTables() {
    document.querySelectorAll("[data-ns-business-signing-table]").forEach(function (root) {
      renderSigningTable(root, {
        assetBase: root.getAttribute("data-asset-base") || undefined,
      });
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderSigningTable = renderSigningTable;
  window.NotaSignComponents.initSigningTable = initSigningTable;
  window.NotaSignComponents.initSigningTables = initSigningTables;

  initSigningTables();
  window.addEventListener("notasign:languagechange", initSigningTables);
})();
