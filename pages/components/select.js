/**
 * NotaSign foundation component: Select
 *
 * Atomic design contract:
 * - Select uses a custom trigger + menu so the dropdown surface is consistent
 *   across browsers and can match the Figma dropdown spec.
 * - Business components and typical pages should render .ns-select with
 *   data-ns-select instead of native select UI for settled dropdowns.
 */
(function () {
  function translatePlaceholder(select) {
    var key = select.getAttribute("data-placeholder-key");
    var service = window.NotaSignComponents && window.NotaSignComponents.i18n;
    return key && service ? service.t(key) : select.getAttribute("data-placeholder") || "";
  }

  function initSelects(scope) {
    var root = scope || document;

    root.querySelectorAll("[data-ns-select]").forEach(function (select) {
      if (select.getAttribute("data-ns-select-ready") === "true") return;

      var trigger = select.querySelector(".ns-select__trigger");
      var valueEl = select.querySelector(".ns-select__value");
      var menu = select.querySelector(".ns-select__menu");
      var options = Array.prototype.slice.call(select.querySelectorAll(".ns-select__option"));
      var defaultValue = select.getAttribute("data-default-value") || select.getAttribute("data-value") || "";

      if (!trigger || !valueEl || !menu || !options.length) return;

      function close() {
        select.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      }

      function open() {
        document.querySelectorAll("[data-ns-select].is-open").forEach(function (openSelect) {
          if (openSelect !== select && openSelect.NotaSignSelectClose) openSelect.NotaSignSelectClose();
        });
        select.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        menu.removeAttribute("hidden");
      }

      function getOptionTriggerLabel(option) {
        var triggerText = option.getAttribute("data-trigger-text");
        return triggerText || option.textContent.trim();
      }

      function setValue(value) {
        var selected = options.find(function (option) {
          return option.getAttribute("data-value") === value;
        });

        options.forEach(function (option) {
          var active = option === selected;
          option.classList.toggle("is-selected", active);
          option.setAttribute("aria-selected", active ? "true" : "false");
        });

        select.setAttribute("data-value", selected ? value : "");
        valueEl.textContent = selected ? getOptionTriggerLabel(selected) : translatePlaceholder(select);
        select.classList.toggle("ns-select--placeholder", !selected);
      }

      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (select.classList.contains("is-open")) {
          close();
        } else {
          open();
        }
      });

      options.forEach(function (option) {
        option.addEventListener("click", function () {
          setValue(option.getAttribute("data-value") || "");
          close();
          trigger.focus();
        });
      });

      document.addEventListener("click", function (e) {
        if (!select.contains(e.target)) close();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });

      var form = select.closest("form");
      if (form) {
        form.addEventListener("reset", function () {
          window.setTimeout(function () {
            setValue(defaultValue);
            close();
          }, 0);
        });
      }

      select.NotaSignSelectClose = close;
      select.NotaSignSelectRefreshLabel = function () {
        setValue(select.getAttribute("data-value") || defaultValue);
      };
      select.setAttribute("data-ns-select-ready", "true");
      setValue(select.getAttribute("data-value") || defaultValue);
    });
  }

  function refreshSelectLabels(scope) {
    var root = scope || document;
    root.querySelectorAll("[data-ns-select]").forEach(function (select) {
      if (select.NotaSignSelectRefreshLabel) select.NotaSignSelectRefreshLabel();
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.initSelects = initSelects;
  window.NotaSignComponents.refreshSelectLabels = refreshSelectLabels;

  initSelects(document);
  window.addEventListener("notasign:languagechange", function () {
    refreshSelectLabels(document);
  });
})();
