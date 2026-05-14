(function ($) {

  function stotage_css_inline_js() {
    var _inline_css = "<style>";
    $(document).find('.pxl-inline-css').each(function () {
      var _this = $(this);
      _inline_css += _this.attr("data-css") + " ";
      _this.remove();
    });
    _inline_css += "</style>";
    $('head').append(_inline_css);
  }
  function stotage_svg_color($scope) {
    "use strict";

    jQuery($scope).find('.pxl-grid .pxl-post--icon img').each(function () {
      var $img = jQuery(this);
      var imgID = $img.attr('id');
      var imgClass = $img.attr('class');
      var imgURL = $img.attr('src');

      jQuery.get(imgURL, function (data) {
        var $svg = jQuery(data).find('svg');
        if (imgID) {
          $svg.attr('id', imgID);
        }
        if (imgClass) {
          $svg.attr('class', imgClass + ' replaced-svg');
        }
        $svg.removeAttr('xmlns:a');
        if (!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
          $svg.attr('viewBox', '0 0 24 24');
        }
        $img.replaceWith($svg);
      }, 'xml');
    });
  }
  var PXL_Icon_Contact_Form = function ($scope, $) {

    setTimeout(function () {
      $('.pxl--item').each(function () {
        var icon_input = $(this).find(".pxl--form-icon"),
          control_wrap = $(this).find('.wpcf7-form-control');
        control_wrap.before(icon_input.clone());
        icon_input.remove();
      });
    }, 10);

  };

  function stotage_height_des($scope) {
    $scope.find('.pxl-testimonial-grid').each(function () {
      const $grid = $(this);
      let maxHeight = 0;

      const $items = $grid.find('.pxl-item--description');
      $items.css('min-height', '');
      $items.each(function () {
        const height = $(this).outerHeight();
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      $items.css('min-height', maxHeight + 'px');
    });
  }

  function stotage_split_text($scope) {
    var st = $scope.find(".pxl-split-text");
    if (st.length == 0) return;
    gsap.registerPlugin(SplitText);

    st.each(function (index, el) {
      var els = $(el).find('p').length > 0 ? $(el).find('p')[0] : el;
      const pxl_split = new SplitText(els, {
        type: "lines, words, chars",
        lineThreshold: 0.5,
        linesClass: "split-line"
      });
      var split_type_set = pxl_split.chars;

      gsap.set(els, { perspective: 400 });

      var settings = {
        scrollTrigger: {
          trigger: els,
          toggleActions: "play none none none",
          start: "top 86%",
          once: true
        },
        duration: 0.8,
        stagger: 0.02,
        ease: "Linear.easeNone"
      };
      if ($(el).hasClass('split-in-fade')) {
        settings.opacity = 0;
      }
      if ($(el).hasClass('split-in-right')) {
        settings.opacity = 0;
        settings.x = "50";
      }
      if ($(el).hasClass('split-in-left')) {
        settings.opacity = 0;
        settings.x = "-50";
      }
      if ($(el).hasClass('split-in-up')) {
        settings.opacity = 0;
        settings.y = "80";
      }
      if ($(el).hasClass('split-in-down')) {
        settings.opacity = 0;
        settings.y = "-80";
      }
      if ($(el).hasClass('split-in-rotate')) {
        settings.opacity = 0;
        settings.rotateX = "50deg";
      }
      if ($(el).hasClass('split-in-scale')) {
        settings.opacity = 0;
        settings.scale = "0.5";
      }

      if ($(el).hasClass('split-lines-transform')) {
        pxl_split.split({
          type: "lines",
          lineThreshold: 0.5,
          linesClass: "split-line"
        });
        split_type_set = pxl_split.lines;
        settings.opacity = 0;
        settings.yPercent = 100;
        settings.autoAlpha = 0;
        settings.stagger = 0.1;
      }
      if ($(el).hasClass('split-lines-rotation-x')) {
        pxl_split.split({
          type: "lines",
          lineThreshold: 0.5,
          linesClass: "split-line"
        });
        split_type_set = pxl_split.lines;
        settings.opacity = 0;
        settings.rotationX = -120;
        settings.transformOrigin = "top center -50";
        settings.autoAlpha = 0;
        settings.stagger = 0.1;
      }
      if ($(el).hasClass('btn-text-timeline')) {
        settings.opacity = 0;
        settings.scale = "1.2";
        settings.y = "-60";
        settings.transformOrigin = "top center -50";
        settings.autoAlpha = 0;
        settings.stagger = 0.1;
      }

      if ($(el).hasClass('split-words-scale')) {
        pxl_split.split({ type: "words" });
        split_type_set = pxl_split.words;

        $(split_type_set).each(function (index, elw) {
          gsap.set(elw, {
            opacity: 0,
            scale: index % 2 == 0 ? 0 : 2,
            force3D: true,
            duration: 0.1,
            ease: "Linear.easeNone",
            stagger: 0.02,
          }, index * 0.01);
        });

        var pxl_anim = gsap.to(split_type_set, {
          scrollTrigger: {
            trigger: el,
            toggleActions: "play none none none",
            start: "top 86%",
          },
          rotateX: "0",
          scale: 1,
          opacity: 1,
        });
      } else {
        var pxl_anim = gsap.from(split_type_set, settings);
      }

      if ($(el).hasClass('hover-split-text')) {
        $(el).mouseenter(function (e) {
          pxl_anim.restart();
        });
      }
    });
  }

  function stotage_scroll_trigger($scope) {

    $scope.find(".pxl-section-scale").each(function () {

      const $container = $(this).find(".wrap-scroll-section");
      if (!$container.length) return;

      gsap.fromTo(
        $container[0],
        {
          width: "20%",
          height: "10%",
          borderRadius: 30
        },
        {
          width: "100%",
          height: "100%",
          borderRadius: 0,
          ease: "power1.out",
          duration: 2,
          scrollTrigger: {
            trigger: $container[0],
            pin: $(this)[0],     // pin chính phần .pxl-section-scale đang lặp
            start: "bottom 60%",
            end: "top top",     // thử "+=100%" nếu muốn cuộn dài hơn
            scrub: true,
            immediateRender: false
          }
        }
      );
    });
  }


  function stotage_scroll_text($scope) {
    const $targets = $scope.find(".pxl-item--title.style-scroll-bg");
    if (!$targets.length) return; // Không có target thì thoát

    $targets.each(function () {
      var $container = $(this);
      if (!$container.length) return; // Check từng phần tử

      var text = new SplitText($container[0], { type: 'words, chars' });
      if (!text || !text.words.length) return;

      $(text.words).children().first().addClass("first-char");

      gsap.fromTo(
        text.chars,
        {
          position: 'relative',
          display: 'inline-block',
          opacity: 0.2,
          x: -5,
        },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          scrollTrigger: {
            trigger: $container[0],
            toggleActions: "play pause reverse pause",
            start: "top 70%",
            end: "top 40%",
            scrub: 0.7,
          }
        }
      );
    });
  }


  function stotage_scroll_line($scope) {
    $scope.find(".pxl-line-scroll .line").each(function () {
      var $container = $(this);

      var text = new SplitText($container[0], { type: 'words, chars' });

      $(text.words).children().first().addClass("first-char");

      gsap.fromTo(text.chars,
        {
          position: 'relative',
          display: 'inline-block',
          opacity: 0.2,
          x: -5,
        },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          scrollTrigger: {
            trigger: $container[0],
            toggleActions: "play pause reverse pause",
            start: "top 70%",
            end: "top 40%",
            scrub: 0.7,
          }
        }
      );
    });
  }
  function stotage_scroll_text_horizontal($scope) {
    $scope.find(".pxl-heading--inner .split-scroll-horizontal").each(function () {
      var $container = $(this);

      var containerWidth = $container.outerWidth();
      var screenWidth = window.innerWidth;
      var xOffset = -(containerWidth - screenWidth) + "px";

      gsap.fromTo(
        $container[0],
        { x: '0px' },
        {
          x: xOffset,
          ease: "power1.out",
          duration: 2,
          scrollTrigger: {
            trigger: $container[0],
            markers: false,
            start: "top 100",
            end: "bottom 10%",
            scrub: 1,
            pin: true,
          }
        }
      );
    });

  }
  function stotage_video_scroll($scope) {
    if (window.innerWidth <= 992) {
      return;
    }
    $scope.find(".pxl-video-player.style-2").each(function () {
      var $container = $(this);
      var $inner = $container.find(".pxl-video--inner");

      gsap.fromTo(
        $container[0],
        {
        },
        {
          scrollTrigger: {
            trigger: $container[0],
            start: "top 15%",
            end: () => "+=700",
            scrub: 1,
            pin: $inner,
            onUpdate: (self) => {
              if (self.scroll() - self.start >= 300) {
                $inner.addClass("active");
              } else {
                $inner.removeClass("active");
              }
            }
          }
        }
      );
    });
  }

  function stotage_image_scroll($scope) {
    if (window.innerWidth <= 1025) {
      return;
    }

    $scope.find(".pxl-image-circle .pxl-image-inner.list-1").each(function () {
      var $container = $(this);

      gsap.fromTo(
        $container[0],
        {
          scale: 0,
          rotate: -45,
        },
        {
          scale: 1,
          rotate: 45,
          scrollTrigger: {
            trigger: $container[0],
            start: "bottom bottom",
            end: "top 50%",
            scrub: 1,
          }
        }
      );
    });

    $scope.find(".pxl-image-circle .pxl-image-inner.list-2").each(function () {
      var $container = $(this);
      gsap.fromTo(
        $container[0],
        {
          scale: 0,
          rotate: 45,
        },
        {
          scale: 1,
          rotate: -45,
          scrollTrigger: {
            trigger: $container[0],
            start: "bottom bottom",
            end: "top 50%",
            scrub: 1,
          }
        }
      );
    });
  }


  function stotage_image_scroll2($scope) {

    $scope.find(".pxl-img-scroll .wrap-content").each(function () {
      const $container = $(this);
      const $wrapper = $container.closest('.pxl-wrap-scroll');
      const $imgScroll = $container.closest('.pxl-img-scroll');
      const $content = $imgScroll.find('.content');
      const scrollLength = 2000;

      ScrollTrigger.create({
        trigger: $wrapper[0],
        start: "top top",
        end: `+=${scrollLength}`,
        pin: $wrapper[0],
        scrub: true,
        anticipatePin: 1,
        onUpdate: self => {
          const progress = self.progress;
          const fadeStart = 0.65; // bắt đầu từ 1300px
          const fadeEnd = 1.0;

          if (progress >= fadeStart) {
            const fadeProgress = (progress - fadeStart) / (fadeEnd - fadeStart);
            gsap.to($content[0], {
              opacity: fadeProgress,
              overwrite: true,
              duration: 0.1
            });
          } else {
            gsap.to($content[0], {
              opacity: 0,
              overwrite: true,
              duration: 0.1
            });
          }
        }
      });

      gsap.fromTo(
        $container[0],
        {
          transform: "translate3d(0px, 0px, -144rem) scale3d(1,1,1)"
        },
        {
          transform: "translate3d(0px, 0px, 360rem) scale3d(1,1,1)",
          scrollTrigger: {
            trigger: $wrapper[0],
            start: "top top",
            end: `+=${scrollLength}`,
            scrub: true
          }
        }
      );
    });
  }
  function stotage_image_scroll3($scope) {
    if (window.innerWidth <= 1201) {
      return;
    }
    const factor = 2.5;

    $scope.find('.pxl-hide-scroll').each(function () {
      const $container = $(this);
      const $inner = $container.children().first();

      if ($inner.length === 0) return;

      const innerHeight = $inner.outerHeight();

      let estimatedScroll = Math.floor(600 - innerHeight / factor);
      estimatedScroll = Math.max(100, Math.min(estimatedScroll, 300));

      $container.data({
        inner: $inner,
        innerHeight: innerHeight,
        maxScroll: estimatedScroll
      });

      setTimeout(() => {
        $container.addClass('overflow-hidden');
      }, 200);
    });

    $(window).on('scroll.pxlHideScroll', function () {
      const scrollTop = $(window).scrollTop();

      $scope.find('.pxl-hide-scroll').each(function () {
        const $container = $(this);
        const $inner = $container.data('inner');
        const innerHeight = $container.data('innerHeight');
        const maxScroll = $container.data('maxScroll');

        if (!$inner || !innerHeight || !maxScroll) return;

        const progress = Math.min(scrollTop / maxScroll, 1);
        const translateY = -innerHeight * progress;
        $inner[0].style.setProperty('transform', `translateY(${translateY}px)`, 'important');
      });
    });
  }

  function stotage_height_margin($scope) {
    $scope.find(".pxl-icon-box4 .pxl-item").each(function () {
      let $content = $(this).find(".pxl-item-content");
      let height = $content.outerHeight() || 0;

      $content.css("margin-bottom", `-${height}px`);
    });
  }

  function stotage_image_scroll4($scope) {
    if (window.innerWidth <= 1200) {
      return;
    }
    const $wrapper = $scope.find(".pxl-image-list-3 .pxl-items-inner");
    if (!$wrapper.length) return;

    const $items = $wrapper.find(".pxl-item");
    const scrollLength = 700;

    const completed = new Array($items.length).fill(false);

    $items.each(function (index) {
      const element = this;
      const currentTransform = window.getComputedStyle(element).transform;
      if (currentTransform === "none") return;

      gsap.to(element, {
        transform: "translate3d(0px, 0px, 0px) scale3d(1,1,1)",
        scrollTrigger: {
          trigger: element,
          start: "top 15%",
          end: `+=${scrollLength}`,
          scrub: true,
          onLeave: () => {
            completed[index] = true;
            checkAllCompleted();
          },
          onEnterBack: () => {
            completed[index] = false;
            checkAllCompleted();
          }
        }
      });
    });

    function checkAllCompleted() {
      if (completed.every(done => done)) {
        $wrapper.addClass("active-hover");
      } else {
        $wrapper.removeClass("active-hover");
      }
    }
  }







  function stotage_video_height($scope) {
    function updateHeights() {
      let maxImageHeight = 0;

      $scope.find('.pxl-image-carousel1 img').each(function () {
        const $img = $(this);
        if ($img[0].complete && $img[0].naturalHeight !== 0) {
          const height = $img.height();
          if (height > maxImageHeight) {
            maxImageHeight = height;
          }
        }
      });

      $scope.find('.pxl-image-carousel1 .pxl-item--video').each(function () {
        $(this).height(maxImageHeight);
      });

      const heightCount = {};
      const $inners = $scope.find('.pxl-image-carousel1 .pxl-item--inner');

      $inners.each(function () {
        const h = Math.round($(this).outerHeight());
        if (h > 0) {
          heightCount[h] = (heightCount[h] || 0) + 1;
        }
      });
      let commonHeight = 0;
      let maxCount = 0;
      for (let h in heightCount) {
        if (heightCount[h] > maxCount) {
          maxCount = heightCount[h];
          commonHeight = parseInt(h);
        }
      }
      $inners.each(function () {
        const $el = $(this);
        const h = Math.round($el.outerHeight());
        if (h === 0 && commonHeight > 0) {
          $el.css('min-height', commonHeight + 'px');
        }
      });
    }
    setTimeout(updateHeights, 100);
    $(window).off('resize.stotage_video_height').on('resize.stotage_video_height', function () {
      setTimeout(updateHeights, 100);
    });
  }





  function stotage_scroll_image_list_addclass($scope) {
    $scope.find(".pxl-image-list.pre-load").each(function () {
      const $el = $(this);
      $el.removeClass('pre-load');
      setTimeout(function () {
        $el.addClass('cpl-load');
      }, 2000);
    });
  }

  function stotage_scroll_image_list($scope) {
    $scope.find(".pxl-image-list .pxl-image-list-content .list-image.list-odd").each(function () {
      var $container = $(this);
      gsap.fromTo(
        $container[0],
        { y: "0%" },
        {
          y: "15%",
          ease: "power1.out",
          duration: 2,
          scrollTrigger: {
            trigger: $container[0],
            start: "top top",
            end: "top -100%",
            scrub: true,
            immediateRender: false
          }
        }
      );
    });
    $scope.find(".pxl-image-list .pxl-image-list-content .list-image.list-even").each(function () {
      var $container = $(this);
      gsap.fromTo(
        $container[0],
        { y: "0%" },
        {
          y: "-15%",
          ease: "power1.out",
          duration: 2,
          scrollTrigger: {
            trigger: $container[0],
            start: "top top",
            end: "top -100%",
            scrub: true,
            immediateRender: false
          }
        }
      );
    });
  }


  function stotage_scroll_image_list_2($scope) {
    if (window.innerWidth <= 767) {
      return;
    }

    const $section = $scope.find(".pxl-image-list-2");
    if (!$section.length) return;

    const $allImgs = $section.find("img");
    if (!$allImgs.length) return;

    // Hàm chờ load tất cả ảnh
    function waitForImages($imgs, callback) {
      let loadedCount = 0;
      const total = $imgs.length;

      $imgs.each(function () {
        if (this.complete && this.naturalWidth !== 0) {
          loadedCount++;
          if (loadedCount === total) callback();
        } else {
          $(this).one("load error", () => {
            loadedCount++;
            if (loadedCount === total) callback();
          });
        }
      });
    }

    waitForImages($allImgs, () => {
      const $colLeftImgs = $section.find(".col-left img");
      const $colRightImgs = $section.find(".col-right img");
      const $feature = $section.find(".image-feature");
      const $wrap = $feature.find(".wrap-image");
      const $img = $wrap.find("img");

      if (!$img.length) return;

      const naturalWidth = $img[0].naturalWidth || $wrap.outerWidth();
      const naturalHeight = $img[0].naturalHeight || $wrap.outerHeight();
      const scaleFrom = 1.6;
      const fromWidth = naturalWidth * scaleFrom;
      const fromHeight = naturalHeight * scaleFrom;

      $feature.css({
        width: fromWidth,
        height: fromHeight,
        maxWidth: "none",
        maxHeight: "none",
        position: "sticky",
        top: "20vh",
        zIndex: 2
      });

      $wrap.css({
        width: fromWidth,
        height: fromHeight,
        maxWidth: "none",
        maxHeight: "none"
      });

      const maxHeight = Math.max(
        $section.find(".col-left")[0]?.scrollHeight || 0,
        $section.find(".col-right")[0]?.scrollHeight || 0
      );

      $section.css({
        position: "relative",
        height: maxHeight + "px"
      });

      function animateScrollImages() {
        if (window.innerWidth <= 767) {
          return;
        }
        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();
        const sectionOffset = $section.offset().top;
        const scrollRange = maxHeight;
        const progress = Math.min(Math.max((scrollTop - sectionOffset) / scrollRange, 0), 1);
        const currentWidth = fromWidth - (fromWidth - naturalWidth) * progress;
        const currentHeight = fromHeight - (fromHeight - naturalHeight) * progress;

        $feature.css({ width: currentWidth, height: currentHeight });
        $wrap.css({ width: currentWidth, height: currentHeight });

        $colLeftImgs.each(function () {
          const imgTop = $(this).offset().top;
          const start = windowHeight;
          const end = 0.2 * windowHeight;
          const progress = (start - imgTop + scrollTop) / (start - end);
          const clamped = Math.min(Math.max(progress, 0), 1);
          const translateX = 100 - 100 * clamped;
          $(this).css("transform", `translateX(${translateX}%)`);
        });

        $colRightImgs.each(function () {
          const imgTop = $(this).offset().top;
          const start = windowHeight;
          const end = 0.2 * windowHeight;
          const progress = (start - imgTop + scrollTop) / (start - end);
          const clamped = Math.min(Math.max(progress, 0), 1);
          const translateX = -100 + 100 * clamped;
          $(this).css("transform", `translateX(${translateX}%)`);
        });
      }

      $(window).on("scroll resize", animateScrollImages);
      animateScrollImages();
    });
  }








  function stotage_teambox_scroll($scope) {
    if (window.innerWidth <= 1200) return;

    const $trigger = $scope.find(".pxl-team-box1");

    // Hàm chờ tất cả ảnh trong box load xong
    function waitForImages($container, callback) {
      const $imgs = $container.find("img");
      let loaded = 0;
      const count = $imgs.length;

      if (count === 0) {
        callback();
        return;
      }

      $imgs.each(function () {
        if (this.complete) {
          loaded++;
          if (loaded === count) callback();
        } else {
          $(this).one("load error", function () {
            loaded++;
            if (loaded === count) callback();
          });
        }
      });
    }

    // Chờ ảnh trong .pxl-team-box1 load xong mới chạy animation
    waitForImages($trigger, function () {
      $scope.find(".pxl-team-box1 .pxl-list-item").each(function () {
        const $listItem = $(this);
        const $items = $listItem.find(".pxl-item--inner");

        $items.each(function (index) {
          const $el = $(this);
          const $box = $trigger;
          $el.css("transform", "translate(-50%, -50%)");

          if (index < 1 || index > 4) return;

          const boxOffset = $box.offset();
          const elOffset = $el.offset();

          const boxWidth = $box.outerWidth();
          const boxHeight = $box.outerHeight();
          const elWidth = $el.outerWidth();
          const elHeight = $el.outerHeight();

          const paddingX = 20;
          const paddingY = 20;

          let targetX = 0;
          let targetY = 0;

          switch (index) {
            case 1:
              targetX = boxOffset.left + paddingX - elOffset.left;
              targetY = boxOffset.top + paddingY - elOffset.top;
              break;
            case 2:
              targetX = (boxOffset.left + boxWidth - paddingX - elWidth) - elOffset.left;
              targetY = boxOffset.top + paddingY - elOffset.top;
              break;
            case 3:
              targetX = boxOffset.left + paddingX - elOffset.left;
              targetY = (boxOffset.top + boxHeight - paddingY - elHeight) - elOffset.top;
              break;
            case 4:
              targetX = (boxOffset.left + boxWidth - paddingX - elWidth) - elOffset.left;
              targetY = (boxOffset.top + boxHeight - paddingY - elHeight) - elOffset.top;
              break;
          }

          gsap.to($el[0], {
            x: targetX,
            y: targetY,
            ease: "power2.out",
            scrollTrigger: {
              trigger: $trigger[0],
              start: "top top",
              end: "+=1200",
              scrub: 1,
              pin: true,
              markers: false,
              onUpdate: (self) => {
                if (self.progress >= 1) {
                  $listItem.addClass("active");
                } else {
                  $listItem.removeClass("active");
                }
              }
            }
          });
        });
      });
    });
  }



  function stotage_section_start_render() {
    var _elementor = typeof elementor !== "undefined" ? elementor : elementorFrontend;

    if (!_elementor || !_elementor.hooks) {
      console.warn("Elementor hooks not available");
      return;
    }

    _elementor.hooks.addFilter(
      "pxl_element_container/before-render",
      function (html, settings, el) {
        function hex2rgba(color, opacity) {
          if (!color) return "rgb(0,0,0)";

          if (color[0] === "#") {
            color = color.substring(1);
          }

          var hex;
          if (color.length === 6) {
            hex = [color.substring(0, 2), color.substring(2, 4), color.substring(4, 6)];
          } else if (color.length === 3) {
            hex = [color[0] + color[0], color[1] + color[1], color[2] + color[2]];
          } else {
            return "rgb(0,0,0)";
          }

          var rgb = hex.map(function (h) {
            return parseInt(h, 16);
          });

          if (opacity !== undefined && opacity !== false) {
            if (Math.abs(opacity) > 1) opacity = 1.0;
            return "rgba(" + rgb.join(",") + "," + opacity + ")";
          } else {
            return "rgb(" + rgb.join(",") + ")";
          }
        }

        function getLineResponsiveClasses(settings, position) {
          var responsiveClasses = [];
          var positionKey = position.replace(/-/g, "_");

          if (settings["pxl_container_line_hide_laptop_" + positionKey]) {
            responsiveClasses.push("pxl-hide-laptop");
          }
          if (settings["pxl_container_line_hide_tablet_landscape_" + positionKey]) {
            responsiveClasses.push("pxl-hide-tablet-landscape");
          }
          if (settings["pxl_container_line_hide_tablet_portrait_" + positionKey]) {
            responsiveClasses.push("pxl-hide-tablet-portrait");
          }
          if (settings["pxl_container_line_hide_mobile_landscape_" + positionKey]) {
            responsiveClasses.push("pxl-hide-mobile-landscape");
          }
          if (settings["pxl_container_line_hide_mobile_portrait_" + positionKey]) {
            responsiveClasses.push("pxl-hide-mobile-portrait");
          }

          return responsiveClasses.length > 0 ? " " + responsiveClasses.join(" ") : "";
        }

        function getResponsiveLineStyles(settings, isVertical) {
          var laptopStyle = settings.pxl_container_line_s_laptop || "gr-df";
          var laptopStyleLr = settings.pxl_container_line_srl_laptop || "gr-df";
          var laptopColor = settings.pxl_container_line_c_laptop || "";

          var tabletLandscapeStyle =
            settings.pxl_container_line_s_tablet_landscape &&
              settings.pxl_container_line_s_tablet_landscape !== "inherit"
              ? settings.pxl_container_line_s_tablet_landscape
              : laptopStyle;
          var tabletLandscapeStyleLr =
            settings.pxl_container_line_srl_tablet_landscape &&
              settings.pxl_container_line_srl_tablet_landscape !== "inherit"
              ? settings.pxl_container_line_srl_tablet_landscape
              : laptopStyleLr;
          var tabletLandscapeColor = settings.pxl_container_line_c_tablet_landscape || laptopColor;

          var tabletPortraitStyle =
            settings.pxl_container_line_s_tablet_portrait &&
              settings.pxl_container_line_s_tablet_portrait !== "inherit"
              ? settings.pxl_container_line_s_tablet_portrait
              : tabletLandscapeStyle;
          var tabletPortraitStyleLr =
            settings.pxl_container_line_srl_tablet_portrait &&
              settings.pxl_container_line_srl_tablet_portrait !== "inherit"
              ? settings.pxl_container_line_srl_tablet_portrait
              : tabletLandscapeStyleLr;
          var tabletPortraitColor =
            settings.pxl_container_line_c_tablet_portrait || tabletLandscapeColor;

          var mobileLandscapeStyle =
            settings.pxl_container_line_s_mobile_landscape &&
              settings.pxl_container_line_s_mobile_landscape !== "inherit"
              ? settings.pxl_container_line_s_mobile_landscape
              : tabletPortraitStyle;
          var mobileLandscapeStyleLr =
            settings.pxl_container_line_srl_mobile_landscape &&
              settings.pxl_container_line_srl_mobile_landscape !== "inherit"
              ? settings.pxl_container_line_srl_mobile_landscape
              : tabletPortraitStyleLr;
          var mobileLandscapeColor =
            settings.pxl_container_line_c_mobile_landscape || tabletPortraitColor;

          var mobilePortraitStyle =
            settings.pxl_container_line_s_mobile_portrait &&
              settings.pxl_container_line_s_mobile_portrait !== "inherit"
              ? settings.pxl_container_line_s_mobile_portrait
              : mobileLandscapeStyle;
          var mobilePortraitStyleLr =
            settings.pxl_container_line_srl_mobile_portrait &&
              settings.pxl_container_line_srl_mobile_portrait !== "inherit"
              ? settings.pxl_container_line_srl_mobile_portrait
              : mobileLandscapeStyleLr;
          var mobilePortraitColor =
            settings.pxl_container_line_c_mobile_portrait || mobileLandscapeColor;

          return {
            laptop: {
              style: isVertical ? laptopStyle : laptopStyleLr,
              color: laptopColor
            },
            tablet_landscape: {
              style: isVertical ? tabletLandscapeStyle : tabletLandscapeStyleLr,
              color: tabletLandscapeColor
            },
            tablet_portrait: {
              style: isVertical ? tabletPortraitStyle : tabletPortraitStyleLr,
              color: tabletPortraitColor
            },
            mobile_landscape: {
              style: isVertical ? mobileLandscapeStyle : mobileLandscapeStyleLr,
              color: mobileLandscapeColor
            },
            mobile_portrait: {
              style: isVertical ? mobilePortraitStyle : mobilePortraitStyleLr,
              color: mobilePortraitColor
            }
          };
        }

        function generateLineCss(style, color, isVertical) {
          if (!color) return "";

          if (isVertical) {
            switch (style) {
              case "gr-btt":
                return (
                  "background: linear-gradient(180deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  hex2rgba(color, 0.88) +
                  " 50%, " +
                  color +
                  " 100%);"
                );
              case "gr-ttb":
                return (
                  "background: linear-gradient(180deg, " +
                  color +
                  " 0%, " +
                  hex2rgba(color, 0.88) +
                  " 50%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "gr-df":
                return (
                  "background: linear-gradient(180deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  color +
                  " 25%, " +
                  color +
                  " 50%, " +
                  color +
                  " 75%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "gr-df-bold":
                return (
                  "background: linear-gradient(180deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  hex2rgba(color, 0.8) +
                  " 25%, " +
                  color +
                  " 50%, " +
                  hex2rgba(color, 0.8) +
                  " 75%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "clr":
                return "background: " + color + ";";
              default:
                return "background: " + color + ";";
            }
          } else {
            switch (style) {
              case "gr-rtl":
                return (
                  "background: linear-gradient(90deg, " +
                  color +
                  " 0%, " +
                  hex2rgba(color, 0.88) +
                  " 50%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "gr-ltr":
                return (
                  "background: linear-gradient(90deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  hex2rgba(color, 0.88) +
                  " 50%, " +
                  color +
                  " 100%);"
                );
              case "gr-df":
                return (
                  "background: linear-gradient(90deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  hex2rgba(color, 0.13) +
                  " 25%, " +
                  hex2rgba(color, 0.16) +
                  " 50%, " +
                  hex2rgba(color, 0.13) +
                  " 75%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "gr-df-bold":
                return (
                  "background: linear-gradient(90deg, " +
                  hex2rgba(color, 0) +
                  " 0%, " +
                  hex2rgba(color, 0.8) +
                  " 25%, " +
                  hex2rgba(color, 1) +
                  " 50%, " +
                  hex2rgba(color, 0.8) +
                  " 75%, " +
                  hex2rgba(color, 0) +
                  " 100%);"
                );
              case "clr":
                return "background: " + color + ";";
              default:
                return "background: " + color + ";";
            }
          }
        }

        if (
          typeof settings.pxl_container_border_options !== "undefined" &&
          Array.isArray(settings.pxl_container_border_options) &&
          settings.pxl_container_border_options.length > 0
        ) {
          var sides = settings.pxl_container_border_options;
          var style = settings.pxl_container_border_style || "1";
          var styleClass = Array.isArray(style) ? style.join("-") : style;

          html +=
            '<div class="pxl-container-border pxl-container-border__style-' + styleClass + '">';
          sides.forEach(function (side) {
            html +=
              '<span class="pxl-container-border__item pxl-container-border__item-' +
              side +
              '"></span>';
          });
          html += "</div>";
        }

        if (
          typeof settings.pxl_container_line_o !== "undefined" &&
          Array.isArray(settings.pxl_container_line_o) &&
          settings.pxl_container_line_o.length > 0
        ) {
          var linePositions = settings.pxl_container_line_o;

          linePositions.forEach(function (item) {
            var responsiveClassString = getLineResponsiveClasses(settings, item);
            var isVertical = item === "left" || item === "right" || item.indexOf("vertical") !== -1;
            var responsiveStyles = getResponsiveLineStyles(settings, isVertical);

            var laptopCss = generateLineCss(
              responsiveStyles.laptop.style,
              responsiveStyles.laptop.color,
              isVertical
            );
            var tabletLandscapeCss = generateLineCss(
              responsiveStyles.tablet_landscape.style,
              responsiveStyles.tablet_landscape.color,
              isVertical
            );
            var tabletPortraitCss = generateLineCss(
              responsiveStyles.tablet_portrait.style,
              responsiveStyles.tablet_portrait.color,
              isVertical
            );
            var mobileLandscapeCss = generateLineCss(
              responsiveStyles.mobile_landscape.style,
              responsiveStyles.mobile_landscape.color,
              isVertical
            );
            var mobilePortraitCss = generateLineCss(
              responsiveStyles.mobile_portrait.style,
              responsiveStyles.mobile_portrait.color,
              isVertical
            );

            html +=
              '<span class="pxl-line pxl-line__' +
              item +
              responsiveClassString +
              '" ' +
              'data-laptop-style="' +
              laptopCss +
              '" ' +
              'data-tablet-landscape-style="' +
              tabletLandscapeCss +
              '" ' +
              'data-tablet-portrait-style="' +
              tabletPortraitCss +
              '" ' +
              'data-mobile-landscape-style="' +
              mobileLandscapeCss +
              '" ' +
              'data-mobile-portrait-style="' +
              mobilePortraitCss +
              '" ' +
              'style="' +
              laptopCss +
              '"></span>';
          });
        }

        if (
          typeof settings.pxl_container_overlay_sides !== "undefined" &&
          Array.isArray(settings.pxl_container_overlay_sides) &&
          settings.pxl_container_overlay_sides.length > 0
        ) {
          var sides = settings.pxl_container_overlay_sides;
          var type = settings.pxl_container_overlay_type || "default";

          sides.forEach(function (side) {
            html +=
              '<span class="pxl-container-overlay__item pxl-container-overlay__item-' +
              side +
              " pxl-container-overlay__item-" +
              type +
              '"></span>';
          });
        }

        if (
          typeof settings.pxl_dot_container_pos !== "undefined" &&
          Array.isArray(settings.pxl_dot_container_pos) &&
          settings.pxl_dot_container_pos.length > 0
        ) {
          var items = settings.pxl_dot_container_pos;
          var type = settings.pxl_dot_container_type || "default";

          items.forEach(function (item) {
            html += '<span class="pxl-dot pxl-dot__' + item + ' pxl-dot__' + type + '"></span>';
          });
        }

        if (
          typeof settings.pxl_container_link !== "undefined" &&
          settings.pxl_container_link &&
          settings.pxl_container_link.url
        ) {
          var linkAttributes = [];

          if (settings.pxl_container_link.url) {
            linkAttributes.push('href="' + settings.pxl_container_link.url + '"');
          }

          if (settings.pxl_container_link.is_external) {
            linkAttributes.push('target="_blank"');
          }

          if (settings.pxl_container_link.nofollow) {
            linkAttributes.push('rel="nofollow"');
          }

          var attributesString = linkAttributes.join(" ");
          html += "<a " + attributesString + ' class="pxl-container pxl-container__link"></a>';
        }
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
    _elementor.hooks.addAction("frontend/element_ready/container", function ($scope) {
      var $container = $scope;

      function applyResponsiveLineStyles() {
        const lines = document.querySelectorAll(".pxl-line[data-laptop-style]");
        const windowWidth = window.innerWidth;

        lines.forEach((line) => {
          let targetStyle = "";

          if (windowWidth <= 575) {
            targetStyle =
              line.getAttribute("data-mobile-portrait-style") ||
              line.getAttribute("data-mobile-landscape-style") ||
              line.getAttribute("data-tablet-portrait-style") ||
              line.getAttribute("data-tablet-landscape-style") ||
              line.getAttribute("data-laptop-style");
          } else if (windowWidth <= 767) {
            targetStyle =
              line.getAttribute("data-mobile-landscape-style") ||
              line.getAttribute("data-tablet-portrait-style") ||
              line.getAttribute("data-tablet-landscape-style") ||
              line.getAttribute("data-laptop-style");
          } else if (windowWidth <= 1024) {
            targetStyle =
              line.getAttribute("data-tablet-portrait-style") ||
              line.getAttribute("data-tablet-landscape-style") ||
              line.getAttribute("data-laptop-style");
          } else if (windowWidth <= 1366) {
            targetStyle =
              line.getAttribute("data-tablet-landscape-style") ||
              line.getAttribute("data-laptop-style");
          } else {
            targetStyle = line.getAttribute("data-laptop-style");
          }

          if (targetStyle) {
            const currentStyles = line.style.cssText.replace(/background[^;]*;?/g, "").trim();
            line.style.cssText = targetStyle + (currentStyles ? "; " + currentStyles : "");
          }
        });
      }

      applyResponsiveLineStyles();

      var resizeTimeout;
      $(window).on("resize", function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
          applyResponsiveLineStyles();
        }, 100);
      });

      if ($container.hasClass("pxl-sticky-container") && $container.data("pxl-sticky")) {
        var stickyOffset = parseInt($container.data("sticky-offset"));
        var stickyMode = $container.data("sticky-mode");
        var triggerPosition = parseInt($container.data("trigger-position"));
        var hideOnFooter = parseInt($container.data("ft-hide"));

        var originalCss = {
          position: $container.css("position"),
          top: stickyMode === "top" ? $container.css("top") : "unset",
          bottom: stickyMode === "bottom" ? $container.css("bottom") : "unset",
          left: $container.css("left"),
          width: $container.css("width"),
          zIndex: $container.css("z-index")
        };

        var ticking = false;
        var $footer = $(".pxl-footer-show");
        var footerTop = $footer.length ? $footer.offset().top : 0;

        function handleScroll() {
          var scrollTop = $(window).scrollTop();
          var windowHeight = $(window).height();

          if (scrollTop >= triggerPosition) {
            if (footerTop && scrollTop + windowHeight >= footerTop - hideOnFooter) {
              if ($container.hasClass("pxl-sticky-active")) {
                var resetCss = { ...originalCss };
                if (stickyMode === "top") {
                  delete resetCss.bottom;
                } else {
                  delete resetCss.top;
                }
                $container.removeClass("pxl-sticky-active").css(resetCss);
              }
            } else {
              if (!$container.hasClass("pxl-sticky-active")) {
                var containerWidth = $container.outerWidth();
                var containerLeft = $container.offset().left;

                var cssProps = {
                  position: "fixed",
                  left: containerLeft + "px",
                  width: containerWidth + "px",
                  zIndex: 1000
                };

                if (stickyMode === "top") {
                  cssProps.top = stickyOffset + "px";
                  cssProps.bottom = "unset";
                } else {
                  cssProps.bottom = stickyOffset + "px";
                  cssProps.top = "unset";
                }

                $container.addClass("pxl-sticky-active").css(cssProps);
              }
            }
          } else {
            if ($container.hasClass("pxl-sticky-active")) {
              $container.removeClass("pxl-sticky-active").css(originalCss);
            }
          }
        }

        $(window).on("scroll", function () {
          if (!ticking) {
            window.requestAnimationFrame(function () {
              handleScroll();
              ticking = false;
            });
            ticking = true;
          }
        });

        $(window).on("resize", function () {
          if ($container.hasClass("pxl-sticky-active")) {
            var newWidth = $container.parent().width();
            var newLeft = $container.parent().offset().left;
            $container.css({
              width: newWidth + "px",
              left: newLeft + "px"
            });
          }
          if ($footer.length) {
            footerTop = $footer.offset().top;
          }
        });
      }
    });
  }




  function stotage_show_hide_elementor($scope) {
    if (window.innerWidth <= 1025) {
      return;
    }
    $scope.find(".show-container").each(function () {
      var $container = $(this);

      gsap.fromTo(
        $container[0], {
        opacity: 0,
      },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: $container[0],
            toggleActions: "play pause reverse pause",
            start: "top 40%",
            end: "top 40%",
            scrub: 1,
          }
        }
      );
    });
  }

  function stotage_zoom_point() {
    elementorFrontend.waypoint($(document).find('.pxl-zoom-point'), function () {
      var offset = $(this).offset();
      var offset_top = offset.top;
      var scroll_top = $(window).scrollTop();
    }, {
      offset: -100,
      triggerOnce: true
    });
  }


  function stotage_logo_marquee($scope) {
    const logos = $scope.find('.pxl-item--marquee');
    gsap.set(logos, { autoAlpha: 1 })

    logos.each(function (index, el) {
      gsap.set(el, { xPercent: 100 * index });
    });

    if (logos.length > 2) {
      const logosWrap = gsap.utils.wrap(-100, ((logos.length - 1) * 100));
      const durationNumber = logos.data('duration');
      const slipType = logos.data('slip-type');
      var slipResult = `-=${logos.length * 100}`;
      if (slipType == 'right') {
        slipResult = `+=${logos.length * 100}`;
      }
      gsap.to(logos, {
        xPercent: slipResult,
        duration: durationNumber,
        repeat: -1,
        ease: 'none',
        modifiers: {
          xPercent: xPercent => logosWrap(parseFloat(xPercent))
        }
      });
    }
  }

  function stotage_animation_btn($scope) {
    const $sections = $scope.find(
      '.pxl-video-player .pxl-video--inner, .pxl-portfolio-grid-layout2 .pxl-post--inner'
    );

    $sections.each(function () {
      const $section = $(this);
      const cursor = $section.find('.btn-video-wrap, .pxl-content')[0];
      if (!cursor) return;

      const cursorWidth = cursor.offsetWidth / 2;
      const cursorHeight = cursor.offsetHeight / 2;

      let mouseX = 0;
      let mouseY = 0;
      let isMouseOver = false;

      $section.on('mousemove', function (e) {
        isMouseOver = true;
        mouseX = e.pageX;
        mouseY = e.pageY;
      });

      $section.on('mouseenter', function () {
        isMouseOver = true;
      });

      $section.on('mouseleave', function () {
        isMouseOver = false;
        const sectionCenterX = $section.width() / 2 - cursorWidth;
        const sectionCenterY = $section.height() / 2 - cursorHeight;

        gsap.to(cursor, {
          x: sectionCenterX,
          y: sectionCenterY,
          ease: 'power1.inOut',
          duration: 0.5
        });
      });

      function render() {
        if (isMouseOver) {
          const sectionOffset = $section.offset();

          if (
            mouseX >= sectionOffset.left &&
            mouseX <= sectionOffset.left + $section.width() &&
            mouseY >= sectionOffset.top &&
            mouseY <= sectionOffset.top + $section.height()
          ) {
            gsap.to(cursor, {
              x: mouseX - sectionOffset.left - cursorWidth,
              y: mouseY - sectionOffset.top - cursorHeight,
              ease: 'none',
              duration: 0.1
            });
          }
        }
        requestAnimationFrame(render);
      }

      // Đặt cursor ở giữa lúc khởi tạo
      const sectionCenterX = $section.width() / 2 - cursorWidth;
      const sectionCenterY = $section.height() / 2 - cursorHeight;
      gsap.set(cursor, {
        x: sectionCenterX,
        y: sectionCenterY
      });

      requestAnimationFrame(render);
    });
  }


  function stotage_img_covermouse($scope) {
    const section = $scope.find('.pxl-image-cover--mouse')[0];
    if (!section) return;

    const images = [...section.querySelectorAll('img')];
    if (images.length === 0) return;

    const MathUtils = {
      lerp: (a, b, n) => (1 - n) * a + n * b,
      distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
    };

    let mousePos = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    let cacheMousePos = { x: 0, y: 0 };
    let imgIndex = 0;
    let zIndexVal = 1;
    const threshold = 100;

    section.addEventListener('mousemove', (ev) => {
      const rect = section.getBoundingClientRect();
      mousePos = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
    });

    function getMouseRotation(current, last) {
      const dx = current.x - last.x;
      const dy = current.y - last.y;
      return {
        horizontal: Math.min(Math.max(-dx / 10, -10), 10),
        vertical: Math.min(Math.max(-dy / 10, -5), 5)
      };
    }

    function showNextImage() {
      const img = images[imgIndex];
      const rect = img.getBoundingClientRect();
      gsap.killTweensOf(img);

      const rot = getMouseRotation(mousePos, lastMousePos);
      const rotation = rot.horizontal + rot.vertical;

      gsap.timeline()
        .set(img, {
          opacity: 0,
          scale: 0.6,
          zIndex: zIndexVal,
          x: cacheMousePos.x - rect.width / 2,
          y: cacheMousePos.y - rect.height / 2,
          rotation
        })
        // Fade-in nhanh
        .to(img, {
          duration: 0.25,
          opacity: 1,
          scale: 1,
          ease: "power2.out"
        }, 0)
        // Giữ ảnh lâu hơn (delay ẩn)
        .to(img, {
          duration: 0.4,
          ease: "power1.inOut",
          opacity: 0,
          scale: 0.2
        }, 0.8); // tăng từ 0.2 lên 0.8 để ảnh hiển thị thêm ~0.6s
    }

    function render() {
      const distance = MathUtils.distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

      cacheMousePos.x = MathUtils.lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
      cacheMousePos.y = MathUtils.lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

      if (distance > threshold) {
        showNextImage();
        zIndexVal++;
        imgIndex = (imgIndex + 1) % images.length;
        lastMousePos = { ...mousePos };
      }

      requestAnimationFrame(render);
    }

    images.forEach(img => {
      gsap.set(img, { opacity: 0, scale: 0.6 });
    });

    render();
  }



  function stotageCheckBox($scope) {
    var $checks = $scope.find('.check-list .check');
    var $images = $scope.find('.image img');
    var $imageContainer = $scope.find('.image');
    if ($checks.length === 0 || $images.length === 0) return;
    function updateActive(index) {
      $checks.removeClass('active').find('input[type="checkbox"]').prop('checked', false);
      var $current = $checks.eq(index);
      $current.addClass('active').find('input[type="checkbox"]').prop('checked', true);
      var imageUrl = $images.eq(index).attr('src');
      $imageContainer.css('background-image', 'url("' + imageUrl + '")');
    }
    updateActive(0);
    $checks.each(function (index) {
      $(this).find('input[type="checkbox"]').on('change', function () {
        if ($(this).is(':checked')) {
          updateActive(index);
        } else {
          $(this).prop('checked', true);
        }
      });
    });
  }

  function stotage_scroll_fixed_section() {
    const fixed_section_top = $('.pxl-section-fix-top');
    if (fixed_section_top.length > 0) {
      ScrollTrigger.matchMedia({
        "(min-width: 991px)": function () {
          const pinnedSections = ['.pxl-section-fix-top'];
          pinnedSections.forEach(className => {
            gsap.to(".pxl-section-fix-bottom", {
              scrollTrigger: {
                trigger: ".pxl-section-fix-bottom",
                scrub: true,
                pin: className,
                pinSpacing: false,
                start: 'top bottom',
                end: "bottom top",
              },
            });
            gsap.to(".pxl-section-fix-bottom .pxl-section-overlay-color", {
              scrollTrigger: {
                trigger: ".pxl-section-fix-bottom",
                scrub: true,
                pin: className,
                pinSpacing: false,
                start: 'top bottom',
                end: "bottom top",
              },
            });
          });
        }
      });
    }

    const section_overlay_color = $('.pxl-section-overlay-color');
    if (section_overlay_color.length > 0) {
      const space_top = section_overlay_color.data('space-top');
      const space_left = section_overlay_color.data('space-left');
      const space_right = section_overlay_color.data('space-right');
      const space_bottom = section_overlay_color.data('space-bottom');

      const radius_top = section_overlay_color.data('radius-top');
      const radius_left = section_overlay_color.data('radius-left');
      const radius_right = section_overlay_color.data('radius-right');
      const radius_bottom = section_overlay_color.data('radius-bottom');

      const overlay_radius = radius_top + 'px ' + radius_right + 'px ' + radius_bottom + 'px ' + radius_left + 'px ';

      ScrollTrigger.matchMedia({
        "(min-width: 991px)": function () {
          const pinnedSections = ['.pxl-bg-color-scroll'];
          pinnedSections.forEach(className => {
            gsap.to(".overlay-type-scroll", {
              scrollTrigger: {
                trigger: ".pxl-bg-color-scroll",
                scrub: true,
                pinSpacing: false,
                start: 'top bottom',
                end: "bottom top",
              },
              left: space_left + "px",
              right: space_right + "px",
              top: space_top + "px",
              bottom: space_bottom + "px",
              borderRadius: overlay_radius,
            });
          });
        }
      });
    }
  }
  function stotage_scroll_checkp($scope) {
    $scope.find('.pxl-el-divider').each(function () {
      var wcont1 = $(this);


      function checkScrollPosition() {
        var pxl_scroll_top = $(window).scrollTop(),
          viewportBottom = pxl_scroll_top + $(window).height(),
          elementTop = wcont1.offset().top,
          elementBottom = elementTop + wcont1.outerHeight();

        if (elementTop < viewportBottom && elementBottom > pxl_scroll_top) {
          wcont1.addClass('visible');
        }
      }

      checkScrollPosition();

      $(window).on('scroll', function () {
        checkScrollPosition();
      });

    });
  }

  function stotage_scroll_icon($scope) {
    let resizeTimeout;
    let observers = [];
    let isDesktopLast = null;

    function resetToInitial() {
      ScrollTrigger.getAll().forEach(st => st.kill());
      observers.forEach(ro => ro.disconnect());
      observers = [];

      $scope.find('.pxl-icon-list.style-4, .pxl-icon-list.style-6').each(function () {
        const $container = $(this);
        const $svg = $container.find('svg');
        if ($svg.length) {
          const svgEl = $svg[0];
          const originalHeight = svgEl.getBBox().height;
          gsap.set(svgEl, { height: originalHeight + 'px' });
        }

        if ($container.hasClass('style-6')) {
          gsap.set($container, { marginTop: '0px' });
        } else {
          gsap.set($container, { marginBottom: '0px' });
        }
      });
    }

    function init() {
      const isDesktop = window.innerWidth > 1200;

      if (!isDesktop) {
        resetToInitial();
        isDesktopLast = false;
        return;
      }

      const iconLists = $scope.find('.pxl-icon-list.style-4, .pxl-icon-list.style-6');
      if (!iconLists.length) return;

      window.history.scrollRestoration = 'manual';

      iconLists.each(function () {
        const $container = $(this);
        const $svg = $container.find('svg');
        if (!$svg.length) return;

        const svgEl = $svg[0];
        const containerEl = $container[0];
        const isStyle6 = $container.hasClass('style-6');

        const ro = new ResizeObserver(() => {
          const originalHeight = svgEl.getBBox().height;
          if (!originalHeight) return;

          const targetHeight = originalHeight * 0.18;
          const marginMax = isStyle6 ? -74 : -44;
          ro.disconnect();

          gsap.set(svgEl, { height: originalHeight + 'px' });
          gsap.set(containerEl, isStyle6 ? { marginTop: '0px' } : { marginBottom: '0px' });

          ScrollTrigger.create({
            trigger: containerEl,
            start: isStyle6 ? 'top 10%' : 'top top',
            end: isStyle6 ? 'top top' : 'top -20%',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: self => {
              const progress = self.progress;
              const currentHeight = originalHeight - (originalHeight - targetHeight) * progress;
              gsap.set(svgEl, { height: currentHeight + 'px' });
            }
          });

          ScrollTrigger.create({
            trigger: containerEl,
            start: isStyle6 ? 'top 10%' : 'top top',
            end: isStyle6 ? 'top -10%' : 'top -50%',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: self => {
              const progress = self.progress;
              const currentMargin = marginMax * progress;
              if (isStyle6) {
                gsap.set(containerEl, { marginTop: `${currentMargin}px` });
              } else {
                gsap.set(containerEl, { marginBottom: `${currentMargin}px` });
              }
            }
          });

          containerEl.offsetHeight;
          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 50);
        });

        ro.observe(svgEl);
        observers.push(ro);
      });

      if (isDesktopLast !== true) {
        window.scrollTo(0, 0);
      }

      isDesktopLast = true;
    }

    init();

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isDesktop = window.innerWidth > 1200;
        document.body.offsetHeight;

        if (isDesktop) {
          ScrollTrigger.refresh();

          if (isDesktopLast !== true) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }

          ScrollTrigger.getAll().forEach(st => {
            if (st.progress !== 0) {
              st.scroll(0);
            }
          });
        } else {
          resetToInitial();
        }
        init();
      }, 200);
    });
  }







  function stotage_price($scope) {
    const $container = ($scope && $scope.find) ? $scope.find(".pxl-pricing1") : $(".pxl-pricing1");
    if ($container.length === 0) return;
    const firstPlanHTML = $container.find(".plan").first().html();
    $container.find(".plan-active").html(firstPlanHTML);
    $container.find(".pxl-item--price").removeClass("active")
      .eq(0).addClass("active");
    $container.find(".plan").on("click", function () {
      const selectedHTML = $(this).html();
      const index = $(this).index();
      $container.find(".plan-active").html(selectedHTML);
      $container.find(".list-plan").removeClass('active');
      $container.find(".pxl-item--price").removeClass("active")
        .eq(index).addClass("active");
      $container.find(".plan").removeClass("active");
      $(this).addClass("active");
    });
    $container.find(".extra-text").on("click", function () {
      $(this).toggleClass('active');
      const $normal = $container.find(".price-month").not(".extra");
      const $extra = $container.find(".price-month.extra");
      if ($extra.hasClass("active")) {
        $extra.removeClass("active");
        $normal.addClass("active");
      } else {
        $normal.removeClass("active");
        $extra.addClass("active");
      }
    });
    $container.find(".icon-arrow").on("click", function () {
      $(this).toggleClass('active');
      $container.find(".list-plan").toggleClass('active');
    });
  }


  function stotage_load_more_fancybox($scope) {
    setTimeout(initializeGrid, 200);
    function initializeGrid() {
      var $gridBox = $('.pxl-box-grid2 , .pxl-box-grid3, .pxl-box-grid4');
      var $gridInner = $gridBox.find('.pxl-grid-inner');
      var tab_settings = $gridBox.data('settings');

      if (!tab_settings) return;

      var limit = tab_settings.limit;
      var $items = $gridInner.find('.pxl-grid-item');

      $items.each(function (index) {
        if (index >= limit) {
          $(this).hide();
        }
      });

      updateInnerHeight($gridInner);
      $('#loadMoreButton').off('click').on('click', function () {
        var $hiddenItems = $gridInner.find('.pxl-grid-item:hidden').slice(0, limit);
        $hiddenItems.fadeIn(300, function () {
          updateInnerHeight($gridInner);
        });
        if ($gridInner.find('.pxl-grid-item:hidden').length <= limit) {
          $('#loadMoreButton').parent().css("display", "none");
        }
      });
    }
    function updateInnerHeight($container) {
      var maxBottom = 0;
      $container.find('.pxl-grid-item:visible').each(function () {
        var $el = $(this);
        var offsetTop = $el.position().top;
        var totalHeight = offsetTop + $el.outerHeight(true);
        if (totalHeight > maxBottom) {
          maxBottom = totalHeight;
        }
      });

      $container.css('height', maxBottom);
    }
  }
  function stotage_showcase_snap_slider($scope = $(document)) {
    const $snapSliderHolder = $scope.find('.snap-slider-holder');
    if (!$snapSliderHolder.length) return;

    const $snapSlides = $scope.find('.pxl-item');
    const $snapSlidesImgMask = $scope.find('.pxl-item .img-mask');



    // Fade in/out .img-mask
    gsap.fromTo($snapSlidesImgMask, { opacity: 0.1 }, {
      opacity: 1,
      duration: 1,
      ease: "sine.out",
      scrollTrigger: {
        trigger: $snapSliderHolder[0],
        start: 'top 100%',
        end: '+=100%',
        scrub: true,
      }
    });

    gsap.fromTo($snapSlidesImgMask, { opacity: 1 }, {
      opacity: 0.1,
      duration: 1,
      ease: "sine.out",
      scrollTrigger: {
        trigger: $snapSliderHolder[0],
        start: 'bottom 100%',
        end: '+=100%',
        scrub: true,
      }
    });


    // Mask and thumb effects
    $snapSlides.each(function (i) {
      const isLast = i === $snapSlides.length - 1;
      const isFirst = i === 0;
      const $slide = $(this);
      const $mask = $slide.find('.img-mask');


      gsap.fromTo($mask, { y: isFirst ? 0 : -window.innerHeight }, {
        y: isLast ? 0 : window.innerHeight,
        scrollTrigger: {
          trigger: this,
          scrub: true,
          start: isFirst ? "top top" : "top bottom",
          end: isLast ? "top top" : undefined,
        },
        ease: "none",
      });
    });

  }
  //
  function initCarousel4($scope) {
    const $slides = $scope.find('.pxl-image-carousel4 .pxl-card-slide');

    if ($slides.length === 0) return;

    // add active cho thẻ đầu tiên
    $slides.removeClass('active').first().addClass('active');

    // khi click vào slide thì next sang slide tiếp theo
    $slides.on('click', function () {
      let $current = $slides.filter('.active');
      let index = $slides.index($current);

      // tính index tiếp theo, nếu hết thì quay về 0
      let nextIndex = (index + 1) % $slides.length;

      $slides.removeClass('active');
      $slides.eq(nextIndex).addClass('active');
    });
  }

  // 
  function setCarouselMinHeight($scope) {
    const $carousel = $scope.find('.pxl-image-carousel2,.pxl-image-carousel4');
    const $imgs = $carousel.find('.pxl-card-slide img');

    if ($imgs.length === 0) return;

    let maxHeight = 0;

    $imgs.each(function () {
      const h = $(this).height();
      if (h > maxHeight) {
        maxHeight = h;
      }
    });

    if (maxHeight > 0) {
      $carousel.css('min-height', maxHeight + 'px');
    }
  }

  function stotage_image_slide_card_2($scope) {
    const $cards = $scope.find('.pxl-image-carousel2 .pxl-card-slide');
    let current = 0;

    function addScrollEffect() {
      $cards.each(function (index) {
        const $card = $(this);
        const delay = index * 0.1;

        gsap.set($card, {
          opacity: 0,
          y: 30,
          scale: 0.95
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $card,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        });

        tl.to($card, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
          delay: delay
        });
      });
    }

    if (typeof ScrollTrigger !== 'undefined') {
      addScrollEffect();
    } else {
      $cards.each(function (index) {
        const $card = $(this);
        gsap.fromTo($card,
          {
            opacity: 0,
            y: 20,
            scale: 0.95
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            delay: index * 0.1,
            ease: "power2.out"
          }
        );
      });
    }

    function update() {
      $cards.each(function (i) {
        const $c = $(this);
        gsap.killTweensOf($c);
        const pos = (i - current + $cards.length) % $cards.length;

        if (pos === 0) {
          gsap.set($c, {
            rotation: 0,
            xPercent: -50,
            yPercent: -50,
            x: 0,
            zIndex: 5,   // luôn ở top khi bắt đầu
            opacity: 1,
            force3D: true,
            transformOrigin: "center center"
          });

          const tl = gsap.timeline({ smoothChildTiming: true });
          tl.to($c, {
            rotation: 5,
            x: 300,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            force3D: true
          })
            // Đổi z-index ở nửa animation
            .add(() => gsap.set($c, { zIndex: 1 }), ">-0.3")
            .to($c, {
              rotation: -5,
              x: 0,
              opacity: 0.5,
              duration: 0.4,
              ease: "power2.inOut",
              force3D: true
            });
        }

        else if (pos === 1) {
          gsap.set($c, {
            rotation: 0,
            xPercent: -50,
            yPercent: -50,
            x: 0,
            zIndex: 3,
            opacity: 1,
            force3D: true,
            transformOrigin: "center center"
          });
          const tl = gsap.timeline({ smoothChildTiming: true });
          tl.to($c, {
            rotation: 0,
            x: -300,
            duration: 0.4,
            ease: "power2.out",
            force3D: true
          })
            .to($c, {
              rotation: 0,
              x: 0,
              duration: 0.4,
              ease: "power2.out",
              force3D: true
            });
        }

        else if (pos === $cards.length - 1) {
          gsap.set($c, {
            rotation: 0,
            xPercent: -50,
            yPercent: -50,
            x: 0,
            zIndex: 1,
            opacity: 1,
            force3D: true,
            transformOrigin: "center center"
          });
          const tl = gsap.timeline({ smoothChildTiming: true });
          tl.to($c, {
            rotation: -5,
            x: -300,
            duration: 0.4,
            ease: "power2.out",
            force3D: true
          })
            .to($c, {
              rotation: 0,
              x: 0,
              duration: 0.4,
              ease: "power2.out",
              force3D: true
            });
        }

        else {
          gsap.set($c, {
            zIndex: 0,
            force3D: true,
            transformOrigin: "center center"
          });
          gsap.to($c, {
            xPercent: -50,
            yPercent: -50,
            rotation: -5,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
            force3D: true
          });
        }
      });
    }


    update();

    $scope.find('.nav.right').on('click', function () {
      current = (current + 1) % $cards.length;
      update();
    });

    $scope.find('.nav.left').on('click', function () {
      current = (current - 1 + $cards.length) % $cards.length;
      update();
    });
  }

  class WebGLContextManager {
    constructor() {
      this.activeContexts = new Map();
      this.maxContexts = 4;
    }

    createContext(canvas, contextType = "2d") {
      const id = canvas.dataset.canvasId || this.generateId();
      canvas.dataset.canvasId = id;

      this.cleanup(id);

      if (this.activeContexts.size >= this.maxContexts) {
        this.cleanupOldest();
      }

      const context = canvas.getContext(contextType, {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      });

      if (context) {
        this.activeContexts.set(id, {
          canvas,
          context,
          type: contextType,
          created: Date.now()
        });
      }

      return context;
    }

    cleanup(id) {
      const contextData = this.activeContexts.get(id);
      if (contextData) {
        const { canvas, context, type } = contextData;

        if (type === "webgl" || type === "webgl2") {
          const ext = context.getExtension("WEBGL_lose_context");
          if (ext) {
            ext.loseContext();
          }
        }

        canvas.width = 1;
        canvas.height = 1;

        this.activeContexts.delete(id);
      }
    }

    cleanupOldest() {
      if (this.activeContexts.size === 0) return;

      let oldestId = null;
      let oldestTime = Date.now();

      for (const [id, data] of this.activeContexts) {
        if (data.created < oldestTime) {
          oldestTime = data.created;
          oldestId = id;
        }
      }

      if (oldestId) {
        this.cleanup(oldestId);
      }
    }

    cleanupAll() {
      for (const id of this.activeContexts.keys()) {
        this.cleanup(id);
      }
    }

    generateId() {
      return "canvas_" + Math.random().toString(36).substr(2, 9);
    }
  }
  const contextManager = new WebGLContextManager();


  function initBlobEffect() {
    contextManager.cleanupAll();

    const isLowPerformanceDevice = () => {
      return (
        window.innerWidth < 768 ||
        navigator.hardwareConcurrency < 4 ||
        !window.requestAnimationFrame
      );
    };

    if (isLowPerformanceDevice()) {
      return;
    }

    const activeAnimations = new Set();
    let globalAnimationId = null;

    function createSingleEffect($canvas) {
      const canvas = $canvas[0];
      const canvasId = contextManager.generateId();
      canvas.dataset.canvasId = canvasId;
      const ctx = contextManager.createContext(canvas, "2d");
      if (!ctx) {
        return null;
      }

      let width = 0,
        height = 0;
      let dots = [];
      let mouseX = -9999,
        mouseY = -9999;
      let isVisible = true;

      const dotCount = parseInt($canvas.data("star")) || 60;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const wasVisible = isVisible;
            isVisible = entry.isIntersecting;
            if (isVisible && !wasVisible) {
              activeAnimations.add(canvasId);
              if (!globalAnimationId) {
                globalAnimationId = requestAnimationFrame(globalAnimationLoop);
              }
            } else if (!isVisible && wasVisible) {
              activeAnimations.delete(canvasId);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "50px"
        }
      );

      observer.observe(canvas);

      let resizeTimeout;
      function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (canvas.parentNode) {
            gsap.set(canvas, { autoAlpha: 0 });
            waitForStableRect(canvas, () => {
              resizeCanvas();
              createInitialDots(dotCount);
              updateDots();
              requestAnimationFrame(() => {
                gsap.to(canvas, {
                  autoAlpha: 1,
                  duration: 2,
                  ease: "power2.out"
                });
              });
            });
          }
        }, 250);
      }

      function waitForStableRect(canvas, callback) {
        let tries = 0;
        const maxTries = 10;
        let lastRect = canvas.getBoundingClientRect();

        function check() {
          const newRect = canvas.getBoundingClientRect();
          const same =
            Math.abs(newRect.width - lastRect.width) < 1 &&
            Math.abs(newRect.height - lastRect.height) < 1;

          if (same || tries >= maxTries) {
            callback();
          } else {
            lastRect = newRect;
            tries++;
            requestAnimationFrame(check);
          }
        }

        requestAnimationFrame(check);
      }

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        let safeWidth = Math.min(rect.width, 1920);
        let safeHeight = Math.min(rect.height, 1080);

        if (safeWidth < 10 || safeHeight < 10) {
          safeWidth = 300;
          safeHeight = 150;
        }

        canvas.width = safeWidth * dpr;
        canvas.height = safeHeight * dpr;
        canvas.style.width = safeWidth + "px";
        canvas.style.height = safeHeight + "px";

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        width = safeWidth;
        height = safeHeight;
      }

      function createDot(x, y) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.05 + Math.random() * 0.1;

        return {
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 0.5 + Math.random() * 1,
          phase: Math.random() * Math.PI * 2,
          baseOpacity: 0.3 + Math.random() * 0.4,
          opacitySpeed: 0.5 + Math.random() * 0.8
        };
      }

      function createInitialDots(count) {
        dots = [];
        for (let i = 0; i < count; i++) {
          dots.push(createDot(Math.random() * width, Math.random() * height));
        }
      }

      function updateDots() {
        if (!isVisible || !ctx || width === 0 || height === 0) return;

        ctx.clearRect(0, 0, width, height);

        const t = performance.now() * 0.001;
        const color = $canvas.data("color") || "#ffffff";

        const hex2rgba = (hex, alpha) => {
          if (!hex) return `rgba(255,255,255,${alpha})`;
          if (hex[0] === "#") hex = hex.substring(1);

          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          return `rgba(${r},${g},${b},${alpha})`;
        };

        dots = dots.filter(
          (dot) => dot.x >= -10 && dot.x <= width + 10 && dot.y >= -10 && dot.y <= height + 10
        );

        while (dots.length < dotCount) {
          dots.push(createDot(Math.random() * width, Math.random() * height));
        }

        dots.forEach((dot) => {
          const pulse = Math.sin(t * dot.opacitySpeed + dot.phase);
          const currentOpacity = Math.max(0, Math.min(1, dot.baseOpacity + pulse * 0.2));

          dot.x += dot.vx;
          dot.y += dot.vy;

          const dx = mouseX - dot.x;
          const dy = mouseY - dot.y;
          const distSq = dx * dx + dy * dy;
          const maxInfluenceSq = 100 * 100;

          if (distSq < maxInfluenceSq && distSq > 1) {
            const influence = (1 - distSq / maxInfluenceSq) * 0.008;
            dot.vx += dx * influence;
            dot.vy += dy * influence;
            dot.vx *= 0.99;
            dot.vy *= 0.99;
          }

          if (dot.x < -5) dot.x = width + 5;
          if (dot.x > width + 5) dot.x = -5;
          if (dot.y < -5) dot.y = height + 5;
          if (dot.y > height + 5) dot.y = -5;

          const edgeMargin = 80;
          const distToLeft = Math.max(0, edgeMargin - dot.x);
          const distToRight = Math.max(0, dot.x - (width - edgeMargin));
          const distToTop = Math.max(0, edgeMargin - dot.y);
          const distToBottom = Math.max(0, dot.y - (height - edgeMargin));

          const maxEdgeDist = Math.max(distToLeft, distToRight, distToTop, distToBottom);
          const edgeFade =
            maxEdgeDist > 0 ? Math.max(0, Math.pow(1 - maxEdgeDist / edgeMargin, 2)) : 1;

          const finalOpacity = currentOpacity * edgeFade;

          ctx.fillStyle = hex2rgba(color, finalOpacity);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fill();

          if (finalOpacity > 0.3) {
            const glowOpacity = finalOpacity * 0.2;
            ctx.fillStyle = hex2rgba(color, glowOpacity);
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      canvas.addEventListener(
        "mouseleave",
        () => {
          mouseX = -9999;
          mouseY = -9999;
        },
        { passive: true }
      );

      window.addEventListener("resize", handleResize, { passive: true });

      waitForStableRect(canvas, () => {
        gsap.set(canvas, { autoAlpha: 0 });
        waitForStableRect(canvas, () => {
          resizeCanvas();
          createInitialDots(dotCount);
          updateDots();
          requestAnimationFrame(() => {
            gsap.to(canvas, {
              autoAlpha: 1,
              duration: 2,
              ease: "power2.out"
            });
          });
        });
        requestAnimationFrame(() => { });
      });

      activeAnimations.add(canvasId);

      function cleanup() {
        observer.disconnect();
        activeAnimations.delete(canvasId);
        contextManager.cleanup(canvasId);

        window.removeEventListener("resize", handleResize);

        clearTimeout(resizeTimeout);
      }

      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === canvas || (node.contains && node.contains(canvas))) {
              cleanup();
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      return {
        update: updateDots,
        cleanup: cleanup,
        id: canvasId
      };
    }

    function globalAnimationLoop() {
      if (activeAnimations.size === 0) {
        globalAnimationId = null;
        return;
      }

      $(".pxl-star").each(function () {
        const canvasId = this.dataset.canvasId;
        if (activeAnimations.has(canvasId)) {
          const effectInstance = $(this).data("effectInstance");
          if (effectInstance && effectInstance.update) {
            effectInstance.update();
          }
        }
      });

      globalAnimationId = requestAnimationFrame(globalAnimationLoop);
    }

    $(".pxl-star").each(function () {
      const $canvas = $(this);

      const existingEffect = $canvas.data("effectInstance");
      if (existingEffect && existingEffect.cleanup) {
        existingEffect.cleanup();
      }

      const effectInstance = createSingleEffect($canvas);
      if (effectInstance) {
        $canvas.data("effectInstance", effectInstance);
      }
    });

    if (activeAnimations.size > 0 && !globalAnimationId) {
      globalAnimationId = requestAnimationFrame(globalAnimationLoop);
    }
  }

  function stotage_margin_fix($scope) {
    // function updateMargin() {
    //     let height = $scope.find(".pxl-box-grid .pxl-grid-item .pxl-item--holder > .pxl-item--desc").outerHeight();
    //     if (height) {
    //         $scope.find(".pxl-box-grid .pxl-grid-item .pxl-item--holder > .pxl-item--desc")
    //         .parent()
    //         .css("margin-bottom", "-" + height + "px");
    //     }
    // }
    // updateMargin();
    // $(window).resize(function () {
    //     updateMargin();
    // });
  }

  $(window).on('elementor/frontend/init', function () {
    elementorFrontend.hooks.addAction('frontend/element_ready/global', function ($scope) {
      setTimeout(() => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          initBlobEffect();
        }
      }, 300);
      stotage_svg_color($scope);
      stotage_height_des($scope);
      stotageCheckBox($scope);
      stotage_scroll_checkp($scope);
      stotage_load_more_fancybox($scope);
      stotage_margin_fix($scope);
      initCustomFunctions();
      setTimeout(function () {
        stotage_image_scroll($scope);
        stotage_video_height($scope);
        stotage_animation_btn($scope);
        stotage_video_scroll($scope);
        stotage_image_scroll2($scope);
        stotage_height_margin($scope);
        stotage_image_scroll3($scope);
        stotage_image_scroll4($scope);
        stotage_scroll_image_list_addclass($scope);
        stotage_scroll_image_list($scope);
        stotage_scroll_image_list_2($scope);
        stotage_show_hide_elementor($scope);
        stotage_showcase_snap_slider($scope);
        stotage_image_slide_card_2($scope);
        setCarouselMinHeight($scope);
        initCarousel4($scope);
      }, 300);
      ///
      $scope.find('.pxl-rate').each(function () {
        const $pxlRate = $(this);
        const $rateValues = $pxlRate.find('.rate .value');
        if (!$rateValues.filter('.active').length) {
          $rateValues.removeClass('active');
          $rateValues.first().addClass('active');
        }
        $pxlRate.find('.list-time .time').on('click', function () {
          const selectedText = $(this).text().trim();
          $pxlRate.find('.time-first').contents().filter(function () {
            return this.nodeType === 3;
          }).first().replaceWith(selectedText + ' ');
          const index = $(this).index();
          $rateValues.removeClass('active');
          $rateValues.eq(index).addClass('active');
        });
      });
      let $titles = $scope.find('.pxl-image-list .wrap-content .title');
      let $images = $scope.find('.pxl-image-list .wrap-image .pxl-item--image');
      if (!$images.filter('.active').length) {
        $images.removeClass('active');
        $images.first().addClass('active');
      }
      $titles.on('mouseenter', function () {
        let index = $(this).index();
        $images.removeClass('active');
        $images.eq(index).addClass('active');
      });
      $scope.find('.pxl-icon-box4 .pxl-item').each(function () {
        $(this).hover(function () {
          $(this).closest('.pxl-icon-box4').find('.pxl-item').removeClass('active');
          $(this).addClass('active');
        });
      });
    });

    stotage_css_inline_js();
    stotage_zoom_point();
    stotage_scroll_fixed_section();
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_contact_form.default', PXL_Icon_Contact_Form);
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_heading.default', function ($scope) {
      stotage_split_text($scope);
      stotage_scroll_text($scope);
      stotage_scroll_text_horizontal($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_icon.default', function ($scope) {
      stotage_scroll_icon($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_image_hover_mouse.default', function ($scope) {
      stotage_img_covermouse($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_pricing.default', function ($scope) {
      stotage_price($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_team_box.default', function ($scope) {
      stotage_teambox_scroll($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_post_slip.default', function ($scope) {
      stotage_split_text($scope);
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/pxl_section_scale.default', function ($scope) {
      stotage_scroll_trigger($scope);
    });
  });
  function initCustomFunctions() {
    try {
      if (typeof stotage_section_start_render === "function") {
        stotage_section_start_render();
      }
    } catch (error) {
      console.error("Error initializing custom functions:", error);
    }
  }

  $(document).ready(function () {
    setTimeout(function () {
      if (typeof elementor !== "undefined") {
        initCustomFunctions();
      }
    }, 1000);
  });



})(jQuery);
