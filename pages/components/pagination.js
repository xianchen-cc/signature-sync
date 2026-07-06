/**
 * NotaSign foundation component: Pagination
 *
 * Atomic design contract:
 * - Pagination controls page navigation and page-size selection only.
 * - Data slicing belongs to the consuming table/list component, which listens
 *   for the notasign:paginationchange event.
 * - The page-size dropdown reuses the shared flyout surface used by language
 *   switching so all click dropdowns feel consistent.
 */
(function () {
  var DEFAULT_PAGE_SIZES = [10, 20, 30];

  function t(key) {
    return window.NotaSignComponents && window.NotaSignComponents.i18n ? window.NotaSignComponents.i18n.t(key) : key;
  }

  function language() {
    return window.NotaSignComponents && window.NotaSignComponents.i18n
      ? window.NotaSignComponents.i18n.getLanguage()
      : "zh-CN";
  }

  function joinAsset(base, name) {
    return String(base || "").replace(/\/$/, "") + "/" + name;
  }

  function formatTotal(total) {
    if (language() === "en") return String(total) + " total";
    return "共" + total + (language() === "zh-TW" ? "條" : "条");
  }

  function formatPageSize(size) {
    if (language() === "en") return size + "/page";
    return size + (language() === "zh-TW" ? "條/頁" : "条/页");
  }

  function emitChange(pagination, detail) {
    pagination.dispatchEvent(
      new CustomEvent("notasign:paginationchange", {
        bubbles: true,
        detail: detail,
      })
    );
  }

  function readState(pagination) {
    var pageSize = Number(pagination.getAttribute("data-page-size") || 10);
    var currentPage = Number(pagination.getAttribute("data-current-page") || 1);
    var total = Number(pagination.getAttribute("data-total") || 0);
    var pageCount = Math.max(1, Math.ceil(total / pageSize));

    currentPage = Math.min(Math.max(1, currentPage), pageCount);
    return {
      pageSize: pageSize,
      currentPage: currentPage,
      total: total,
      pageCount: pageCount,
    };
  }

  function renderSizeOptions(pageSizes, pageSize) {
    return pageSizes
      .map(function (size) {
        return (
          '<button type="button" class="ns-app__pagination-size-option' +
          (size === pageSize ? " is-selected" : "") +
          '" role="menuitemradio" aria-checked="' +
          (size === pageSize ? "true" : "false") +
          '" data-pagination-page-size="' +
          size +
          '"><span class="ns-i18n-ellipsis">' +
          formatPageSize(size) +
          "</span></button>"
        );
      })
      .join("");
  }

  function renderPagination(options) {
    var opts = options || {};
    var assetBase = opts.assetBase || "assets/signing-list";
    var total = Number(opts.total || 0);
    var pageSize = Number(opts.pageSize || 10);
    var currentPage = Number(opts.currentPage || 1);
    var pageSizes = opts.pageSizes || DEFAULT_PAGE_SIZES;
    var pageCount = Math.max(1, Math.ceil(total / pageSize));
    var visiblePages = [1, 2, 3, 4, 5].filter(function (page) {
      return page <= pageCount;
    });

    return (
      '<div class="ns-app__pagination-bar">' +
      '<nav class="ns-app__pagination" aria-label="' +
      t("pagination.page") +
      '" data-ns-pagination data-page-size="' +
      pageSize +
      '" data-current-page="' +
      currentPage +
      '" data-total="' +
      total +
      '">' +
      '<span class="ns-app__pagination-total">' +
      formatTotal(total) +
      "</span>" +
      '<button type="button" class="ns-app__pagination-arrow" data-pagination-prev ' +
      (currentPage <= 1 ? "disabled " : "") +
      'aria-label="' +
      t("pagination.prev") +
      '"><img src="' +
      joinAsset(assetBase, "pagination-prev.svg") +
      '" width="16" height="16" alt="" /></button>' +
      '<ul class="ns-app__pagination-pages">' +
      visiblePages
        .map(function (page) {
          return (
            '<li><button type="button" class="ns-app__pagination-page' +
            (page === currentPage ? " is-active" : "") +
            '" data-pagination-page="' +
            page +
            '">' +
            page +
            "</button></li>"
          );
        })
        .join("") +
      (pageCount > 6 ? '<li><button type="button" class="ns-app__pagination-page">…</button></li>' : "") +
      (pageCount > 5
        ? '<li><button type="button" class="ns-app__pagination-page" data-pagination-page="' +
          pageCount +
          '">' +
          pageCount +
          "</button></li>"
        : "") +
      "</ul>" +
      '<button type="button" class="ns-app__pagination-arrow" data-pagination-next ' +
      (currentPage >= pageCount ? "disabled " : "") +
      'aria-label="' +
      t("pagination.next") +
      '"><img src="' +
      joinAsset(assetBase, "pagination-next.svg") +
      '" width="16" height="16" alt="" /></button>' +
      '<div class="ns-app__flyout-wrap ns-app__pagination-size-wrap">' +
      '<button type="button" class="ns-app__pagination-size" aria-expanded="false" aria-haspopup="menu" data-pagination-size-trigger>' +
      '<span>' +
      formatPageSize(pageSize) +
      '</span><img src="' +
      joinAsset(assetBase, "pagination-size-chevron.svg") +
      '" width="14" height="14" alt="" /></button>' +
      '<div class="ns-app__flyout ns-app__flyout--pagination-size" role="menu" aria-label="' +
      t("pagination.pageSize") +
      '" data-pagination-size-menu hidden>' +
      renderSizeOptions(pageSizes, pageSize) +
      "</div>" +
      "</div>" +
      '<span class="ns-app__pagination-jump-label">' +
      t("pagination.goto") +
      "</span>" +
      '<input class="ns-app__pagination-jump-input" type="text" inputmode="numeric" aria-label="' +
      t("pagination.page") +
      '" />' +
      '<span class="ns-app__pagination-jump-label">' +
      t("pagination.page") +
      "</span>" +
      "</nav>" +
      "</div>"
    );
  }

  function initPagination(scope) {
    var root = scope || document;
    root.querySelectorAll("[data-ns-pagination]").forEach(function (pagination) {
      if (pagination.getAttribute("data-ns-pagination-ready") === "true") return;
      var wrap = pagination.querySelector(".ns-app__pagination-size-wrap");
      var trigger = pagination.querySelector("[data-pagination-size-trigger]");
      var menu = pagination.querySelector("[data-pagination-size-menu]");
      if (!wrap || !trigger || !menu) return;

      function close() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      }

      function open() {
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
        var option = event.target.closest("[data-pagination-page-size]");
        if (!option) return;
        event.preventDefault();
        event.stopPropagation();
        emitChange(pagination, {
          pageSize: Number(option.getAttribute("data-pagination-page-size")),
          currentPage: 1,
        });
        close();
      });

      pagination.querySelectorAll("[data-pagination-prev]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          if (button.disabled) return;
          event.preventDefault();
          var state = readState(pagination);
          emitChange(pagination, {
            pageSize: state.pageSize,
            currentPage: state.currentPage - 1,
          });
        });
      });

      pagination.querySelectorAll("[data-pagination-next]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          if (button.disabled) return;
          event.preventDefault();
          var state = readState(pagination);
          emitChange(pagination, {
            pageSize: state.pageSize,
            currentPage: state.currentPage + 1,
          });
        });
      });

      pagination.querySelectorAll("[data-pagination-page]").forEach(function (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          var page = Number(button.getAttribute("data-pagination-page"));
          if (!page) return;
          var state = readState(pagination);
          if (page === state.currentPage) return;
          emitChange(pagination, {
            pageSize: state.pageSize,
            currentPage: page,
          });
        });
      });

      var jumpInput = pagination.querySelector(".ns-app__pagination-jump-input");
      if (jumpInput) {
        jumpInput.addEventListener("keydown", function (event) {
          if (event.key !== "Enter") return;
          event.preventDefault();
          var page = Number(jumpInput.value);
          if (!page) return;
          var state = readState(pagination);
          emitChange(pagination, {
            pageSize: state.pageSize,
            currentPage: page,
          });
        });
      }

      document.addEventListener(
        "click",
        function (event) {
          if (!wrap.contains(event.target)) close();
        },
        true
      );

      pagination.setAttribute("data-ns-pagination-ready", "true");
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.renderPagination = renderPagination;
  window.NotaSignComponents.initPagination = initPagination;

  initPagination(document);
})();
