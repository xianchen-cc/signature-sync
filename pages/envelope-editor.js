/**
 * 控件拖拽编辑典型页 — 参与方颜色、拖拽放置、缩略图折叠、属性面板
 */
(function () {
  var PARTY_META = {
    purple: { name: "法大大科技有限公司" },
    blue: { name: "上海测试公司" },
    green: { name: "采购方代表" },
    orange: { name: "销售方代表" },
    gray: { name: "发起方填写" },
  };

  var PARTY_COLORS = {
    purple: { color: "#c6a7ff", bg: "rgb(198 167 255 / 24%)" },
    blue: { color: "#9ed8ff", bg: "rgb(158 216 255 / 24%)" },
    green: { color: "#9ceaca", bg: "rgb(156 234 202 / 24%)" },
    orange: { color: "#fad7b1", bg: "rgb(250 215 177 / 28%)" },
    gray: { color: "#cccccc", bg: "rgb(204 204 204 / 28%)" },
  };

  var PARTY_TOKENS = {
    purple: { color: "#c6a7ff", bg: "rgb(198 167 255 / 15%)", border: "rgb(198 167 255 / 30%)" },
    blue: { color: "#9ed8ff", bg: "rgb(158 216 255 / 15%)", border: "rgb(158 216 255 / 30%)" },
    green: { color: "#9ceaca", bg: "rgb(156 234 202 / 15%)", border: "rgb(156 234 202 / 30%)" },
    orange: { color: "#fad7b1", bg: "rgb(250 215 177 / 15%)", border: "rgb(250 215 177 / 30%)" },
    gray: { color: "#cccccc", bg: "rgb(204 204 204 / 18%)", border: "rgb(204 204 204 / 30%)" },
  };

  var ZOOM_VALUES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
  var BASE_PAGE_WIDTH = 680;
  /** 与 --ns-editor-cross-seal-width 保持一致 */
  var CROSS_SEAL_WIDTH = 128;
  var FIELD_SETTING_KEYS = [
    "hint",
    "sealUseScope",
    "sealSizeRule",
    "dateFormat",
    "dateFontSize",
    "textMultiline",
    "textFontFamily",
    "textFontSize",
    "imageRatio",
    "attachmentAllowMultiple",
    "handwriteFontSize",
    "handwriteGuide",
    "checkboxOptions",
  ];
  var FIELD_SETTING_ATTRS = {
    hint: "data-field-hint",
    sealUseScope: "data-field-seal-use-scope",
    sealSizeRule: "data-field-seal-size-rule",
    dateFormat: "data-field-date-format",
    dateFontSize: "data-field-date-font-size",
    textMultiline: "data-field-text-multiline",
    textFontFamily: "data-field-text-font-family",
    textFontSize: "data-field-text-font-size",
    imageRatio: "data-field-image-ratio",
    attachmentAllowMultiple: "data-field-attachment-allow-multiple",
    handwriteFontSize: "data-field-handwrite-font-size",
    handwriteGuide: "data-field-handwrite-guide",
    checkboxOptions: "data-field-checkbox-options",
  };
  var FIELD_DEFAULT_SETTINGS = {
    hint: "",
    sealUseScope: "authorized-seal",
    sealSizeRule: "control-size",
    dateFormat: "YYYY-MM-DD",
    dateFontSize: "14",
    textMultiline: "false",
    textFontFamily: "宋体",
    textFontSize: "12",
    imageRatio: "free",
    attachmentAllowMultiple: "true",
    handwriteFontSize: "14",
    handwriteGuide: "",
    checkboxOptions: '["选项1"]',
  };

  var FIELD_LAYOUTS = {
    signature: { width: 158, height: 86, minWidth: 80, minHeight: 48, anchorX: 79, anchorY: 43 },
    handwrite: { width: 158, height: 120, minWidth: 80, minHeight: 48, anchorX: 79, anchorY: 60 },
    seal: { width: 128, height: 128, minWidth: 64, minHeight: 64, anchorX: 64, anchorY: 64 },
    image: { width: 128, height: 128, minWidth: 64, minHeight: 64, anchorX: 64, anchorY: 64 },
    date: { width: 160, height: 30, minWidth: 160, minHeight: 30, anchorX: 80, anchorY: 15, resizable: false },
    text: { width: 160, height: 30, minWidth: 88, minHeight: 30, anchorX: 80, anchorY: 15 },
    checkbox: { width: 32, height: 32, minWidth: 32, minHeight: 32, anchorX: 16, anchorY: 16 },
  };

  var CHECKBOX_ITEM_GAP = 42;
  var CHECKBOX_GROUP_PADDING = 6;

  function getCrossSealFieldLayout() {
    return getFieldLayout("seal");
  }

  var CROSS_SEAL_LABEL = "骑缝章";

  function getCrossSealFieldHeight() {
    return getCrossSealFieldLayout().height;
  }

  function getCrossSealTracksForDoc(docId) {
    return Array.prototype.slice.call(document.querySelectorAll('[data-cross-seal-track][data-doc-id="' + docId + '"]'));
  }

  function getCrossSealPrimaryForDoc(docId) {
    var tracks = getCrossSealTracksForDoc(docId);
    for (var i = 0; i < tracks.length; i++) {
      var primary = tracks[i].querySelector("[data-cross-seal-primary]");
      if (primary) return primary;
    }
    return null;
  }

  function inferCrossSealPageY(field, docId) {
    var attr = field.getAttribute("data-cross-seal-page-y");
    if (attr != null && attr !== "") return parseFloat(attr);
    var top = parseFloat(field.style.top) || 0;
    var stack = document.querySelector('[data-doc-stack="' + docId + '"]');
    if (!stack) return top;
    var pages = stack.querySelectorAll("[data-pdf-page]");
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var pageTop = page.offsetTop;
      var pageHeight = page.offsetHeight;
      if (top < pageTop + pageHeight) {
        return clamp(top - pageTop, 0, Math.max(0, pageHeight - getCrossSealFieldHeight()));
      }
    }
    var firstPage = pages[0];
    if (!firstPage) return top;
    return clamp(top, 0, Math.max(0, firstPage.offsetHeight - getCrossSealFieldHeight()));
  }

  function getCrossSealPageY(field) {
    if (!field) return 0;
    var track = field.closest("[data-cross-seal-track]");
    var docId = track ? track.getAttribute("data-doc-id") : "";
    var primary = field.hasAttribute("data-cross-seal-primary") ? field : docId ? getCrossSealPrimaryForDoc(docId) : field;
    if (!primary) return parseFloat(field.style.top) || 0;
    var attr = primary.getAttribute("data-cross-seal-page-y");
    if (attr != null && attr !== "") return parseFloat(attr);
    return inferCrossSealPageY(primary, docId);
  }

  var FIELD_RESIZE_HANDLES = ["nw", "ne", "sw", "se"];
  var EDGE_RESIZE_THRESHOLD = 10;
  var FIELD_Z_BASE = 1;
  var FIELD_Z_ACTIVE_BASE = 10;
  var fieldZCounter = 0;
  var updateCanvasScrollActions = null;
  var fieldClipboard = null;

  function generateFieldCode(length) {
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var code = "";
    for (var i = 0; i < length; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function generateDefaultFieldName(typeLabel) {
    return (typeLabel || "控件") + " " + generateFieldCode(16);
  }

  function syncPropsNameDisplay(field) {
    var nameInput = document.querySelector("[data-props-name]");
    if (!nameInput || !field) return;
    nameInput.value = field.getAttribute("data-field-name") || "";
  }

  function getCheckboxGroup(node) {
    if (!node) return null;
    if (node.hasAttribute("data-checkbox-group")) return node;
    return node.closest("[data-checkbox-group]");
  }

  function resolveEditableField(field) {
    if (!field) return null;
    if (field.hasAttribute("data-checkbox-group")) return field;
    if (field.hasAttribute("data-checkbox-item")) return getCheckboxGroup(field);
    return field;
  }

  function getSettingsOwner(field) {
    return resolveEditableField(field) || field;
  }

  function getCheckboxGroupItems(group) {
    if (!group) return [];
    return Array.prototype.slice.call(group.querySelectorAll("[data-checkbox-item]"));
  }

  function getFieldSetting(field, key) {
    var owner = getSettingsOwner(field);
    if (!owner || !FIELD_SETTING_ATTRS[key]) return FIELD_DEFAULT_SETTINGS[key] || "";
    var value = owner.getAttribute(FIELD_SETTING_ATTRS[key]);
    return value == null || value === "" ? FIELD_DEFAULT_SETTINGS[key] || "" : value;
  }

  function setFieldSetting(field, key, value, options) {
    var owner = getSettingsOwner(field);
    if (!owner || !FIELD_SETTING_ATTRS[key]) return;
    options = options || {};
    owner.setAttribute(FIELD_SETTING_ATTRS[key], value == null ? "" : String(value));
    applyFieldStyleSettings(owner);
    if (!options.skipPreview) schedulePagePreviewSync(owner.closest("[data-pdf-page]"));
  }

  function getCheckboxOptions(field) {
    var raw = getFieldSetting(field, "checkboxOptions");
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(function (item) {
          return String(item || "").trim();
        }).filter(Boolean);
      }
    } catch (error) {
      // Ignore malformed legacy values and fall back to the default option.
    }
    return ["选项1"];
  }

  function syncCheckboxOptionLabels(group, options) {
    getCheckboxGroupItems(group).forEach(function (item, index) {
      if (options[index] != null) item.setAttribute("data-option-label", options[index]);
      item.setAttribute("data-option-index", String(index));
    });
  }

  function setCheckboxOptions(field, options, opts) {
    opts = opts || {};
    var group = getCheckboxGroup(field) || field;
    var normalized = (options || []).map(function (item) {
      return String(item || "").trim();
    }).filter(Boolean);
    if (!normalized.length) normalized = ["选项1"];
    group.setAttribute(FIELD_SETTING_ATTRS.checkboxOptions, JSON.stringify(normalized));
    syncCheckboxOptionLabels(group, normalized);
    if (!opts.skipPreview) schedulePagePreviewSync(group.closest("[data-pdf-page]"));
  }

  function getCheckboxGroupFrame(group) {
    if (!group) return null;
    return group.querySelector(".ns-envelope-editor-checkbox-group__frame");
  }

  function ensureCheckboxGroupFrame(group) {
    if (!group) return null;
    var frame = getCheckboxGroupFrame(group);
    if (!frame) {
      frame = document.createElement("div");
      frame.className = "ns-envelope-editor-checkbox-group__frame";
      frame.setAttribute("aria-hidden", "true");
      group.insertBefore(frame, group.firstChild);
    }
    Array.prototype.slice.call(frame.querySelectorAll("[data-checkbox-item]")).forEach(function (item) {
      var addBtn = group.querySelector("[data-checkbox-group-add]");
      if (addBtn) group.insertBefore(item, addBtn);
      else group.appendChild(item);
    });
    return frame;
  }

  function getCheckboxGroupPageOrigin(group) {
    var page = group.closest("[data-pdf-page]");
    if (!page) return { x: 0, y: 0 };
    var pageRect = page.getBoundingClientRect();
    var groupRect = group.getBoundingClientRect();
    var zoom = getCurrentZoom();
    return {
      x: (groupRect.left - pageRect.left) / zoom,
      y: (groupRect.top - pageRect.top) / zoom,
    };
  }

  function updateCheckboxGroupBounds(group) {
    var frame = ensureCheckboxGroupFrame(group);
    var items = getCheckboxGroupItems(group);
    if (!frame || !items.length) return;
    var padding = CHECKBOX_GROUP_PADDING;
    var minLeft = Infinity;
    var minTop = Infinity;
    var maxRight = 0;
    var maxBottom = 0;

    items.forEach(function (item) {
      var left = parseFloat(item.style.left) || 0;
      var top = parseFloat(item.style.top) || 0;
      minLeft = Math.min(minLeft, left);
      minTop = Math.min(minTop, top);
      maxRight = Math.max(maxRight, left + item.offsetWidth);
      maxBottom = Math.max(maxBottom, top + item.offsetHeight);
    });

    var frameLeft = minLeft - padding;
    var frameTop = minTop - padding;
    var frameWidth = Math.ceil(maxRight - minLeft + padding * 2);
    var frameHeight = Math.ceil(maxBottom - minTop + padding * 2);

    frame.style.left = frameLeft + "px";
    frame.style.top = frameTop + "px";
    frame.style.width = frameWidth + "px";
    frame.style.height = frameHeight + "px";

    var addBtn = group.querySelector("[data-checkbox-group-add]");
    if (addBtn) {
      addBtn.style.left = frameLeft + frameWidth / 2 + "px";
      addBtn.style.top = frameTop + frameHeight + 8 + "px";
    }

    group.style.width = Math.ceil(frameLeft + frameWidth) + "px";
    group.style.height = Math.ceil(frameTop + frameHeight + 8 + 16) + "px";
  }

  function createCheckboxGroupItem(group, label, left, top, options) {
    options = options || {};
    var index = getCheckboxGroupItems(group).length;
    var item = document.createElement("button");
    item.type = "button";
    item.className = "ns-envelope-editor-field";
    if (options.isNew) item.classList.add("is-new-item");
    item.setAttribute("data-placed-field", "");
    item.setAttribute("data-checkbox-item", "");
    item.setAttribute("data-option-index", String(index));
    item.setAttribute("data-option-label", label);
    item.setAttribute("data-field-type", "checkbox");
    item.setAttribute("data-field-id", "field-" + Date.now() + "-" + index);
    applyFieldPresentation(
      item,
      "checkbox",
      group.getAttribute("data-field-label") || "复选框",
      group.getAttribute("data-field-icon") || "assets/envelope-editor/icon-checkbox.svg",
      { skipChrome: true }
    );
    applyFieldDefaultSize(item, "checkbox");
    item.style.left = left + "px";
    item.style.top = top + "px";
    syncFieldParty(item, group.getAttribute("data-party") || getActiveParty());
    item.setAttribute("data-field-required", group.getAttribute("data-field-required") || "true");
    item.addEventListener("click", function (event) {
      event.stopPropagation();
      if (item.dataset.dragMoved === "true") {
        item.dataset.dragMoved = "false";
        return;
      }
      openPropsPanel(item);
    });
    makeCheckboxItemDraggable(item, group);
    var addBtn = group.querySelector("[data-checkbox-group-add]");
    if (addBtn) group.insertBefore(item, addBtn);
    else group.appendChild(item);
    return item;
  }

  function addCheckboxGroupOption(group, label) {
    if (!group) return;
    var options = getCheckboxOptions(group);
    var nextLabel = label || "选项" + (options.length + 1);
    var items = getCheckboxGroupItems(group);
    var last = items[items.length - 1];
    var left = last ? parseFloat(last.style.left) || CHECKBOX_GROUP_PADDING : CHECKBOX_GROUP_PADDING;
    var top = last ? (parseFloat(last.style.top) || CHECKBOX_GROUP_PADDING) + CHECKBOX_ITEM_GAP : CHECKBOX_GROUP_PADDING;
    options.push(nextLabel);
    createCheckboxGroupItem(group, nextLabel, left, top, { isNew: true });
    setCheckboxOptions(group, options, { skipPreview: true });
    updateCheckboxGroupBounds(group);
    schedulePagePreviewSync(group.closest("[data-pdf-page]"));
    renderCheckboxOptions(group);
  }

  function removeCheckboxGroupOption(group, index) {
    if (!group) return;
    var options = getCheckboxOptions(group);
    if (options.length <= 1) return;
    var items = getCheckboxGroupItems(group);
    if (!items[index]) return;
    items[index].remove();
    options.splice(index, 1);
    setCheckboxOptions(group, options, { skipPreview: true });
    updateCheckboxGroupBounds(group);
    schedulePagePreviewSync(group.closest("[data-pdf-page]"));
    renderCheckboxOptions(group);
  }

  function positionCheckboxGroup(group, x, y) {
    var page = group.closest("[data-pdf-page]");
    if (!page) return;
    var maxLeft = page.clientWidth - group.offsetWidth - 8;
    var maxTop = page.clientHeight - group.offsetHeight - 8;
    group.style.left = clamp(Math.round(x), 8, maxLeft) + "px";
    group.style.top = clamp(Math.round(y), 8, maxTop) + "px";
    syncPropsPositionDisplay(group);
    schedulePagePreviewSync(page);
  }

  function createCheckboxGroup(page, x, y, options) {
    options = options || {};
    var group = document.createElement("div");
    var iconSrc = options.icon || "assets/envelope-editor/icon-checkbox.svg";
    group.className = "ns-envelope-editor-checkbox-group";
    group.setAttribute("data-checkbox-group", "");
    group.setAttribute("data-group-id", "group-" + Date.now());
    group.setAttribute("data-field-type", "checkbox");
    group.setAttribute("data-field-label", options.label || "复选框");
    group.setAttribute("data-field-name", options.name || generateDefaultFieldName("复选框"));
    group.setAttribute("data-field-icon", iconSrc);
    group.setAttribute("data-field-required", options.required != null ? options.required : "true");
    FIELD_SETTING_KEYS.forEach(function (key) {
      var value =
        options.settings && options.settings[key] != null ? options.settings[key] : FIELD_DEFAULT_SETTINGS[key];
      group.setAttribute(FIELD_SETTING_ATTRS[key], value);
    });

    var frame = document.createElement("div");
    frame.className = "ns-envelope-editor-checkbox-group__frame";
    frame.setAttribute("aria-hidden", "true");

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ns-envelope-editor-checkbox-group__add";
    addBtn.setAttribute("data-checkbox-group-add", "");
    addBtn.setAttribute("aria-label", "添加选项");
    addBtn.textContent = "+";
    addBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      addCheckboxGroupOption(group);
      openPropsPanel(group);
    });
    group.appendChild(frame);
    group.appendChild(addBtn);

    if (options.items && options.items.length) {
      options.items.forEach(function (itemData, index) {
        createCheckboxGroupItem(
          group,
          itemData.label || "选项" + (index + 1),
          itemData.left != null ? itemData.left : CHECKBOX_GROUP_PADDING,
          itemData.top != null ? itemData.top : CHECKBOX_GROUP_PADDING + index * CHECKBOX_ITEM_GAP
        );
      });
      setCheckboxOptions(
        group,
        options.items.map(function (itemData) {
          return itemData.label || "选项1";
        }),
        { skipPreview: true }
      );
    } else {
      createCheckboxGroupItem(group, "选项1", CHECKBOX_GROUP_PADDING, CHECKBOX_GROUP_PADDING);
      setCheckboxOptions(group, ["选项1"], { skipPreview: true });
    }

    syncFieldParty(group, options.party || getActiveParty());
    getCheckboxGroupItems(group).forEach(function (item) {
      syncFieldParty(item, group.getAttribute("data-party") || getActiveParty());
    });
    page.appendChild(group);
    updateCheckboxGroupBounds(group);
    positionCheckboxGroup(group, x, y);
    bringFieldToFront(group, false);
    return group;
  }

  function wrapLegacyCheckboxField(field) {
    var page = field.closest("[data-pdf-page]");
    if (!page || field.closest("[data-checkbox-group]")) return null;
    var left = parseFloat(field.style.left) || 8;
    var top = parseFloat(field.style.top) || 8;
    var optionLabels = ["选项1"];
    var rawOptions = field.getAttribute("data-field-checkbox-options");
    if (rawOptions) {
      try {
        var parsed = JSON.parse(rawOptions);
        if (Array.isArray(parsed) && parsed.length) optionLabels = parsed;
      } catch (error) {
        // Keep default option list.
      }
    }
    var items = optionLabels.map(function (label, index) {
      return {
        label: label,
        left: CHECKBOX_GROUP_PADDING,
        top: CHECKBOX_GROUP_PADDING + index * CHECKBOX_ITEM_GAP,
      };
    });
    var group = createCheckboxGroup(page, left, top, {
      label: field.getAttribute("data-field-label") || "复选框",
      name: field.getAttribute("data-field-name") || generateDefaultFieldName("复选框"),
      icon: field.getAttribute("data-field-icon") || "assets/envelope-editor/icon-checkbox.svg",
      party: field.getAttribute("data-party") || getActiveParty(),
      required: field.getAttribute("data-field-required") || "true",
      settings: (function () {
        var settings = {};
        FIELD_SETTING_KEYS.forEach(function (key) {
          settings[key] = field.getAttribute(FIELD_SETTING_ATTRS[key]) || FIELD_DEFAULT_SETTINGS[key];
        });
        return settings;
      })(),
      items: items,
    });
    field.remove();
    return group;
  }

  function makeCheckboxItemDraggable(item, group) {
    if (!item || item.hasAttribute("data-checkbox-item-drag-ready")) return;
    item.setAttribute("data-checkbox-item-drag-ready", "");

    item.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      event.stopPropagation();

      var page = group.closest("[data-pdf-page]");
      if (!page) return;

      var itemRect = item.getBoundingClientRect();
      var offsetX = (event.clientX - itemRect.left) / getCurrentZoom();
      var offsetY = (event.clientY - itemRect.top) / getCurrentZoom();
      var originX = event.clientX;
      var originY = event.clientY;
      var moved = false;

      item.setPointerCapture(event.pointerId);
      item.classList.add("is-dragging");
      openPropsPanel(item);
      bringFieldToFront(group, true);

      function onPointerMove(moveEvent) {
        var deltaX = Math.abs(moveEvent.clientX - originX);
        var deltaY = Math.abs(moveEvent.clientY - originY);
        if (deltaX > 3 || deltaY > 3) moved = true;
        var groupOffset = getCheckboxGroupPageOrigin(group);
        var point = getPagePoint(page, moveEvent.clientX, moveEvent.clientY);
        item.style.left = Math.round(point.x - offsetX - groupOffset.x) + "px";
        item.style.top = Math.round(point.y - offsetY - groupOffset.y) + "px";
      }

      function onPointerUp(upEvent) {
        item.releasePointerCapture(upEvent.pointerId);
        item.classList.remove("is-dragging");
        item.classList.remove("is-new-item");
        bringFieldToFront(group, false);
        item.removeEventListener("pointermove", onPointerMove);
        item.removeEventListener("pointerup", onPointerUp);
        item.removeEventListener("pointercancel", onPointerUp);
        item.dataset.dragMoved = moved ? "true" : "false";
        updateCheckboxGroupBounds(group);
        schedulePagePreviewSync(page);
      }

      item.addEventListener("pointermove", onPointerMove);
      item.addEventListener("pointerup", onPointerUp);
      item.addEventListener("pointercancel", onPointerUp);
    });
  }

  function applyFieldStyleSettings(field) {
    if (!field) return;
    var type = field.getAttribute("data-field-type");
    field.style.removeProperty("--ns-field-font-size");
    field.style.removeProperty("--ns-field-font-family");
    if (type === "date") {
      field.style.setProperty("--ns-field-font-size", getFieldSetting(field, "dateFontSize") + "px");
      return;
    }
    if (type === "text") {
      field.style.setProperty("--ns-field-font-size", getFieldSetting(field, "textFontSize") + "px");
      field.style.setProperty("--ns-field-font-family", getFieldSetting(field, "textFontFamily"));
      return;
    }
    if (type === "handwrite") {
      field.style.setProperty("--ns-field-font-size", getFieldSetting(field, "handwriteFontSize") + "px");
    }
  }

  function getSelectValue(select) {
    return select ? select.getAttribute("data-value") || "" : "";
  }

  function setSelectValue(select, value) {
    if (!select) return;
    select.setAttribute("data-value", value == null ? "" : String(value));
    if (select.NotaSignSelectRefreshLabel) {
      select.NotaSignSelectRefreshLabel();
    } else if (window.NotaSignComponents && window.NotaSignComponents.refreshSelectLabels) {
      window.NotaSignComponents.refreshSelectLabels(select.parentNode || select);
    }
  }

  function getEditor() {
    return document.querySelector("[data-envelope-editor]");
  }

  function getStage() {
    return document.querySelector(".ns-envelope-editor-stage");
  }

  function getCurrentZoom() {
    var stage = getStage();
    var zoom = stage ? parseFloat(stage.getAttribute("data-zoom") || "1") : 1;
    return Number.isFinite(zoom) ? zoom : 1;
  }

  function formatZoomLabel(zoom) {
    return Math.round(zoom * 100) + "%";
  }

  function getPagePoint(page, clientX, clientY) {
    var rect = page.getBoundingClientRect();
    var zoom = getCurrentZoom();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  }

  function getPageAtPoint(clientX, clientY) {
    var target = document.elementFromPoint(clientX, clientY);
    return target ? target.closest("[data-pdf-page]") : null;
  }

  function setZoom(zoom, options) {
    options = options || {};
    var stage = getStage();
    var root = getEditorRoot();
    var label = document.querySelector("[data-zoom-label]");
    var nextZoom = clamp(zoom, ZOOM_VALUES[0], ZOOM_VALUES[ZOOM_VALUES.length - 1]);
    if (!stage) return;

    stage.style.setProperty("--ns-editor-zoom", nextZoom);
    stage.setAttribute("data-zoom", String(nextZoom));
    if (root) root.classList.toggle("is-canvas-fit-width", !!options.fitToScreen);
    if (label) label.textContent = formatZoomLabel(nextZoom);

    document.querySelectorAll("[data-zoom-value]").forEach(function (option) {
      var value = parseFloat(option.getAttribute("data-zoom-value") || "0");
      var isActive = !options.fitToScreen && Math.abs(value - nextZoom) < 0.001;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    document.querySelectorAll("[data-zoom-fit]").forEach(function (option) {
      option.classList.toggle("is-active", !!options.fitToScreen);
      option.setAttribute("aria-selected", options.fitToScreen ? "true" : "false");
    });

    if (updateCanvasScrollActions) {
      requestAnimationFrame(updateCanvasScrollActions);
    }
    refreshCrossSealRailLayout();
    syncAllPagePreviews();
  }

  function getNextZoom(direction) {
    var current = getCurrentZoom();
    if (direction > 0) {
      return ZOOM_VALUES.find(function (value) {
        return value > current + 0.001;
      }) || ZOOM_VALUES[ZOOM_VALUES.length - 1];
    }
    return (
      ZOOM_VALUES.slice()
        .reverse()
        .find(function (value) {
          return value < current - 0.001;
        }) || ZOOM_VALUES[0]
    );
  }

  /**
   * 适合屏幕时参与计算的文档内容总宽度（含展开的骑缝章栏）。
   * @returns {number}
   */
  function getFitToScreenContentWidth() {
    var contentWidth = BASE_PAGE_WIDTH;
    if (isCrossSealEnabled() && !isCrossSealCollapsed()) {
      contentWidth += CROSS_SEAL_WIDTH;
    }
    return contentWidth;
  }

  /**
   * @returns {number}
   */
  function getFitToScreenZoom() {
    var canvas = document.querySelector("[data-canvas]");
    if (!canvas) return 1;
    var styles = window.getComputedStyle(canvas);
    var paddingX =
      (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    var availableWidth = Math.max(0, canvas.clientWidth - paddingX);
    return availableWidth / getFitToScreenContentWidth();
  }

  function getActiveParty() {
    return document.body.getAttribute("data-party") || "purple";
  }

  function syncFieldParty(field, party) {
    if (!field) return;
    var tokens = PARTY_TOKENS[party] || PARTY_TOKENS.purple;
    field.setAttribute("data-party", party);
    field.style.setProperty("--ns-editor-party-color", tokens.color);
    field.style.setProperty("--ns-editor-party-bg", tokens.bg);
    field.style.setProperty("--ns-editor-party-border", tokens.border);
    if (field.hasAttribute("data-checkbox-group")) {
      getCheckboxGroupItems(field).forEach(function (item) {
        syncFieldParty(item, party);
      });
    }
  }

  function updatePartyMenuOptions(menu, party) {
    if (!menu) return;
    menu.querySelectorAll("[data-party]").forEach(function (option) {
      var isActive = option.getAttribute("data-party") === party;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function syncPropsPartyDisplay(party) {
    var panel = document.querySelector("[data-props-panel]");
    if (!panel) return;
    var root = panel.querySelector("[data-props-party-selector]");
    var nameNode = panel.querySelector("[data-props-party-name]");
    var menu = panel.querySelector("[data-props-party-menu]");
    if (root) root.setAttribute("data-party", party);
    if (nameNode) nameNode.textContent = PARTY_META[party] ? PARTY_META[party].name : PARTY_META.purple.name;
    updatePartyMenuOptions(menu, party);
  }

  function setFieldPartyFromProps(party) {
    if (!PARTY_META[party]) return;
    var field = getEditingField();
    if (!field) return;
    syncFieldParty(field, party);
    syncPropsPartyDisplay(party);
    schedulePagePreviewSync(field.closest("[data-pdf-page]"));
  }

  function setActiveParty(party) {
    if (!PARTY_META[party]) return;
    document.body.setAttribute("data-party", party);
    document.querySelectorAll("[data-active-party-name]").forEach(function (node) {
      node.textContent = PARTY_META[party].name;
    });
    var globalMenu = document.querySelector("[data-party-menu]:not([data-props-party-menu])");
    updatePartyMenuOptions(globalMenu, party);
  }

  function closePartyMenus(openMenu) {
    document.querySelectorAll("[data-party-menu]").forEach(function (menu) {
      if (menu === openMenu) return;
      menu.setAttribute("hidden", "");
    });
    document.querySelectorAll(".ns-envelope-editor-party").forEach(function (root) {
      var trigger = root.querySelector("[data-party-menu-trigger]");
      var menu = root.querySelector("[data-party-menu]");
      if (!trigger || !menu || menu === openMenu) return;
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function initPartyMenus() {
    document.querySelectorAll(".ns-envelope-editor-party").forEach(function (root) {
      var trigger = root.querySelector("[data-party-menu-trigger]");
      var menu = root.querySelector("[data-party-menu]");
      if (!trigger || !menu) return;
      var isFieldPartyMenu = menu.hasAttribute("data-props-party-menu");

      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        var nextOpen = menu.hasAttribute("hidden");
        closePartyMenus(nextOpen ? menu : null);
        if (nextOpen) {
          menu.removeAttribute("hidden");
          trigger.setAttribute("aria-expanded", "true");
        } else {
          menu.setAttribute("hidden", "");
          trigger.setAttribute("aria-expanded", "false");
        }
      });

      menu.querySelectorAll("[data-party]").forEach(function (option) {
        option.addEventListener("click", function () {
          var party = option.getAttribute("data-party");
          if (isFieldPartyMenu) {
            setFieldPartyFromProps(party);
          } else {
            setActiveParty(party);
          }
          menu.setAttribute("hidden", "");
          trigger.setAttribute("aria-expanded", "false");
        });
      });
    });

    document.addEventListener("click", function (event) {
      document.querySelectorAll(".ns-envelope-editor-party").forEach(function (root) {
        var trigger = root.querySelector("[data-party-menu-trigger]");
        var menu = root.querySelector("[data-party-menu]");
        if (!trigger || !menu || menu.hasAttribute("hidden")) return;
        if (!menu.contains(event.target) && !trigger.contains(event.target)) {
          menu.setAttribute("hidden", "");
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function setCrossSealSelection(activeField) {
    document.querySelectorAll("[data-cross-seal-field]").forEach(function (item) {
      item.classList.toggle("is-selected", item === activeField);
    });
  }

  function setFieldSelection(field) {
    var resolved = resolveEditableField(field);
    var activeCheckboxItem =
      field && field.hasAttribute && field.hasAttribute("data-checkbox-item") ? field : null;

    document.querySelectorAll("[data-placed-field]").forEach(function (item) {
      if (item.hasAttribute("data-checkbox-item")) {
        item.classList.remove("is-selected");
        item.classList.remove("is-new-item");
        item.classList.toggle("is-active-item", activeCheckboxItem === item);
        return;
      }
      if (item.hasAttribute("data-cross-seal-field")) {
        return;
      }
      item.classList.toggle("is-selected", item === resolved);
    });
    if (resolved && resolved.hasAttribute("data-cross-seal-field")) {
      setCrossSealSelection(resolved);
    } else {
      setCrossSealSelection(null);
    }
    document.querySelectorAll("[data-checkbox-group]").forEach(function (group) {
      var active = resolved === group || Boolean(field && group.contains(field));
      group.classList.toggle("is-selected", active);
    });
  }

  function bringFieldToFront(field, isActive) {
    if (!field) return;
    if (field.hasAttribute("data-checkbox-item")) field = getCheckboxGroup(field) || field;
    fieldZCounter += 1;
    field.style.zIndex = String((isActive ? FIELD_Z_ACTIVE_BASE : FIELD_Z_BASE) + fieldZCounter);
  }

  function getFieldPartyColor(party) {
    return PARTY_COLORS[party] || PARTY_COLORS.purple;
  }

  function renderPagePreviewContent(page) {
    if (!page) return;
    var pageId = page.getAttribute("data-page-id");
    var thumb = pageId ? document.querySelector('[data-page-target="' + pageId + '"]') : null;
    var preview = thumb ? thumb.querySelector(".ns-envelope-editor-page-thumb__preview") : null;
    var content = page.querySelector(".ns-envelope-editor-pdf__content");
    if (!preview || !content) return;

    preview.querySelectorAll(".ns-envelope-editor-page-thumb__content").forEach(function (node) {
      node.remove();
    });

    var clonedContent = content.cloneNode(true);
    clonedContent.className = "ns-envelope-editor-page-thumb__content";
    preview.prepend(clonedContent);
  }

  function createThumbFieldClone(field, offsetX, offsetY) {
    var clone = document.createElement("div");
    var body = field.querySelector(".ns-envelope-editor-field__body");
    clone.className = "ns-envelope-editor-field";
    clone.setAttribute("data-field-type", field.getAttribute("data-field-type") || "signature");
    if (field.getAttribute("data-field-required") === "true") {
      clone.setAttribute("data-field-required", "true");
    }
    if (body) clone.innerHTML = body.outerHTML;
    syncFieldParty(clone, field.getAttribute("data-party") || getActiveParty());
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    clone.style.left = (parseFloat(field.style.left) || 0) + offsetX + "px";
    clone.style.top = (parseFloat(field.style.top) || 0) + offsetY + "px";
    clone.style.width = field.style.width || field.offsetWidth + "px";
    clone.style.height = field.style.height || field.offsetHeight + "px";
    if (field.style.zIndex) clone.style.zIndex = field.style.zIndex;
    updateFieldLabelVisibility(clone);
    return clone;
  }

  function getCrossSealFieldsForPage(page) {
    var stack = page.closest("[data-doc-stack]");
    if (!stack) return [];
    var docId = stack.getAttribute("data-doc-stack");
    var primary = getCrossSealPrimaryForDoc(docId);
    return primary ? [primary] : [];
  }

  function createThumbCrossSealClone(field, page) {
    if (!field) return null;

    var pageY = getCrossSealPageY(field);
    var clone = createThumbFieldClone(field);
    clone.setAttribute("data-cross-seal-thumb", "");
    clone.style.top = pageY + "px";
    clone.style.left = 680 - 64 + "px";
    clone.style.width = "128px";
    clone.style.height = "128px";
    clone.style.clipPath = "inset(0 50% 0 0)";
    return clone;
  }

  function scheduleCrossSealPreviewSync(source) {
    var track = null;
    if (source && source.getAttribute) {
      if (source.hasAttribute("data-cross-seal-field")) {
        track = source.closest("[data-cross-seal-track]");
      } else if (source.hasAttribute("data-cross-seal-track")) {
        track = source;
      } else if (source.hasAttribute("data-doc-stack")) {
        var docId = source.getAttribute("data-doc-stack");
        track = document.querySelector('[data-cross-seal-track][data-doc-id="' + docId + '"]');
      }
    }
    if (!track) return;
    var docId = track.getAttribute("data-doc-id");
    var stack = document.querySelector('[data-doc-stack="' + docId + '"]');
    if (!stack) return;
    stack.querySelectorAll("[data-pdf-page]").forEach(function (docPage) {
      schedulePagePreviewSync(docPage);
    });
  }

  function syncPagePreview(page) {
    if (!page) return;
    var pageId = page.getAttribute("data-page-id");
    var thumb = pageId ? document.querySelector('[data-page-target="' + pageId + '"]') : null;
    var preview = thumb ? thumb.querySelector(".ns-envelope-editor-page-thumb__preview") : null;
    if (!preview) return;

    preview.querySelectorAll(".ns-envelope-editor-page-thumb__fields, .ns-envelope-editor-page-thumb__field, .ns-envelope-editor-page-thumb__tags").forEach(function (node) {
      node.remove();
    });

    var fields = page.querySelectorAll("[data-placed-field]:not([data-checkbox-item])");
    var checkboxGroups = page.querySelectorAll("[data-checkbox-group]");
    var parties = [];

    var crossSealFields = getCrossSealFieldsForPage(page);
    var hasCrossSealOnPage = crossSealFields.length > 0;

    if (fields.length || checkboxGroups.length || hasCrossSealOnPage) {
      var fieldLayer = document.createElement("div");
      fieldLayer.className = "ns-envelope-editor-page-thumb__fields";
      fieldLayer.setAttribute("aria-hidden", "true");

      fields.forEach(function (field) {
        fieldLayer.appendChild(createThumbFieldClone(field));
        var party = field.getAttribute("data-party") || "purple";
        if (parties.indexOf(party) === -1) parties.push(party);
      });

      checkboxGroups.forEach(function (group) {
        var groupLeft = parseFloat(group.style.left) || 0;
        var groupTop = parseFloat(group.style.top) || 0;
        getCheckboxGroupItems(group).forEach(function (item) {
          fieldLayer.appendChild(createThumbFieldClone(item, groupLeft, groupTop));
        });
        var party = group.getAttribute("data-party") || "purple";
        if (parties.indexOf(party) === -1) parties.push(party);
      });

      crossSealFields.forEach(function (field) {
        var crossSealClone = createThumbCrossSealClone(field, page);
        if (!crossSealClone) return;
        fieldLayer.appendChild(crossSealClone);
        var party = field.getAttribute("data-party") || "purple";
        if (parties.indexOf(party) === -1) parties.push(party);
      });

      preview.appendChild(fieldLayer);
    }

    if (parties.length) {
      var tags = document.createElement("span");
      tags.className = "ns-envelope-editor-page-thumb__tags";
      parties.forEach(function (party) {
        var tag = document.createElement("span");
        tag.className = "ns-envelope-editor-page-thumb__tag";
        tag.style.setProperty("--ns-thumb-tag-color", getFieldPartyColor(party).color);
        tags.appendChild(tag);
      });
      preview.appendChild(tags);
    }
  }

  function syncAllPagePreviews() {
    document.querySelectorAll("[data-pdf-page][data-page-id]").forEach(function (page) {
      renderPagePreviewContent(page);
      syncPagePreview(page);
    });
  }

  function isFieldRequired(field) {
    return field ? field.getAttribute("data-field-required") !== "false" : false;
  }

  function setFieldRequired(field, required) {
    if (!field) return;
    var targets = [];
    if (field.hasAttribute("data-checkbox-group")) {
      targets = [field].concat(getCheckboxGroupItems(field));
    } else if (field.hasAttribute("data-checkbox-item")) {
      var group = getCheckboxGroup(field);
      if (group) targets = [group].concat(getCheckboxGroupItems(group));
    } else {
      targets = [field];
    }
    targets.forEach(function (target) {
      target.setAttribute("data-field-required", required ? "true" : "false");
    });
    schedulePagePreviewSync((field.hasAttribute("data-checkbox-group") ? field : field.closest("[data-pdf-page]")));
  }

  function syncPropsRequiredDisplay(field) {
    var checkbox = document.querySelector("[data-props-required]");
    if (!checkbox || !field) return;
    checkbox.checked = isFieldRequired(field);
  }

  function syncPropsPositionDisplay(field) {
    var leftInput = document.querySelector("[data-props-left]");
    var topInput = document.querySelector("[data-props-top]");
    if (!field) return;
    if (field.hasAttribute("data-cross-seal-field")) {
      if (leftInput) leftInput.value = "0";
      if (topInput) topInput.value = String(Math.round(getCrossSealPageY(field)));
      return;
    }
    if (leftInput) leftInput.value = String(Math.round(parseFloat(field.style.left) || 0));
    if (topInput) topInput.value = String(Math.round(parseFloat(field.style.top) || 0));
  }

  function syncPropsHintDisplay(field) {
    var hintInput = document.querySelector("[data-props-hint]");
    if (!hintInput) return;
    hintInput.value = field ? getFieldSetting(field, "hint") : "";
  }

  function syncPropsTypeSections(field) {
    var type = field ? field.getAttribute("data-field-type") || "" : "";
    document.querySelectorAll("[data-props-section]").forEach(function (section) {
      section.hidden = section.getAttribute("data-props-section") !== type;
    });
  }

  function renderCheckboxOptions(field) {
    var list = document.querySelector("[data-props-checkbox-options]");
    if (!list) return;
    list.innerHTML = "";
    var group = getCheckboxGroup(field) || field;
    if (!group || group.getAttribute("data-field-type") !== "checkbox") return;
    var options = getCheckboxOptions(group);
    options.forEach(function (option, index) {
      var row = document.createElement("div");
      row.className = "ns-envelope-editor-props__option-row";

      var check = document.createElement("span");
      check.className = "ns-envelope-editor-props__option-check";
      check.setAttribute("aria-hidden", "true");
      row.appendChild(check);

      var input = document.createElement("input");
      input.className = "ns-input";
      input.type = "text";
      input.value = option;
      input.setAttribute("aria-label", "勾选框选项" + (index + 1));
      input.addEventListener("input", function () {
        var current = getCheckboxOptions(group);
        current[index] = input.value;
        setCheckboxOptions(group, current);
      });
      row.appendChild(input);

      if (options.length > 1) {
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "ns-envelope-editor-props__option-remove";
        removeBtn.setAttribute("aria-label", "删除选项" + (index + 1));
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", function () {
          removeCheckboxGroupOption(group, index);
        });
        row.appendChild(removeBtn);
      }

      list.appendChild(row);
    });
  }

  function syncPropsTypeSpecificDisplay(field) {
    if (!field) return;
    setSelectValue(document.querySelector("[data-props-seal-use-scope]"), getFieldSetting(field, "sealUseScope"));
    setSelectValue(document.querySelector("[data-props-seal-size-rule]"), getFieldSetting(field, "sealSizeRule"));
    setSelectValue(document.querySelector("[data-props-date-format]"), getFieldSetting(field, "dateFormat"));
    setSelectValue(document.querySelector("[data-props-date-font-size]"), getFieldSetting(field, "dateFontSize"));
    setSelectValue(document.querySelector("[data-props-text-font-family]"), getFieldSetting(field, "textFontFamily"));
    setSelectValue(document.querySelector("[data-props-image-ratio]"), getFieldSetting(field, "imageRatio"));
    var textMultiline = document.querySelector("[data-props-text-multiline]");
    if (textMultiline) textMultiline.checked = getFieldSetting(field, "textMultiline") === "true";
    var attachmentMultiple = document.querySelector("[data-props-attachment-allow-multiple]");
    if (attachmentMultiple) attachmentMultiple.checked = getFieldSetting(field, "attachmentAllowMultiple") !== "false";
    var textFontSize = document.querySelector("[data-props-text-font-size]");
    if (textFontSize) textFontSize.value = getFieldSetting(field, "textFontSize");
    var handwriteFontSize = document.querySelector("[data-props-handwrite-font-size]");
    if (handwriteFontSize) handwriteFontSize.value = getFieldSetting(field, "handwriteFontSize");
    var handwriteGuide = document.querySelector("[data-props-handwrite-guide]");
    if (handwriteGuide) handwriteGuide.value = getFieldSetting(field, "handwriteGuide");
    renderCheckboxOptions(field);
  }

  function syncPropsPanelForField(field) {
    var owner = resolveEditableField(field) || field;
    syncPropsPartyDisplay(owner.getAttribute("data-party") || getActiveParty());
    syncPropsRequiredDisplay(owner);
    syncPropsNameDisplay(owner);
    syncPropsHintDisplay(owner);
    syncPropsPositionDisplay(owner);
    syncPropsGuideTextDisplay(owner);
    syncPropsTypeSections(owner);
    syncPropsTypeSpecificDisplay(owner);
  }

  function getEditingField() {
    var panel = document.querySelector("[data-props-panel]");
    var id = panel ? panel.getAttribute("data-editing-field") : "";
    if (id) {
      var group = document.querySelector('[data-group-id="' + id + '"]');
      if (group) return group;
      return document.querySelector('[data-field-id="' + id + '"]');
    }
    var selectedGroup = document.querySelector("[data-checkbox-group].is-selected");
    if (selectedGroup) return selectedGroup;
    return document.querySelector("[data-placed-field].is-selected:not([data-checkbox-item])");
  }

  function isEditableShortcutTarget(target) {
    if (!target) return false;
    var tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return Boolean(target.isContentEditable);
  }

  function getFieldSnapshot(field) {
    if (!field) return null;
    field = resolveEditableField(field) || field;
    var page = field.closest("[data-pdf-page]");
    var settings = {};
    FIELD_SETTING_KEYS.forEach(function (key) {
      settings[key] = getFieldSetting(field, key);
    });

    if (field.hasAttribute("data-checkbox-group")) {
      return {
        type: "checkbox",
        isCheckboxGroup: true,
        typeLabel: field.getAttribute("data-field-label") || "复选框",
        icon: field.getAttribute("data-field-icon") || "",
        party: field.getAttribute("data-party") || getActiveParty(),
        required: field.getAttribute("data-field-required") || "true",
        left: parseFloat(field.style.left) || 0,
        top: parseFloat(field.style.top) || 0,
        width: field.style.width || "",
        height: field.style.height || "",
        pageId: page ? page.getAttribute("data-page-id") : null,
        settings: settings,
        items: getCheckboxGroupItems(field).map(function (item) {
          return {
            label: item.getAttribute("data-option-label") || "",
            left: parseFloat(item.style.left) || 0,
            top: parseFloat(item.style.top) || 0,
          };
        }),
      };
    }

    return {
      type: field.getAttribute("data-field-type") || "signature",
      typeLabel: field.getAttribute("data-field-label") || "控件",
      icon: field.getAttribute("data-field-icon") || "",
      party: field.getAttribute("data-party") || getActiveParty(),
      required: field.getAttribute("data-field-required") || "true",
      left: parseFloat(field.style.left) || 0,
      top: parseFloat(field.style.top) || 0,
      width: field.style.width || "",
      height: field.style.height || "",
      pageId: page ? page.getAttribute("data-page-id") : null,
      guideText: field.getAttribute("data-field-guide-text") || "",
      settings: settings,
    };
  }

  function deleteField(field) {
    if (!field) return false;
    field = resolveEditableField(field) || field;
    var page = field.closest("[data-pdf-page]");
    var track = field.closest("[data-cross-seal-track]");
    if (field.hasAttribute("data-cross-seal-field") && track) {
      var docId = track.getAttribute("data-doc-id");
      removeCrossSealForDoc(docId);
      scheduleCrossSealPreviewSync(track);
      closePropsPanel();
      return true;
    }
    field.remove();
    if (track) scheduleCrossSealPreviewSync(track);
    else schedulePagePreviewSync(page);
    closePropsPanel();
    return true;
  }

  function copySelectedField() {
    var field = getEditingField();
    if (!field) return false;
    fieldClipboard = getFieldSnapshot(field);
    return Boolean(fieldClipboard);
  }

  function createFieldFromSnapshot(snapshot, left, top) {
    if (snapshot.isCheckboxGroup) {
      var page = snapshot.pageId
        ? document.querySelector('[data-pdf-page][data-page-id="' + snapshot.pageId + '"]')
        : document.querySelector("[data-pdf-page]");
      if (!page) return null;
      var group = createCheckboxGroup(page, left, top, {
        label: snapshot.typeLabel,
        name: snapshot.typeLabel + " " + generateFieldCode(16),
        icon: snapshot.icon,
        party: snapshot.party || getActiveParty(),
        required: snapshot.required,
        settings: snapshot.settings,
        items: snapshot.items || [],
      });
      setFieldRequired(group, snapshot.required !== "false");
      return group;
    }

    var anchor = getFieldAnchor(snapshot.type);
    var field = createField(snapshot.type, snapshot.typeLabel, snapshot.icon, left + anchor.x, top + anchor.y);
    field.setAttribute("data-field-name", snapshot.typeLabel + " " + generateFieldCode(16));
    syncFieldParty(field, snapshot.party || getActiveParty());
    setFieldRequired(field, snapshot.required !== "false");
    if (snapshot.settings) {
      FIELD_SETTING_KEYS.forEach(function (key) {
        if (snapshot.settings[key] != null) {
          setFieldSetting(field, key, snapshot.settings[key], { skipPreview: true });
        }
      });
    }
    if (snapshot.width) field.style.width = snapshot.width;
    if (snapshot.height) field.style.height = snapshot.height;
    if (snapshot.type === "text") {
      setFieldGuideText(field, snapshot.guideText || "", { skipPropsSync: true });
      bindTextFieldBehaviors(field);
    }
    applyFieldStyleSettings(field);
    if (!isFieldResizable(field)) {
      applyFieldDefaultSize(field, snapshot.type);
    }
    positionField(field, left, top);
    updateFieldLabelVisibility(field);
    return field;
  }

  function pasteFieldFromClipboard() {
    if (!fieldClipboard) return false;
    var page = fieldClipboard.pageId
      ? document.querySelector('[data-pdf-page][data-page-id="' + fieldClipboard.pageId + '"]')
      : null;
    if (!page) page = document.querySelector("[data-pdf-page]");
    if (!page) return false;

    var offset = 16;
    var left = fieldClipboard.left + offset;
    var top = fieldClipboard.top + offset;
    var field = createFieldFromSnapshot(fieldClipboard, left, top);
    page.appendChild(field);
    openPropsPanel(field);
    schedulePagePreviewSync(page);

    fieldClipboard.left = left;
    fieldClipboard.top = top;
    return true;
  }

  function initFieldShortcuts() {
    var editor = getEditor();
    if (!editor) return;

    document.addEventListener("keydown", function (event) {
      if (!editor.isConnected) return;
      if (isEditableShortcutTarget(event.target)) return;

      var key = event.key;
      var hasModifier = event.metaKey || event.ctrlKey;

      if ((key === "Delete" || key === "Backspace") && !hasModifier) {
        var selected = getEditingField();
        if (!selected) return;
        event.preventDefault();
        deleteField(selected);
        return;
      }

      if (hasModifier && (key === "c" || key === "C")) {
        if (!getEditingField()) return;
        if (copySelectedField()) event.preventDefault();
        return;
      }

      if (hasModifier && (key === "v" || key === "V")) {
        if (!fieldClipboard) return;
        if (pasteFieldFromClipboard()) event.preventDefault();
      }
    });
  }

  function closePropsPanel(options) {
    options = options || {};
    var panel = document.querySelector("[data-props-panel]");
    var editor = getEditor();
    if (!panel) return;
    panel.setAttribute("hidden", "");
    panel.removeAttribute("data-editing-field");
    if (editor) editor.classList.remove("is-props-open");
    if (options.clearSelection !== false) setFieldSelection(null);
    syncAllPagePreviews();
  }

  function openPropsPanel(field, options) {
    options = options || {};
    var panel = document.querySelector("[data-props-panel]");
    var editor = getEditor();
    if (!panel || !field) return;
    var selectionTarget = options.selectionTarget || field;
    field = resolveEditableField(field) || field;
    setFieldSelection(selectionTarget);
    bringFieldToFront(
      selectionTarget.hasAttribute("data-cross-seal-field") ? selectionTarget : field,
      selectionTarget.classList.contains("is-dragging") || selectionTarget.classList.contains("is-resizing")
    );
    panel.removeAttribute("hidden");
    if (editor) editor.classList.add("is-props-open");
    panel.setAttribute(
      "data-editing-field",
      field.getAttribute("data-group-id") || field.getAttribute("data-field-id") || ""
    );
    var label = field.getAttribute("data-field-label") || "控件";
    var title = panel.querySelector("[data-props-title]");
    if (title) title.textContent = label;
    syncPropsPanelForField(field);
    if (
      !field.hasAttribute("data-checkbox-group") &&
      !field.hasAttribute("data-cross-seal-field") &&
      !isFieldResizable(field)
    ) {
      applyFieldDefaultSize(field, field.getAttribute("data-field-type"));
      schedulePagePreviewSync(field.closest("[data-pdf-page]"));
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setFieldPosition(field, x, y) {
    var page = field.closest("[data-pdf-page]");
    if (!page) return;
    if (field.hasAttribute("data-checkbox-group")) {
      var maxLeft = page.clientWidth - field.offsetWidth - 8;
      var maxTop = page.clientHeight - field.offsetHeight - 8;
      field.style.left = clamp(Math.round(x), 8, maxLeft) + "px";
      field.style.top = clamp(Math.round(y), 8, maxTop) + "px";
      syncPropsPositionDisplay(field);
      return;
    }
    var maxLeft = page.clientWidth - field.offsetWidth - 8;
    var maxTop = page.clientHeight - field.offsetHeight - 8;
    field.style.left = clamp(Math.round(x), 8, maxLeft) + "px";
    field.style.top = clamp(Math.round(y), 8, maxTop) + "px";
    syncPropsPositionDisplay(field);
  }

  function schedulePagePreviewSync(page) {
    if (!page) return;
    requestAnimationFrame(function () {
      syncPagePreview(page);
    });
  }

  function positionField(field, x, y) {
    setFieldPosition(field, x, y);
    schedulePagePreviewSync(field.closest("[data-pdf-page]"));
  }

  function makeFieldDraggable(field) {
    if (!field || field.hasAttribute("data-field-drag-ready")) return;
    if (field.hasAttribute("data-checkbox-item")) return;
    if (field.hasAttribute("data-cross-seal-field")) return;
    field.setAttribute("data-field-drag-ready", "");

    field.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      if (event.target.closest("[data-resize-handle]")) return;
      if (field.classList.contains("is-text-editing")) return;
      if (event.target.closest("[data-field-text-input]")) return;
      event.stopPropagation();

      var page = field.closest("[data-pdf-page]");
      if (!page) return;

      var fieldRect = field.getBoundingClientRect();
      var relY = event.clientY - fieldRect.top;

      // 检测是否靠近上下边缘，触发 n/s 方向 resize
      if (isFieldResizable(field)) {
        if (relY <= EDGE_RESIZE_THRESHOLD) {
          startEdgeResize(field, "n", event, page);
          return;
        }
        if (relY >= fieldRect.height - EDGE_RESIZE_THRESHOLD) {
          startEdgeResize(field, "s", event, page);
          return;
        }
      }

      var offsetX = (event.clientX - fieldRect.left) / getCurrentZoom();
      var offsetY = (event.clientY - fieldRect.top) / getCurrentZoom();
      var originX = event.clientX;
      var originY = event.clientY;
      var moved = false;

      field.setPointerCapture(event.pointerId);
      field.classList.add("is-dragging");
      openPropsPanel(field);
      bringFieldToFront(field, true);

      function onPointerMove(moveEvent) {
        var deltaX = Math.abs(moveEvent.clientX - originX);
        var deltaY = Math.abs(moveEvent.clientY - originY);
        if (deltaX > 3 || deltaY > 3) moved = true;
        var point = getPagePoint(page, moveEvent.clientX, moveEvent.clientY);
        setFieldPosition(field, point.x - offsetX, point.y - offsetY);
      }

      function onPointerUp(upEvent) {
        field.releasePointerCapture(upEvent.pointerId);
        field.classList.remove("is-dragging");
        bringFieldToFront(field, false);
        field.removeEventListener("pointermove", onPointerMove);
        field.removeEventListener("pointerup", onPointerUp);
        field.removeEventListener("pointercancel", onPointerUp);
        field.dataset.dragMoved = moved ? "true" : "false";
        if (
          field.getAttribute("data-field-type") === "seal" &&
          isCrossSealEnabled() &&
          isPointInCrossSealTrack(upEvent.clientX, upEvent.clientY)
        ) {
          var dropTrack = getCrossSealTrackAtPoint(upEvent.clientX, upEvent.clientY);
          promoteSealToCrossSeal(field, getCrossSealYFromClient(upEvent.clientY, dropTrack), page, dropTrack);
          return;
        }
        schedulePagePreviewSync(page);
      }

      field.addEventListener("pointermove", onPointerMove);
      field.addEventListener("pointerup", onPointerUp);
      field.addEventListener("pointercancel", onPointerUp);
    });
  }

  function getFieldLayout(type) {
    return FIELD_LAYOUTS[type] || FIELD_LAYOUTS.signature;
  }

  function isFieldResizable(fieldOrType) {
    if (typeof fieldOrType !== "string" && fieldOrType && fieldOrType.hasAttribute("data-cross-seal-field")) {
      return false;
    }
    var type = typeof fieldOrType === "string" ? fieldOrType : fieldOrType.getAttribute("data-field-type");
    var layout = getFieldLayout(type);
    return layout.resizable !== false;
  }

  function removeFieldResizeHandles(field) {
    if (!field) return;
    field.querySelectorAll("[data-resize-handle]").forEach(function (handle) {
      handle.remove();
    });
  }

  function getFieldAnchor(type) {
    var layout = getFieldLayout(type);
    return { x: layout.anchorX, y: layout.anchorY };
  }

  function applyFieldDefaultSize(field, type) {
    if (!field) return;
    var layout = getFieldLayout(type);
    field.style.width = layout.width + "px";
    field.style.height = layout.height + "px";
    updateFieldLabelVisibility(field);
  }

  function updateFieldLabelVisibility(field) {
    var label = field ? field.querySelector(".ns-envelope-editor-field__label") : null;
    if (!label) return;

    var body = label.closest(".ns-envelope-editor-field__body");
    if (!body) return;

    label.classList.remove("is-label-clipped");

    var epsilon = 1;
    var labelOverflow =
      label.scrollWidth > label.clientWidth + epsilon || label.scrollHeight > label.clientHeight + epsilon;

    if (labelOverflow) {
      label.classList.add("is-label-clipped");
      return;
    }

    var bodyRect = body.getBoundingClientRect();
    var labelRect = label.getBoundingClientRect();
    var clippedOutsideBody =
      labelRect.bottom > bodyRect.bottom - epsilon ||
      labelRect.right > bodyRect.right - epsilon ||
      labelRect.top < bodyRect.top + epsilon ||
      labelRect.left < bodyRect.left + epsilon;

    if (clippedOutsideBody) {
      label.classList.add("is-label-clipped");
    }
  }

  function bindFieldLabelVisibility(field) {
    if (!field || field.hasAttribute("data-label-visibility-ready")) return;
    field.setAttribute("data-label-visibility-ready", "");
    updateFieldLabelVisibility(field);

    if (typeof ResizeObserver === "undefined") return;

    var observer = new ResizeObserver(function () {
      updateFieldLabelVisibility(field);
    });
    observer.observe(field);
  }

  function applyFieldResize(field, corner, startLeft, startTop, startWidth, startHeight, deltaX, deltaY) {
    if (!isFieldResizable(field)) return;
    var page = field.closest("[data-pdf-page]");
    if (!page) return;
    var layout = getFieldLayout(field.getAttribute("data-field-type"));
    var minWidth = layout.minWidth || layout.width;
    var minHeight = layout.minHeight || layout.height;
    var left = startLeft;
    var top = startTop;
    var width = startWidth;
    var height = startHeight;

    if (corner === "se") {
      width = Math.max(minWidth, startWidth + deltaX);
      height = Math.max(minHeight, startHeight + deltaY);
    } else if (corner === "sw") {
      width = Math.max(minWidth, startWidth - deltaX);
      left = startLeft + startWidth - width;
      height = Math.max(minHeight, startHeight + deltaY);
    } else if (corner === "ne") {
      width = Math.max(minWidth, startWidth + deltaX);
      height = Math.max(minHeight, startHeight - deltaY);
      top = startTop + startHeight - height;
    } else if (corner === "nw") {
      width = Math.max(minWidth, startWidth - deltaX);
      left = startLeft + startWidth - width;
      height = Math.max(minHeight, startHeight - deltaY);
      top = startTop + startHeight - height;
    } else if (corner === "n") {
      height = Math.max(minHeight, startHeight - deltaY);
      top = startTop + startHeight - height;
    } else if (corner === "s") {
      height = Math.max(minHeight, startHeight + deltaY);
    } else if (corner === "e") {
      width = Math.max(minWidth, startWidth + deltaX);
    } else if (corner === "w") {
      width = Math.max(minWidth, startWidth - deltaX);
      left = startLeft + startWidth - width;
    }

    var maxLeft = page.clientWidth - width - 8;
    var maxTop = page.clientHeight - height - 8;
    left = clamp(Math.round(left), 8, maxLeft);
    top = clamp(Math.round(top), 8, maxTop);
    width = Math.min(width, page.clientWidth - left - 8);
    height = Math.min(height, page.clientHeight - top - 8);

    field.style.left = left + "px";
    field.style.top = top + "px";
    field.style.width = Math.round(width) + "px";
    field.style.height = Math.round(height) + "px";
    updateFieldLabelVisibility(field);
  }

  function ensureFieldResizeHandles(field) {
    if (!field) return;
    if (!isFieldResizable(field)) {
      removeFieldResizeHandles(field);
      return;
    }
    FIELD_RESIZE_HANDLES.forEach(function (corner) {
      if (field.querySelector('[data-resize-handle="' + corner + '"]')) return;
      var handle = document.createElement("span");
      handle.className = "ns-envelope-editor-field__resize-handle";
      handle.setAttribute("data-resize-handle", corner);
      handle.setAttribute("aria-hidden", "true");
      field.appendChild(handle);
    });
    makeFieldResizable(field);
  }

  function makeFieldResizable(field) {
    if (!field) return;

    field.querySelectorAll("[data-resize-handle]").forEach(function (handle) {
      if (handle.hasAttribute("data-resize-bound")) return;
      handle.setAttribute("data-resize-bound", "");
      handle.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();

        var corner = handle.getAttribute("data-resize-handle");
        var page = field.closest("[data-pdf-page]");
        if (!page || !corner) return;

        var originX = event.clientX;
        var originY = event.clientY;
        var startLeft = field.offsetLeft;
        var startTop = field.offsetTop;
        var startWidth = field.offsetWidth;
        var startHeight = field.offsetHeight;

        openPropsPanel(field);
        handle.setPointerCapture(event.pointerId);
        bringFieldToFront(field, true);
        field.classList.add("is-resizing");

        function onPointerMove(moveEvent) {
          var zoom = getCurrentZoom();
          applyFieldResize(
            field,
            corner,
            startLeft,
            startTop,
            startWidth,
            startHeight,
            (moveEvent.clientX - originX) / zoom,
            (moveEvent.clientY - originY) / zoom
          );
          schedulePagePreviewSync(page);
        }

        function onPointerEnd(endEvent) {
          if (handle.hasPointerCapture(endEvent.pointerId)) {
            handle.releasePointerCapture(endEvent.pointerId);
          }
          field.classList.remove("is-resizing");
          bringFieldToFront(field, false);
          handle.removeEventListener("pointermove", onPointerMove);
          handle.removeEventListener("pointerup", onPointerEnd);
          handle.removeEventListener("pointercancel", onPointerEnd);
          field.dataset.dragMoved = "true";
          schedulePagePreviewSync(page);
        }

        handle.addEventListener("pointermove", onPointerMove);
        handle.addEventListener("pointerup", onPointerEnd);
        handle.addEventListener("pointercancel", onPointerEnd);
      });
    });

    // 添加边检测光标更新
    if (!field.hasAttribute("data-edge-cursor-bound")) {
      field.setAttribute("data-edge-cursor-bound", "");
      field.addEventListener("pointermove", function (moveEvent) {
        if (!field.classList.contains("is-selected")) return;
        if (!isFieldResizable(field)) return;
        var rect = field.getBoundingClientRect();
        var y = moveEvent.clientY - rect.top;
        if (y <= EDGE_RESIZE_THRESHOLD || y >= rect.height - EDGE_RESIZE_THRESHOLD) {
          field.style.cursor = "ns-resize";
        } else {
          field.style.cursor = "";
        }
      });
    }
  }

  function startEdgeResize(field, corner, event, page) {
    event.preventDefault();
    event.stopPropagation();
    var originX = event.clientX;
    var originY = event.clientY;
    var startLeft = field.offsetLeft;
    var startTop = field.offsetTop;
    var startWidth = field.offsetWidth;
    var startHeight = field.offsetHeight;

    openPropsPanel(field);
    field.setPointerCapture(event.pointerId);
    bringFieldToFront(field, true);
    field.classList.add("is-resizing");

    function onPointerMove(moveEvent) {
      var zoom = getCurrentZoom();
      applyFieldResize(
        field,
        corner,
        startLeft,
        startTop,
        startWidth,
        startHeight,
        (moveEvent.clientX - originX) / zoom,
        (moveEvent.clientY - originY) / zoom
      );
      schedulePagePreviewSync(page);
    }

    function onPointerEnd(endEvent) {
      if (field.hasPointerCapture(endEvent.pointerId)) {
        field.releasePointerCapture(endEvent.pointerId);
      }
      field.classList.remove("is-resizing");
      bringFieldToFront(field, false);
      field.removeEventListener("pointermove", onPointerMove);
      field.removeEventListener("pointerup", onPointerEnd);
      field.removeEventListener("pointercancel", onPointerEnd);
      field.dataset.dragMoved = "true";
      schedulePagePreviewSync(page);
    }

    field.addEventListener("pointermove", onPointerMove);
    field.addEventListener("pointerup", onPointerEnd);
    field.addEventListener("pointercancel", onPointerEnd);
  }

  function buildFieldIconMarkup(iconSrc, size) {
    var sizeClass = "";
    if (size === "lg") sizeClass = " ns-envelope-editor-field__icon--lg";
    if (size === "md") sizeClass = " ns-envelope-editor-field__icon--md";
    if (size === "sm") sizeClass = " ns-envelope-editor-field__icon--sm";
    return (
      '<img class="ns-envelope-editor-field__icon' +
      sizeClass +
      '" src="' +
      iconSrc +
      '" alt="" draggable="false" />'
    );
  }

  function buildFieldMarkup(type, label, iconSrc, guideText) {
    var resolvedIcon = iconSrc || "assets/envelope-editor/icon-" + type + ".svg";
    var resolvedLabel = label || "";
    var resolvedGuide = guideText || "";

    if (type === "text") {
      return (
        '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--input">' +
        '<span class="ns-envelope-editor-field__text-display" data-field-text-display></span>' +
        '<input class="ns-envelope-editor-field__text-input" type="text" data-field-text-input hidden />' +
        "</span>"
      );
    }

    if (type === "checkbox") {
      return (
        '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--checkbox">' +
        '<span class="ns-envelope-editor-field__checkbox" aria-hidden="true"></span></span>'
      );
    }

    if (type === "date") {
      return (
        '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--inline">' +
        buildFieldIconMarkup(resolvedIcon, "sm") +
        '<span class="ns-envelope-editor-field__label">' +
        resolvedLabel +
        "</span></span>"
      );
    }

    if (type === "handwrite") {
      return (
        '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--handwrite">' +
        '<span class="ns-envelope-editor-field__meta">' +
        buildFieldIconMarkup(resolvedIcon, "md") +
        '<span class="ns-envelope-editor-field__label">' +
        resolvedLabel +
        "</span></span>" +
        '<span class="ns-envelope-editor-field__handwrite-guide" data-handwrite-guide>' +
        (resolvedGuide) +
        "</span></span>"
      );
    }

    if (type === "seal" || type === "image") {
      return (
        '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--stamp">' +
        buildFieldIconMarkup(resolvedIcon, "lg") +
        '<span class="ns-envelope-editor-field__label">' +
        resolvedLabel +
        "</span></span>"
      );
    }

    return (
      '<span class="ns-envelope-editor-field__body ns-envelope-editor-field__body--badge">' +
      buildFieldIconMarkup(resolvedIcon) +
      '<span class="ns-envelope-editor-field__label">' +
      resolvedLabel +
      "</span></span>"
    );
  }

  function getFieldGuideText(field) {
    return field ? field.getAttribute("data-field-guide-text") || "" : "";
  }

  function syncTextFieldDisplay(field) {
    if (!field || field.getAttribute("data-field-type") !== "text") return;
    var display = field.querySelector("[data-field-text-display]");
    if (!display) return;
    var guideText = getFieldGuideText(field);
    if (guideText) {
      display.textContent = guideText;
      display.classList.remove("is-placeholder");
    } else {
      display.textContent = "请输入";
      display.classList.add("is-placeholder");
    }
  }

  function syncPropsGuideTextDisplay(field) {
    var guideInput = document.querySelector("[data-props-guide-text]");
    if (!guideInput) return;
    var isTextField = field && field.getAttribute("data-field-type") === "text";
    guideInput.disabled = !isTextField;
    guideInput.value = isTextField ? getFieldGuideText(field) : "";
  }

  function setFieldGuideText(field, text, options) {
    if (!field) return;
    options = options || {};
    field.setAttribute("data-field-guide-text", text == null ? "" : String(text));
    syncTextFieldDisplay(field);
    if (!options.skipPropsSync) syncPropsGuideTextDisplay(field);
    schedulePagePreviewSync(field.closest("[data-pdf-page]"));
  }

  function syncHandwriteGuideDisplay(field) {
    if (!field || field.getAttribute("data-field-type") !== "handwrite") return;
    var guide = field.querySelector("[data-handwrite-guide]");
    if (!guide) return;
    guide.textContent = getFieldSetting(field, "handwriteGuide") || "";
  }

  function finishTextFieldEdit(field) {
    guide.textContent = getFieldSetting(field, "handwriteGuide") || "";
  }

  function finishTextFieldEdit(field) {
    if (!field || !field.classList.contains("is-text-editing")) return;
    var display = field.querySelector("[data-field-text-display]");
    var input = field.querySelector("[data-field-text-input]");
    if (!input) return;
    setFieldGuideText(field, input.value);
    field.classList.remove("is-text-editing");
    input.hidden = true;
    if (display) display.hidden = false;
  }

  function startTextFieldEdit(field) {
    if (!field || field.getAttribute("data-field-type") !== "text") return;
    if (field.classList.contains("is-text-editing")) return;
    var display = field.querySelector("[data-field-text-display]");
    var input = field.querySelector("[data-field-text-input]");
    if (!display || !input) return;

    openPropsPanel(field);
    field.classList.add("is-text-editing");
    display.hidden = true;
    input.hidden = false;
    input.value = getFieldGuideText(field);
    window.requestAnimationFrame(function () {
      input.focus();
      input.select();
    });
  }

  function bindTextFieldBehaviors(field) {
    if (!field || field.getAttribute("data-field-type") !== "text") return;
    if (field.hasAttribute("data-text-field-ready")) return;
    field.setAttribute("data-text-field-ready", "");

    field.addEventListener("dblclick", function (event) {
      event.preventDefault();
      event.stopPropagation();
      startTextFieldEdit(field);
    });

    var input = field.querySelector("[data-field-text-input]");
    if (!input) return;

    input.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });

    input.addEventListener("keydown", function (event) {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        input.value = getFieldGuideText(field);
        input.blur();
      }
    });

    input.addEventListener("blur", function () {
      finishTextFieldEdit(field);
    });
  }

  function applyFieldPresentation(field, type, label, iconSrc, options) {
    if (!field) return;
    options = options || {};
    var guideText = type === "text" ? getFieldGuideText(field) : "";
    var handwriteGuide = type === "handwrite" ? getFieldSetting(field, "handwriteGuide") : "";
    field.setAttribute("data-field-type", type);
    if (type === "text") field.removeAttribute("data-text-field-ready");
    field.innerHTML = buildFieldMarkup(type, label, iconSrc, handwriteGuide);
    if (type === "text") {
      field.setAttribute("data-field-guide-text", guideText);
      syncTextFieldDisplay(field);
      bindTextFieldBehaviors(field);
    }
    if (!options.skipChrome) {
      ensureFieldResizeHandles(field);
      if (!isFieldResizable(type) || !field.style.width || !field.style.height) {
        applyFieldDefaultSize(field, type);
      }
      bindFieldLabelVisibility(field);
    } else {
      updateFieldLabelVisibility(field);
    }
  }

  function getDragPortal() {
    return document.querySelector("[data-envelope-editor-drag-portal]");
  }

  function positionDragGhost(ghost, clientX, clientY) {
    if (!ghost) return;
    var type = ghost.getAttribute("data-field-type") || "signature";
    var anchor = getFieldAnchor(type);
    ghost.style.left = clientX - anchor.x + "px";
    ghost.style.top = clientY - anchor.y + "px";
  }

  function removeDragGhost(ghost) {
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  }

  function createPaletteGhost(data) {
    var portal = getDragPortal();
    if (!portal) return null;

    var ghost = document.createElement("div");
    ghost.className = "ns-envelope-editor-field ns-envelope-editor-drag-ghost ns-envelope-editor-cursor-ghost";
    applyFieldPresentation(ghost, data.type, data.label, data.icon, { skipChrome: true });
    syncFieldParty(ghost, getActiveParty());
    ghost.setAttribute("aria-hidden", "true");
    portal.appendChild(ghost);
    return ghost;
  }

  function positionPaletteGhost(ghost, clientX, clientY) {
    positionDragGhost(ghost, clientX, clientY);
  }

  function getEditorRoot() {
    return document.querySelector("[data-envelope-editor]");
  }

  function getCrossSealTrack() {
    return document.querySelector("[data-cross-seal-track]");
  }

  function getCrossSealTracks() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-cross-seal-track]"));
  }

  function getCrossSealTrackAtPoint(clientX, clientY) {
    if (!isCrossSealEnabled()) return null;
    var target = document.elementFromPoint(clientX, clientY);
    return target ? target.closest("[data-cross-seal-track]") : null;
  }

  function getPageDocId(page) {
    var pageId = page.getAttribute("data-page-id") || "";
    var match = pageId.match(/^(.*)-page-\d+$/);
    return match ? match[1] : pageId;
  }

  function groupPagesByDocument(pages) {
    var groups = [];
    var index = {};
    pages.forEach(function (page) {
      var docId = getPageDocId(page);
      if (!index[docId]) {
        index[docId] = { id: docId, pages: [] };
        groups.push(index[docId]);
      }
      index[docId].pages.push(page);
    });
    return groups;
  }

  function ensureDocumentStacks(pagesWrap) {
    if (!pagesWrap) return [];
    if (pagesWrap.querySelector("[data-doc-stack]")) {
      return Array.prototype.map.call(pagesWrap.querySelectorAll("[data-doc-stack]"), function (stack) {
        return {
          id: stack.getAttribute("data-doc-stack"),
          stack: stack,
          pages: Array.prototype.slice.call(stack.querySelectorAll("[data-pdf-page]")),
        };
      });
    }

    var pages = Array.prototype.slice.call(pagesWrap.children).filter(function (node) {
      return node.hasAttribute("data-pdf-page");
    });
    var groups = groupPagesByDocument(pages);
    groups.forEach(function (group) {
      var stack = document.createElement("div");
      stack.className = "ns-envelope-editor-doc-stack";
      stack.setAttribute("data-doc-stack", group.id);
      group.pages.forEach(function (page) {
        stack.appendChild(page);
      });
      pagesWrap.appendChild(stack);
    });
    return groups.map(function (group) {
      return {
        id: group.id,
        stack: pagesWrap.querySelector('[data-doc-stack="' + group.id + '"]'),
        pages: group.pages,
      };
    });
  }

  function rebuildCrossSealRail(docGroups) {
    var rail = document.querySelector("[data-cross-seal-rail]");
    if (!rail) return;

    var preservedByDoc = {};
    Array.prototype.slice.call(document.querySelectorAll("[data-cross-seal-field]")).forEach(function (field) {
      var track = field.closest("[data-cross-seal-track]");
      var docId = track ? track.getAttribute("data-doc-id") : "";
      if (!docId) return;
      if (field.hasAttribute("data-cross-seal-primary")) {
        preservedByDoc[docId] = { node: field, pageY: getCrossSealPageY(field) };
      } else if (!preservedByDoc[docId]) {
        preservedByDoc[docId] = { node: field, pageY: getCrossSealPageY(field) };
      }
    });
    Object.keys(preservedByDoc).forEach(function (docId) {
      var item = preservedByDoc[docId];
      if (!item.node.hasAttribute("data-cross-seal-primary")) {
        item.pageY = inferCrossSealPageY(item.node, docId);
      }
    });

    rail.innerHTML = "";
    (docGroups || []).forEach(function (group) {
      var docWrap = document.createElement("div");
      docWrap.className = "ns-envelope-editor-cross-seal__doc";
      docWrap.setAttribute("data-cross-seal-doc", group.id);

      group.pages.forEach(function (page) {
        var track = document.createElement("div");
        track.className = "ns-envelope-editor-cross-seal__track";
        track.setAttribute("data-cross-seal-track", "");
        track.setAttribute("data-doc-id", group.id);
        track.setAttribute("data-page-id", page.getAttribute("data-page-id") || "");
        docWrap.appendChild(track);
      });

      rail.appendChild(docWrap);
    });

    Object.keys(preservedByDoc).forEach(function (docId) {
      var item = preservedByDoc[docId];
      if (!item || !item.node) return;
      var firstTrack = document.querySelector('[data-cross-seal-track][data-doc-id="' + docId + '"]');
      if (!firstTrack) return;
      item.node.setAttribute("data-cross-seal-primary", "");
      item.node.removeAttribute("data-cross-seal-mirror");
      item.node.removeAttribute("data-cross-seal-center-ratio");
      firstTrack.appendChild(item.node);
      item.node.setAttribute("data-cross-seal-page-y", String(item.pageY));
      syncCrossSealMirrors(docId);
    });
  }

  function isCrossSealEnabled() {
    var root = getEditorRoot();
    return !!(root && root.classList.contains("is-cross-seal-open"));
  }

  function isCrossSealCollapsed() {
    var root = getEditorRoot();
    return !!(root && root.classList.contains("is-cross-seal-collapsed"));
  }

  function isPointInCrossSealTrack(clientX, clientY) {
    return !!getCrossSealTrackAtPoint(clientX, clientY);
  }

  /**
   * 将屏幕坐标 Y 轴位移转换为画布列本地像素（canvas-column 使用 zoom 缩放）。
   * @param {number} deltaClientY
   * @returns {number}
   */
  function clientYToLocalDelta(deltaClientY) {
    return deltaClientY / getCurrentZoom();
  }

  /**
   * 将屏幕 clientY 转为相对 track 顶部的本地 Y 坐标。
   * @param {number} clientY
   * @param {Element} track
   * @returns {number}
   */
  function clientYToTrackLocalY(clientY, track) {
    if (!track) return 0;
    var rect = track.getBoundingClientRect();
    return clientYToLocalDelta(clientY - rect.top);
  }

  function getCrossSealYFromClient(clientY, track) {
    track = track || getCrossSealTrackAtPoint(clientY, clientY);
    if (!track) return 0;
    return clientYToTrackLocalY(clientY, track) - getCrossSealFieldHeight() / 2;
  }

  function applyCrossSealPositionOnTrack(field, pageY, track) {
    if (!field || !track) return;
    var height = getCrossSealFieldHeight();
    var maxTop = Math.max(0, track.clientHeight - height);
    var nextTop = clamp(Math.round(pageY), 0, maxTop);
    field.style.top = nextTop + "px";
    field.style.left = "";
  }

  function removeCrossSealForDoc(docId) {
    getCrossSealTracksForDoc(docId).forEach(function (track) {
      track.querySelectorAll("[data-cross-seal-field]").forEach(function (field) {
        field.remove();
      });
    });
  }

  function setCrossSealPageY(docId, pageY, options) {
    options = options || {};
    var primary = getCrossSealPrimaryForDoc(docId);
    if (!primary) return;
    var normalizedY = Math.round(pageY);
    primary.setAttribute("data-cross-seal-page-y", String(normalizedY));
    getCrossSealTracksForDoc(docId).forEach(function (track) {
      var field = track.querySelector("[data-cross-seal-field]");
      if (field) applyCrossSealPositionOnTrack(field, normalizedY, track);
    });
    if (!options.skipProps) syncPropsPositionDisplay(primary);
    scheduleCrossSealPreviewSync(primary);
  }

  function syncCrossSealMirrors(docId) {
    var primary = getCrossSealPrimaryForDoc(docId);
    if (!primary) return;
    var pageY = getCrossSealPageY(primary);
    primary.setAttribute("data-cross-seal-page-y", String(Math.round(pageY)));

    getCrossSealTracksForDoc(docId).forEach(function (track) {
      var field = track.querySelector("[data-cross-seal-field]");
      if (field === primary) {
        applyCrossSealPositionOnTrack(primary, pageY, track);
        return;
      }
      if (!field) {
        field = createCrossSealMirrorField(primary);
        track.appendChild(field);
      }
      applyCrossSealPositionOnTrack(field, pageY, track);
    });
    scheduleCrossSealPreviewSync(primary);
  }

  function setCrossSealFieldPosition(field, top) {
    var track = field ? field.closest("[data-cross-seal-track]") : getCrossSealTrack();
    if (!track || !field) return;
    var docId = track.getAttribute("data-doc-id");
    setCrossSealPageY(docId, top);
  }

  function syncCrossSealFieldsForDoc(docId) {
    syncCrossSealMirrors(docId);
  }

  function syncCrossSealFieldsFromCenter() {
    var docIds = {};
    document.querySelectorAll("[data-cross-seal-primary]").forEach(function (field) {
      var track = field.closest("[data-cross-seal-track]");
      if (track) docIds[track.getAttribute("data-doc-id")] = true;
    });
    Object.keys(docIds).forEach(syncCrossSealFieldsForDoc);
  }

  function applyCrossSealFieldLayout(field) {
    if (!field) return;
    field.style.width = "";
    field.style.height = "";
    removeFieldResizeHandles(field);
  }

  function syncCrossSealRailLayout() {
    var pagesWrap = document.querySelector("[data-canvas-pages]");
    if (!pagesWrap) return;

    var syncedDocs = {};
    document.querySelectorAll("[data-cross-seal-doc]").forEach(function (docRail) {
      var docId = docRail.getAttribute("data-cross-seal-doc");
      var stack = document.querySelector('[data-doc-stack="' + docId + '"]');
      if (!stack) return;

      stack.querySelectorAll("[data-pdf-page]").forEach(function (page) {
        var pageId = page.getAttribute("data-page-id");
        var track = docRail.querySelector('[data-cross-seal-track][data-page-id="' + pageId + '"]');
        if (!track) return;
        var pageHeight = page.offsetHeight;
        track.style.height = pageHeight + "px";
        track.style.minHeight = pageHeight + "px";
      });

      syncedDocs[docId] = true;
    });

    Object.keys(syncedDocs).forEach(function (docId) {
      if (getCrossSealPrimaryForDoc(docId)) syncCrossSealFieldsForDoc(docId);
    });
  }

  function refreshCrossSealRailLayout() {
    requestAnimationFrame(function () {
      syncCrossSealRailLayout();
    });
  }

  function syncCrossSealFloatToggle() {
    var toggle = document.querySelector("[data-cross-seal-toggle]");
    if (!toggle) return;
    if (!isCrossSealEnabled()) {
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "骑缝章");
      return;
    }
    toggle.classList.add("is-active");
    toggle.setAttribute("aria-pressed", "true");
    toggle.setAttribute("aria-label", isCrossSealCollapsed() ? "展开骑缝章" : "收起骑缝章");
  }

  function setCrossSealEnabled(enabled) {
    var root = getEditorRoot();
    var rail = document.querySelector("[data-cross-seal-rail]");
    if (!root) return;
    root.classList.toggle("is-cross-seal-open", enabled);
    if (enabled) {
      root.classList.remove("is-cross-seal-collapsed");
      if (rail) rail.removeAttribute("hidden");
    } else {
      root.classList.remove("is-cross-seal-collapsed");
      if (rail) rail.setAttribute("hidden", "");
    }
    syncCrossSealFloatToggle();
    refreshCrossSealRailLayout();
  }

  function setCrossSealCollapsed(collapsed) {
    var root = getEditorRoot();
    if (!root || !isCrossSealEnabled()) return;
    if (isCrossSealCollapsed() === collapsed) return;
    root.classList.toggle("is-cross-seal-collapsed", collapsed);
    syncCrossSealFloatToggle();
    getCrossSealTracks().forEach(function (track) {
      scheduleCrossSealPreviewSync(track);
    });
  }

  function migrateCrossSealRail() {
    var collapseBtn = document.querySelector("[data-cross-seal-collapse]");
    if (collapseBtn) collapseBtn.remove();
  }

  function ensureCanvasColumn() {
    var canvas = document.querySelector("[data-canvas]");
    if (!canvas) return null;
    var existing = canvas.querySelector("[data-canvas-column]");
    if (existing) return existing;

    var pages = Array.prototype.slice.call(canvas.querySelectorAll("[data-pdf-page]"));
    var column = document.createElement("div");
    column.className = "ns-envelope-editor-canvas-column";
    column.setAttribute("data-canvas-column", "");

    var pagesWrap = document.createElement("div");
    pagesWrap.className = "ns-envelope-editor-canvas-pages";
    pagesWrap.setAttribute("data-canvas-pages", "");
    pages.forEach(function (page) {
      pagesWrap.appendChild(page);
    });

    var rail = document.createElement("aside");
    rail.className = "ns-envelope-editor-cross-seal";
    rail.setAttribute("data-cross-seal-rail", "");
    rail.setAttribute("hidden", "");
    rail.setAttribute("aria-label", "骑缝章区域");

    column.appendChild(pagesWrap);
    column.appendChild(rail);
    canvas.insertBefore(column, canvas.firstChild);
    return column;
  }

  function makeCrossSealFieldDraggable(field) {
    if (!field || field.hasAttribute("data-cross-seal-drag-ready")) return;
    field.setAttribute("data-cross-seal-drag-ready", "");

    field.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      if (isCrossSealCollapsed()) return;
      event.stopPropagation();

      var track = field.closest("[data-cross-seal-track]");
      if (!track) return;

      var docId = track.getAttribute("data-doc-id");
      var primary = getCrossSealPrimaryForDoc(docId) || field;
      var editor = getEditorRoot();
      var startPageY = getCrossSealPageY(primary);
      var originX = event.clientX;
      var originY = event.clientY;
      var moved = false;

      field.setPointerCapture(event.pointerId);
      field.classList.add("is-dragging");
      if (editor) editor.classList.add("is-cross-seal-dragging");
      openPropsPanel(primary, { selectionTarget: field });
      bringFieldToFront(field, true);

      function onPointerMove(moveEvent) {
        var deltaX = Math.abs(moveEvent.clientX - originX);
        var deltaY = Math.abs(moveEvent.clientY - originY);
        if (deltaX > 3 || deltaY > 3) moved = true;
        setCrossSealFieldPosition(field, startPageY + clientYToLocalDelta(moveEvent.clientY - originY));
      }

      function onPointerUp(upEvent) {
        field.releasePointerCapture(upEvent.pointerId);
        field.classList.remove("is-dragging");
        if (editor) editor.classList.remove("is-cross-seal-dragging");
        setCrossSealSelection(primary);
        bringFieldToFront(field, false);
        field.removeEventListener("pointermove", onPointerMove);
        field.removeEventListener("pointerup", onPointerUp);
        field.removeEventListener("pointercancel", onPointerUp);
        field.dataset.dragMoved = moved ? "true" : "false";
      }

      field.addEventListener("pointermove", onPointerMove);
      field.addEventListener("pointerup", onPointerUp);
      field.addEventListener("pointercancel", onPointerUp);
    });
  }

  function bindCrossSealFieldClick(field, primary) {
    primary = primary || field;
    field.addEventListener("click", function (event) {
      event.stopPropagation();
      if (isCrossSealCollapsed()) {
        setCrossSealCollapsed(false);
        return;
      }
      if (field.dataset.dragMoved === "true") {
        field.dataset.dragMoved = "false";
        return;
      }
      openPropsPanel(primary, { selectionTarget: field });
    });
  }

  function createCrossSealMirrorField(primary) {
    var mirror = document.createElement("button");
    mirror.type = "button";
    mirror.className = "ns-envelope-editor-field";
    mirror.setAttribute("data-placed-field", "");
    mirror.setAttribute("data-cross-seal-field", "");
    mirror.setAttribute("data-cross-seal-mirror", "");
    mirror.setAttribute("data-field-id", primary.getAttribute("data-field-id") || "");
    mirror.setAttribute("data-field-type", primary.getAttribute("data-field-type") || "seal");
    mirror.setAttribute("data-field-label", primary.getAttribute("data-field-label") || CROSS_SEAL_LABEL);
    mirror.setAttribute("data-field-name", primary.getAttribute("data-field-name") || "");
    mirror.setAttribute("data-field-icon", primary.getAttribute("data-field-icon") || "");
    mirror.setAttribute("data-field-required", primary.getAttribute("data-field-required") || "true");
    FIELD_SETTING_KEYS.forEach(function (key) {
      setFieldSetting(mirror, key, getFieldSetting(primary, key), { skipPreview: true });
    });
    applyFieldPresentation(
      mirror,
      "seal",
      primary.getAttribute("data-field-label") || CROSS_SEAL_LABEL,
      primary.getAttribute("data-field-icon") || "assets/envelope-editor/icon-seal.svg"
    );
    applyFieldStyleSettings(mirror);
    applyCrossSealFieldLayout(mirror);
    syncFieldParty(mirror, primary.getAttribute("data-party") || getActiveParty());
    bindCrossSealFieldClick(mirror, primary);
    makeCrossSealFieldDraggable(mirror);
    return mirror;
  }

  function createCrossSealField(label, icon, topY, sourceField, track) {
    track = track || getCrossSealTrack();
    if (!track) return null;

    var docId = track.getAttribute("data-doc-id");
    if (docId) removeCrossSealForDoc(docId);

    var field = document.createElement("button");
    var id = "field-" + Date.now();
    var iconSrc = icon || "assets/envelope-editor/icon-seal.svg";
    var typeLabel = CROSS_SEAL_LABEL;
    field.type = "button";
    field.className = "ns-envelope-editor-field is-selected";
    field.setAttribute("data-placed-field", "");
    field.setAttribute("data-cross-seal-field", "");
    field.setAttribute("data-cross-seal-primary", "");
    field.setAttribute("data-field-id", id);
    field.setAttribute("data-field-type", "seal");
    field.setAttribute("data-field-label", typeLabel);
    field.setAttribute(
      "data-field-name",
      sourceField ? sourceField.getAttribute("data-field-name") || generateDefaultFieldName(typeLabel) : generateDefaultFieldName(typeLabel)
    );
    field.setAttribute("data-field-icon", iconSrc);
    field.setAttribute("data-field-required", sourceField ? sourceField.getAttribute("data-field-required") || "true" : "true");
    FIELD_SETTING_KEYS.forEach(function (key) {
      var value = sourceField ? getFieldSetting(sourceField, key) : FIELD_DEFAULT_SETTINGS[key];
      setFieldSetting(field, key, value, { skipPreview: true });
    });
    applyFieldPresentation(field, "seal", typeLabel, iconSrc);
    applyFieldStyleSettings(field);
    applyCrossSealFieldLayout(field);
    syncFieldParty(field, sourceField ? sourceField.getAttribute("data-party") || getActiveParty() : getActiveParty());
    track.appendChild(field);
    field.setAttribute("data-cross-seal-page-y", String(Math.round(topY)));
    syncCrossSealMirrors(docId);
    bringFieldToFront(field, false);
    bindCrossSealFieldClick(field);
    makeCrossSealFieldDraggable(field);
    return field;
  }

  function promoteSealToCrossSeal(field, topY, page, track) {
    if (!field || !page) return;
    var icon = field.getAttribute("data-field-icon");
    page.removeChild(field);
    var crossField = createCrossSealField(CROSS_SEAL_LABEL, icon, topY, field, track);
    schedulePagePreviewSync(page);
    if (crossField) openPropsPanel(crossField);
  }

  function initCrossSeal() {
    ensureCanvasColumn();
    migrateCrossSealRail();
    var pagesWrap = document.querySelector("[data-canvas-pages]");
    var docGroups = ensureDocumentStacks(pagesWrap);
    rebuildCrossSealRail(docGroups);
    syncCrossSealRailLayout();

    var toggle = document.querySelector("[data-cross-seal-toggle]");
    if (toggle) {
      toggle.addEventListener("click", function () {
        if (!isCrossSealEnabled()) {
          setCrossSealEnabled(true);
          setCrossSealCollapsed(false);
          return;
        }
        setCrossSealCollapsed(!isCrossSealCollapsed());
      });
    }

    if (pagesWrap && typeof ResizeObserver !== "undefined") {
      var railObserver = new ResizeObserver(function () {
        syncCrossSealRailLayout();
      });
      railObserver.observe(pagesWrap);
      pagesWrap.querySelectorAll("[data-doc-stack]").forEach(function (stack) {
        railObserver.observe(stack);
      });
    }

    window.addEventListener("resize", syncCrossSealRailLayout);
  }

  function createField(type, label, icon, x, y) {
    var field = document.createElement("button");
    var id = "field-" + Date.now();
    var iconSrc = icon || "assets/envelope-editor/icon-" + type + ".svg";
    var anchor = getFieldAnchor(type);
    field.type = "button";
    field.className = "ns-envelope-editor-field is-selected";
    field.setAttribute("data-placed-field", "");
    field.setAttribute("data-field-id", id);
    var typeLabel = label || "控件";
    var fieldName = generateDefaultFieldName(typeLabel);
    field.setAttribute("data-field-label", typeLabel);
    field.setAttribute("data-field-name", fieldName);
    field.setAttribute("data-field-icon", iconSrc);
    field.setAttribute("data-field-required", "true");
    FIELD_SETTING_KEYS.forEach(function (key) {
      setFieldSetting(field, key, FIELD_DEFAULT_SETTINGS[key], { skipPreview: true });
    });
    if (type === "text") field.setAttribute("data-field-guide-text", "");
    applyFieldPresentation(field, type, typeLabel, iconSrc);
    applyFieldStyleSettings(field);
    bringFieldToFront(field, false);
    field.style.left = Math.max(8, Math.round(x - anchor.x)) + "px";
    field.style.top = Math.max(8, Math.round(y - anchor.y)) + "px";
    syncFieldParty(field, getActiveParty());
    field.addEventListener("click", function (event) {
      event.stopPropagation();
      if (field.dataset.dragMoved === "true") {
        field.dataset.dragMoved = "false";
        return;
      }
      if (type === "handwrite") {
        var fieldParty = field.getAttribute("data-party");
        var activeParty = getActiveParty();
        // 在合同发起阶段，只有发起方（purple）可以填写"发起方填写"（gray）的控件
        // 切换到其他方时不可填写任何控件
        if (activeParty !== "purple" || fieldParty !== "gray") {
          return;
        }
        window._currentHandwriteField = field;
        // 检测移动端：优先使用移动端手绘页面
        var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
                       (window.innerWidth <= 768);
        if (isMobile && typeof window._hwMobileOpen === "function") {
          window._hwMobileOnClose = function () { window._hwMobileClose(); };
          window._hwMobileOpen();
        } else if (typeof window.openHandwriteModal === "function") {
          window.openHandwriteModal();
        } else {
          openPropsPanel(field);
        }
      } else {
        openPropsPanel(field);
      }
    });
    makeFieldDraggable(field);
    return field;
  }

  function initDragDrop() {
    var pages = Array.prototype.slice.call(document.querySelectorAll("[data-pdf-page]"));
    if (!pages.length) return;

    function clearDropTargets() {
      pages.forEach(function (page) {
        page.classList.remove("is-drop-target");
      });
      getCrossSealTracks().forEach(function (track) {
        track.classList.remove("is-drop-target");
      });
    }

    function setPaletteGhostVisible(ghost, visible) {
      if (!ghost) return;
      ghost.classList.toggle("is-hidden", !visible);
    }

    document.querySelectorAll(".ns-envelope-editor-tool[data-field-type]").forEach(function (tool) {
      tool.addEventListener("dragstart", function (event) {
        event.preventDefault();
      });

      tool.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;

        var data = {
          type: tool.getAttribute("data-field-type"),
          label: tool.getAttribute("data-field-label"),
          icon: tool.getAttribute("data-field-icon"),
        };
        var originX = event.clientX;
        var originY = event.clientY;
        var started = false;
        var ghost = null;

        function onPointerMove(moveEvent) {
          if (!started) {
            if (Math.abs(moveEvent.clientX - originX) < 4 && Math.abs(moveEvent.clientY - originY) < 4) return;
            started = true;
            ghost = createPaletteGhost(data);
            if (!ghost) return;
            positionPaletteGhost(ghost, moveEvent.clientX, moveEvent.clientY);
            tool.classList.add("is-dragging");
            document.body.classList.add("ns-envelope-editor-is-palette-dragging");
          }

          var page = getPageAtPoint(moveEvent.clientX, moveEvent.clientY);
          var crossSealTarget =
            data.type === "seal" && isCrossSealEnabled() && isPointInCrossSealTrack(moveEvent.clientX, moveEvent.clientY);
          if (!ghost) return;
          positionPaletteGhost(ghost, moveEvent.clientX, moveEvent.clientY);
          setPaletteGhostVisible(ghost, true);
          if (crossSealTarget) {
            clearDropTargets();
            var activeTrack = getCrossSealTrackAtPoint(moveEvent.clientX, moveEvent.clientY);
            if (activeTrack) activeTrack.classList.add("is-drop-target");
          } else if (page) {
            page.classList.add("is-drop-target");
            pages.forEach(function (p) {
              if (p !== page) p.classList.remove("is-drop-target");
            });
          } else {
            clearDropTargets();
          }
        }

        function onPointerEnd(endEvent) {
          document.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerup", onPointerEnd);
          document.removeEventListener("pointercancel", onPointerEnd);

          if (!started) return;

          tool.classList.remove("is-dragging");
          removeDragGhost(ghost);
          ghost = null;
          document.body.classList.remove("ns-envelope-editor-is-palette-dragging");
          clearDropTargets();

          if (
            data.type === "seal" &&
            isCrossSealEnabled() &&
            isPointInCrossSealTrack(endEvent.clientX, endEvent.clientY)
          ) {
            var dropTrack = getCrossSealTrackAtPoint(endEvent.clientX, endEvent.clientY);
            var crossField = createCrossSealField(
              data.label,
              data.icon,
              getCrossSealYFromClient(endEvent.clientY, dropTrack),
              null,
              dropTrack
            );
            if (crossField) openPropsPanel(crossField);
            tool.dataset.paletteDragMoved = "true";
            return;
          }

          var page = getPageAtPoint(endEvent.clientX, endEvent.clientY);
          if (!page) return;

          var point = getPagePoint(page, endEvent.clientX, endEvent.clientY);
          var anchor = getFieldAnchor(data.type);
          if (data.type === "checkbox") {
            var group = createCheckboxGroup(page, point.x - anchor.x, point.y - anchor.y, {
              label: data.label,
              icon: data.icon,
            });
            schedulePagePreviewSync(page);
            openPropsPanel(group);
          } else {
            var field = createField(data.type, data.label, data.icon, point.x, point.y);
            page.appendChild(field);
            positionField(field, point.x - anchor.x, point.y - anchor.y);
            schedulePagePreviewSync(page);
            openPropsPanel(field);
          }
          tool.dataset.paletteDragMoved = "true";
        }

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerEnd);
        document.addEventListener("pointercancel", onPointerEnd);
      });

      tool.addEventListener("click", function (event) {
        if (tool.dataset.paletteDragMoved === "true") {
          tool.dataset.paletteDragMoved = "false";
          event.preventDefault();
        }
      });
    });

    pages.forEach(function (page) {
      page.addEventListener("click", function (event) {
        if (event.target.closest("[data-placed-field], [data-checkbox-group], [data-checkbox-group-add]")) {
          return;
        }
        closePropsPanel();
      });
    });

    var canvas = document.querySelector("[data-canvas]");
    if (canvas) {
      canvas.addEventListener("click", function (event) {
        if (!event.target.closest("[data-placed-field], [data-checkbox-group], [data-cross-seal-field]")) {
          closePropsPanel({ clearSelection: true });
        }
      });
    }

    document.querySelectorAll("[data-cross-seal-field]").forEach(function (field) {
      syncFieldParty(field, field.getAttribute("data-party") || getActiveParty());
      applyFieldStyleSettings(field);
      applyCrossSealFieldLayout(field);
      bringFieldToFront(field, false);
      bindFieldLabelVisibility(field);
      var track = field.closest("[data-cross-seal-track]");
      var docId = track ? track.getAttribute("data-doc-id") : "";
      var primary = field.hasAttribute("data-cross-seal-primary") ? field : getCrossSealPrimaryForDoc(docId);
      bindCrossSealFieldClick(field, primary || field);
      makeCrossSealFieldDraggable(field);
    });

    document.querySelectorAll('[data-placed-field][data-field-type="checkbox"]').forEach(function (field) {
      if (!field.closest("[data-checkbox-group]")) wrapLegacyCheckboxField(field);
    });

    document.querySelectorAll("[data-checkbox-group]").forEach(function (group) {
      ensureCheckboxGroupFrame(group);
      updateCheckboxGroupBounds(group);
    });

    document.querySelectorAll("[data-placed-field]").forEach(function (field) {
      if (field.hasAttribute("data-checkbox-item")) return;
      if (field.hasAttribute("data-cross-seal-field")) return;
      syncFieldParty(field, field.getAttribute("data-party") || getActiveParty());
      applyFieldStyleSettings(field);
      bringFieldToFront(field, false);
      ensureFieldResizeHandles(field);
      if (!isFieldResizable(field) || !field.style.width || !field.style.height) {
        applyFieldDefaultSize(field, field.getAttribute("data-field-type"));
      }
      bindFieldLabelVisibility(field);
      if (field.getAttribute("data-field-type") === "text") {
        if (!field.querySelector("[data-field-text-display]")) {
          applyFieldPresentation(
            field,
            "text",
            field.getAttribute("data-field-label"),
            field.getAttribute("data-field-icon")
          );
        } else {
          syncTextFieldDisplay(field);
          bindTextFieldBehaviors(field);
        }
      }
      makeFieldDraggable(field);
      field.addEventListener("click", function (event) {
        event.stopPropagation();
        if (field.dataset.dragMoved === "true") {
          field.dataset.dragMoved = "false";
          return;
        }
        openPropsPanel(field);
      });
    });
  }

  function initThumbsToggle() {
    var editor = getEditor();
    var toggle = document.querySelector("[data-thumbs-toggle]");
    if (!editor || !toggle) return;
    toggle.addEventListener("click", function () {
      var collapsed = editor.classList.toggle("is-thumbs-collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", collapsed ? "展开文档缩略图" : "收起文档缩略图");
    });
  }

  window.getEnvelopeEditorZoom = getCurrentZoom;

  function initZoomControls() {
    var trigger = document.querySelector("[data-zoom-trigger]");
    var menu = document.querySelector("[data-zoom-menu]");
    var zoomIn = document.querySelector("[data-zoom-in]");
    var zoomOut = document.querySelector("[data-zoom-out]");
    var canvas = document.querySelector("[data-canvas]");
    if (!trigger || !menu) return;

    function closeMenu() {
      menu.setAttribute("hidden", "");
      trigger.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      menu.removeAttribute("hidden");
      trigger.setAttribute("aria-expanded", "true");
    }

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      if (menu.hasAttribute("hidden")) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    menu.querySelectorAll("[data-zoom-value]").forEach(function (option) {
      option.addEventListener("click", function () {
        setZoom(parseFloat(option.getAttribute("data-zoom-value") || "1"));
        closeMenu();
      });
    });

    menu.querySelectorAll("[data-zoom-fit]").forEach(function (option) {
      option.addEventListener("click", function () {
        setZoom(getFitToScreenZoom(), { fitToScreen: true });
        closeMenu();
      });
    });

    if (zoomIn) {
      zoomIn.addEventListener("click", function () {
        setZoom(getNextZoom(1));
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener("click", function () {
        setZoom(getNextZoom(-1));
      });
    }

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !trigger.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    setZoom(1);
  }

  function setActivePageThumb(pageId) {
    if (!pageId) return;
    document.querySelectorAll("[data-page-target]").forEach(function (thumb) {
      thumb.classList.toggle("is-active", thumb.getAttribute("data-page-target") === pageId);
    });
  }

  function initPageThumbs() {
    var canvas = document.querySelector("[data-canvas]");
    var pages = Array.prototype.slice.call(document.querySelectorAll("[data-pdf-page][data-page-id]"));
    var thumbs = Array.prototype.slice.call(document.querySelectorAll("[data-page-target]"));
    if (!canvas || !pages.length || !thumbs.length) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var pageId = thumb.getAttribute("data-page-target");
        var page = document.querySelector('[data-pdf-page][data-page-id="' + pageId + '"]');
        if (!page) return;
        page.scrollIntoView({ behavior: "smooth", block: "start" });
        setActivePageThumb(pageId);
      });
    });

    canvas.addEventListener("scroll", function () {
      var canvasTop = canvas.getBoundingClientRect().top;
      var activePage = pages.reduce(function (closest, page) {
        var distance = Math.abs(page.getBoundingClientRect().top - canvasTop - 32);
        if (!closest || distance < closest.distance) {
          return { page: page, distance: distance };
        }
        return closest;
      }, null);
      if (activePage) setActivePageThumb(activePage.page.getAttribute("data-page-id"));
    });

    setActivePageThumb(pages[0].getAttribute("data-page-id"));
  }

  function initPropsPanel() {
    var panel = document.querySelector("[data-props-panel]");
    if (!panel) return;
    var close = panel.querySelector("[data-props-close]");
    var remove = panel.querySelector("[data-delete-field]");
    var required = panel.querySelector("[data-props-required]");
    var nameInput = panel.querySelector("[data-props-name]");
    var hintInput = panel.querySelector("[data-props-hint]");
    var leftInput = panel.querySelector("[data-props-left]");
    var topInput = panel.querySelector("[data-props-top]");
    var guideInput = panel.querySelector("[data-props-guide-text]");
    var textMultiline = panel.querySelector("[data-props-text-multiline]");
    var textFontSize = panel.querySelector("[data-props-text-font-size]");
    var handwriteFontSize = panel.querySelector("[data-props-handwrite-font-size]");
    var handwriteGuide = panel.querySelector("[data-props-handwrite-guide]");
    var attachmentAllowMultiple = panel.querySelector("[data-props-attachment-allow-multiple]");
    var checkboxAdd = panel.querySelector("[data-props-checkbox-add]");

    function bindSelectSetting(selector, key) {
      var select = panel.querySelector(selector);
      if (!select) return;
      select.querySelectorAll(".ns-select__option").forEach(function (option) {
        option.addEventListener("click", function () {
          var field = getEditingField();
          if (!field) return;
          setFieldSetting(field, key, option.getAttribute("data-value") || "");
        });
      });
    }

    function bindPositionInput(input, axis) {
      if (!input) return;
      input.addEventListener("input", function () {
        var field = getEditingField();
        if (!field) return;
        var next = parseInt(String(input.value || "").replace(/[^\d-]/g, ""), 10);
        if (!Number.isFinite(next)) return;
        if (field.hasAttribute("data-cross-seal-field")) {
          if (axis !== "y") return;
          var track = field.closest("[data-cross-seal-track]");
          var docId = track ? track.getAttribute("data-doc-id") : "";
          if (docId) setCrossSealPageY(docId, next);
          return;
        }
        var left = parseFloat(field.style.left) || 0;
        var top = parseFloat(field.style.top) || 0;
        setFieldPosition(field, axis === "x" ? next : left, axis === "y" ? next : top);
        schedulePagePreviewSync(field.closest("[data-pdf-page]"));
      });
    }

    if (close) {
      close.addEventListener("click", function () {
        closePropsPanel({ clearSelection: false });
      });
    }

    if (required) {
      required.addEventListener("change", function () {
        setFieldRequired(getEditingField(), required.checked);
      });
    }

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        var field = getEditingField();
        if (field) field.setAttribute("data-field-name", nameInput.value);
      });
    }

    if (hintInput) {
      hintInput.addEventListener("input", function () {
        setFieldSetting(getEditingField(), "hint", hintInput.value);
      });
    }

    bindPositionInput(leftInput, "x");
    bindPositionInput(topInput, "y");

    if (guideInput) {
      guideInput.addEventListener("input", function () {
        var field = getEditingField();
        if (!field || field.getAttribute("data-field-type") !== "text") return;
        setFieldGuideText(field, guideInput.value, { skipPropsSync: true });
      });
    }

    if (textMultiline) {
      textMultiline.addEventListener("change", function () {
        setFieldSetting(getEditingField(), "textMultiline", textMultiline.checked ? "true" : "false");
      });
    }

    if (textFontSize) {
      textFontSize.addEventListener("input", function () {
        setFieldSetting(getEditingField(), "textFontSize", textFontSize.value || FIELD_DEFAULT_SETTINGS.textFontSize);
      });
    }

    if (handwriteFontSize) {
      handwriteFontSize.addEventListener("input", function () {
        var editingField = getEditingField();
        setFieldSetting(editingField, "handwriteFontSize", handwriteFontSize.value || FIELD_DEFAULT_SETTINGS.handwriteFontSize);
        // 同步更新弹窗中的引导文案字体大小
        var guideTextEl = document.getElementById('handwriteGuideText');
        if (guideTextEl) guideTextEl.style.fontSize = (handwriteFontSize.value || FIELD_DEFAULT_SETTINGS.handwriteFontSize) + 'px';
      });
    }

    if (handwriteGuide) {
      handwriteGuide.addEventListener("input", function () {
        var editingField = getEditingField();
        setFieldSetting(editingField, "handwriteGuide", handwriteGuide.value);
        if (editingField) syncHandwriteGuideDisplay(editingField);
      });
    }

    if (attachmentAllowMultiple) {
      attachmentAllowMultiple.addEventListener("change", function () {
        setFieldSetting(getEditingField(), "attachmentAllowMultiple", attachmentAllowMultiple.checked ? "true" : "false");
      });
    }

    if (checkboxAdd) {
      checkboxAdd.addEventListener("click", function () {
        var group = getEditingField();
        if (!group || group.getAttribute("data-field-type") !== "checkbox") return;
        addCheckboxGroupOption(group);
      });
    }

    bindSelectSetting("[data-props-seal-use-scope]", "sealUseScope");
    bindSelectSetting("[data-props-seal-size-rule]", "sealSizeRule");
    bindSelectSetting("[data-props-date-format]", "dateFormat");
    bindSelectSetting("[data-props-date-font-size]", "dateFontSize");
    bindSelectSetting("[data-props-text-font-family]", "textFontFamily");
    bindSelectSetting("[data-props-image-ratio]", "imageRatio");

    if (remove) {
      remove.addEventListener("click", function () {
        deleteField(getEditingField());
      });
    }
  }

  function initAutoHideScrollbar(container) {
    if (!container || container.hasAttribute("data-scrollbar-ready")) return;
    container.setAttribute("data-scrollbar-ready", "");
    var hideTimer = null;

    function revealScrollbar() {
      container.classList.add("is-scrolling");
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        container.classList.remove("is-scrolling");
        hideTimer = null;
      }, 700);
    }

    container.addEventListener("scroll", revealScrollbar, { passive: true });
  }

  function initCanvasScrollActions() {
    var canvas = document.querySelector("[data-canvas]");
    var actions = document.querySelector("[data-scroll-actions]");
    if (!canvas || !actions) return;

    var topBtn = actions.querySelector("[data-scroll-top]");
    var bottomBtn = actions.querySelector("[data-scroll-bottom]");
    var threshold = 4;

    function canScroll() {
      return canvas.scrollHeight - canvas.clientHeight > threshold;
    }

    function isAtTop() {
      return canvas.scrollTop <= threshold;
    }

    function isAtBottom() {
      return canvas.scrollTop + canvas.clientHeight >= canvas.scrollHeight - threshold;
    }

    function refreshScrollActions() {
      if (!canScroll()) {
        actions.setAttribute("hidden", "");
        return;
      }

      actions.removeAttribute("hidden");
      actions.classList.toggle("is-top-hidden", isAtTop());
      actions.classList.toggle("is-bottom-hidden", isAtBottom());
    }

    updateCanvasScrollActions = refreshScrollActions;

    if (topBtn) {
      topBtn.addEventListener("click", function () {
        canvas.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (bottomBtn) {
      bottomBtn.addEventListener("click", function () {
        canvas.scrollTo({ top: canvas.scrollHeight - canvas.clientHeight, behavior: "smooth" });
      });
    }

    canvas.addEventListener("scroll", refreshScrollActions, { passive: true });
    window.addEventListener("resize", refreshScrollActions);

    if (typeof ResizeObserver !== "undefined") {
      var resizeObserver = new ResizeObserver(refreshScrollActions);
      resizeObserver.observe(canvas);
      Array.prototype.forEach.call(canvas.children, function (child) {
        resizeObserver.observe(child);
      });
    }

    refreshScrollActions();
  }

  function initScrollbars() {
    document.querySelectorAll(".ns-scrollbar-auto").forEach(initAutoHideScrollbar);
  }

  function init() {
    setActiveParty("purple");
    initPartyMenus();
    initZoomControls();
    initCrossSeal();
    initDragDrop();
    initThumbsToggle();
    initPageThumbs();
    initPropsPanel();
    initFieldShortcuts();
    initScrollbars();
    initCanvasScrollActions();
    syncAllPagePreviews();
    refreshCrossSealRailLayout();
    if (window.NotaSignComponents && window.NotaSignComponents.initSelects) {
      window.NotaSignComponents.initSelects(document.querySelector("[data-props-panel]"));
    }
    if (window.NotaSignComponents && window.NotaSignComponents.initInputNumbers) {
      window.NotaSignComponents.initInputNumbers(document.querySelector("[data-props-panel]"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
