(function ($) {
    "use strict";
  
    function stotage_section_start_render() {
      var _elementor = typeof elementor !== "undefined" ? elementor : elementorFrontend;
  
      if (!_elementor || !_elementor.hooks) {
        console.warn("Elementor hooks not available");
        return;
      }
  
      _elementor.hooks.addFilter(
        "pxl_element_container/before-render",
        function (html, settings, el) {
          function addStarAndLight() {
            if (
              settings.pxl_container_star_color_option === "yes" &&
              settings.pxl_container_star_color
            ) {
              const w = (settings.pxl_container_star_width || {}).size ?? null;
              const wu = (settings.pxl_container_star_width || {}).unit ?? "px";
              const h = (settings.pxl_container_star_height || {}).size ?? null;
              const hu = (settings.pxl_container_star_height || {}).unit ?? "px";
              const n = settings.pxl_container_star_number ?? 60;
  
              let starStyle = "";
              if (Number.isFinite(w)) starStyle += `width:${w}${wu};`;
              if (Number.isFinite(h)) starStyle += `height:${h}${hu};`;
  
              html +=
                `<canvas class="pxl-star"` +
                ` data-color="${settings.pxl_container_star_color}"` +
                ` data-star="${n}"` +
                ` style="${starStyle}"></canvas>`;
            }
  
            if (
              settings.pxl_container_light_color_option === "yes" &&
              settings.pxl_container_light_color
            ) {
              const w =
                (settings.pxl_container_light_width || {}).size ??
                (settings.pxl_container_star_width || {}).size ??
                null;
              const wu =
                (settings.pxl_container_light_width || {}).unit ??
                (settings.pxl_container_star_width || {}).unit ??
                "px";
              const h =
                (settings.pxl_container_light_height || {}).size ??
                (settings.pxl_container_star_height || {}).size ??
                null;
              const hu =
                (settings.pxl_container_light_height || {}).unit ??
                (settings.pxl_container_star_height || {}).unit ??
                "px";
  
              const blurVal = (settings.pxl_container_light_blur || {}).size ?? 0;
              const opacityRaw = (settings.pxl_container_light_opacity || {}).size ?? 100;
              const opacity = Math.max(0, Math.min(+opacityRaw / 100, 1)); // 0 → 1
  
              let lightStyle = "";
              if (Number.isFinite(w)) lightStyle += `width:${w}${wu};`;
              if (Number.isFinite(h)) lightStyle += `height:${h}${hu};`;
              lightStyle += `background:${settings.pxl_container_light_color};`;
              lightStyle += `opacity:${opacity};`;
              if (blurVal > 0) lightStyle += `filter:blur(${blurVal}px);`;
  
              clearTimeout(window.pxlRenderStarTimeout);
              window.pxlRenderStarTimeout = setTimeout(() => {
                const canvas = document.createElement("canvas");
                canvas.className = "pxl-star";
                canvas.setAttribute("data-color", settings.pxl_container_star_color);
                canvas.setAttribute("data-star", n);
                canvas.setAttribute("style", starStyle);
  
                document.querySelector(".elementor-element-" + settings._id).appendChild(canvas);
              }, 2000);
            }
          }
          addStarAndLight();
          return html;
        }
      );
    }
  
  
    function initCustomFunctions() {
      try {
        if (typeof stotage_section_start_render === "function") {
          stotage_section_start_render();
        }
      } catch (error) {
        console.error("Error initializing custom functions:", error);
      }
    }
  
    $(window).on("elementor/frontend/init", function () {
      initCustomFunctions();
    });
  
    $(document).ready(function () {
      setTimeout(function () {
        if (typeof elementor !== "undefined") {
          initCustomFunctions();
        }
      }, 1000);
    });
  
  })(jQuery);
  