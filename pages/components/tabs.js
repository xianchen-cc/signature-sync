/**
 * NotaSign foundation component: Tabs
 *
 * Atomic design contract:
 * - Tabs is a foundation component.
 * - Business components such as TopBar must compose this component instead of
 *   re-implementing tab state, aria attributes, or indicator animation.
 * - Typical pages should initialize tabs through this shared module.
 */
(function () {
  function getActiveButton(tabs) {
    return (
      tabs.querySelector('.ns-tabs__button[aria-selected="true"]') ||
      tabs.querySelector(".ns-tabs__button.is-active") ||
      tabs.querySelector(".ns-tabs__button")
    );
  }

  function updateIndicator(tabs, activeButton, skipAnimation) {
    var indicator = tabs.querySelector(".ns-tabs__indicator");
    var list = tabs.querySelector(".ns-tabs__list");
    if (!indicator || !list || !activeButton) return;

    var listRect = list.getBoundingClientRect();
    var buttonRect = activeButton.getBoundingClientRect();
    var canMeasure = buttonRect.width > 0 && listRect.width > 0;

    if (skipAnimation) indicator.style.transition = "none";
    indicator.style.width = buttonRect.width + "px";
    indicator.style.transform = "translateX(" + (buttonRect.left - listRect.left) + "px)";
    tabs.classList.toggle("ns-tabs--indicator-ready", canMeasure);
    if (skipAnimation) {
      indicator.offsetHeight;
      indicator.style.transition = "";
    }
  }

  function activateTab(tabs, activeButton, skipAnimation) {
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll(".ns-tabs__button"));
    buttons.forEach(function (button) {
      var isActive = button === activeButton;
      var panelId = button.getAttribute("aria-controls");
      button.classList.toggle("ns-tabs__button--active", isActive);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        button.removeAttribute("tabindex");
      } else {
        button.setAttribute("tabindex", "-1");
      }
      if (panelId) {
        var panel = document.getElementById(panelId);
        if (panel) panel.hidden = !isActive;
      }
    });
    updateIndicator(tabs, activeButton, skipAnimation);
  }

  function initTabs(scope) {
    (scope || document).querySelectorAll("[data-ns-tabs]").forEach(function (tabs) {
      if (tabs.getAttribute("data-ns-tabs-ready") === "true") {
        refreshTabs(tabs);
        return;
      }

      var buttons = Array.prototype.slice.call(tabs.querySelectorAll(".ns-tabs__button"));
      var list = tabs.querySelector(".ns-tabs__list");
      if (!buttons.length || !list) return;

      var indicator = list.querySelector(".ns-tabs__indicator");
      if (!indicator) {
        indicator = document.createElement("span");
        indicator.className = "ns-tabs__indicator";
        indicator.setAttribute("aria-hidden", "true");
        list.appendChild(indicator);
      }
      tabs.classList.add("ns-tabs--enhanced");
      tabs.setAttribute("data-ns-tabs-ready", "true");

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activateTab(tabs, button);
        });
      });

      var initialButton = getActiveButton(tabs);
      activateTab(tabs, initialButton, true);
      window.requestAnimationFrame(function () {
        updateIndicator(tabs, initialButton, true);
      });
    });
  }

  function refreshTabs(scope) {
    (scope || document).querySelectorAll("[data-ns-tabs]").forEach(function (tabs) {
      updateIndicator(tabs, getActiveButton(tabs), true);
    });
  }

  window.NotaSignComponents = window.NotaSignComponents || {};
  window.NotaSignComponents.initTabs = initTabs;
  window.NotaSignComponents.refreshTabs = refreshTabs;

  window.addEventListener("resize", function () {
    refreshTabs(document);
  });
})();
