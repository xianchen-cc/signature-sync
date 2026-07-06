/**
 * NotaSign foundation component: InputNumber
 */
(function () {
  function initInputNumbers(scope) {
    var root = scope || document;

    root.querySelectorAll(".ns-input-number").forEach(function (wrap) {
      if (wrap.getAttribute("data-ns-input-number-ready") === "true") return;

      var input = wrap.querySelector(".ns-input-number__input");
      var increaseButton = wrap.querySelector(".ns-input-number__btn--increase");
      var decreaseButton = wrap.querySelector(".ns-input-number__btn--decrease");
      if (!input || !increaseButton || !decreaseButton) return;

      function parseValue() {
        var value = parseInt(String(input.value || "0"), 10);
        return Number.isFinite(value) ? value : 0;
      }

      decreaseButton.addEventListener("click", function () {
        if (input.disabled || decreaseButton.disabled) return;
        var next = Math.max(1, parseValue() - 1);
        input.value = String(next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      increaseButton.addEventListener("click", function () {
        if (input.disabled || increaseButton.disabled) return;
        input.value = String(parseValue() + 1);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      wrap.setAttribute("data-ns-input-number-ready", "true");
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.initInputNumbers = initInputNumbers;

  initInputNumbers(document);
})();
