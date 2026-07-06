/**
 * NotaSign foundation component: Input
 *
 * Atomic design contract:
 * - SearchInput is a foundation input variant composed from .ns-input,
 *   .ns-input__prefix and .ns-input__clear.
 * - Business components and typical pages should reuse these classes instead
 *   of creating page-specific search input behavior.
 */
(function () {
  function initInputClearButtons(scope) {
    var root = scope || document;

    root.querySelectorAll("[data-search-input]").forEach(function (input) {
      var wrap = input.closest(".ns-input--search");
      var clearBtn = wrap ? wrap.querySelector("[data-search-clear]") : null;
      if (!clearBtn || input.getAttribute("data-ns-input-clear-ready") === "true") return;

      function syncInputState() {
        var hasValue = input.value.length > 0;
        clearBtn.hidden = !hasValue;
        wrap.classList.toggle("is-filled", hasValue);
      }

      clearBtn.addEventListener("click", function () {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        syncInputState();
      });

      input.addEventListener("input", syncInputState);
      input.addEventListener("focus", function () {
        wrap.classList.add("is-focused");
      });
      input.addEventListener("blur", function () {
        wrap.classList.remove("is-focused");
        syncInputState();
      });
      input.setAttribute("data-ns-input-clear-ready", "true");
      syncInputState();
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.initInputClearButtons = initInputClearButtons;

  initInputClearButtons(document);
})();
