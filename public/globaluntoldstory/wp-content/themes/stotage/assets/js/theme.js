; (function ($) {

    "use strict";

    var pxl_scroll_top;
    var pxl_window_height;
    var pxl_window_width;
    var pxl_scroll_status = '';
    var pxl_last_scroll_top = 0;
    var pxl_post_slip = false;

    let lastHeight = 0;
    let animating = false;
    let currentActiveId = null;
    $(window).on('load', function () {
        setTimeout(function () {
            $(".pxl-loader").addClass("is-loaded");
        }, 60);
        $('.pxl-swiper-slider, .pxl-header-mobile-elementor').css('opacity', '1');
        $('.pxl-gallery-scroll').parents('body').addClass('body-overflow').addClass('body-visible-sm');
        pxl_window_width = $(window).width();
        pxl_window_height = $(window).height();
        stotage_header_sticky();
        stotage_header_mobile();
        stotage_scroll_to_top();
        scrollToggleActive();
        stotage_footer_fixed();
        stotage_shop_quantity();
        stotage_submenu_responsive();
        stotage_panel_anchor_toggle();
        //stotage_shop_view_layout();
        stotage_menu_divider_move();
        stotage_fit_to_screen();
        stotage_el_parallax();
        //stotage_post_slip();
    });

    $(window).on('scroll', function () {
        pxl_scroll_top = $(window).scrollTop();
        pxl_window_height = $(window).height();
        pxl_window_width = $(window).width();
        if (pxl_scroll_top < pxl_last_scroll_top) {
            pxl_scroll_status = 'up';
        } else {
            pxl_scroll_status = 'down';
        }
        pxl_last_scroll_top = pxl_scroll_top;
        stotage_header_sticky();
        stotage_scroll_to_top();
        stotage_footer_fixed();
        //stotage_post_slip();
        var scrollTop = $(this).scrollTop();
        var windowHeightStart = $(window).height();

        if (scrollTop >= windowHeightStart) {
            $(".px-header--fixed").addClass("bg-blur");
        } else {
            $(".px-header--fixed").removeClass("bg-blur");
        }
        stotage_ptitle_scroll_opacity();
        if (pxl_scroll_top < 100) {
            $('.elementor > .pin-spacer').removeClass('scroll-top-active');
        }
        /////

        ////
        let newActiveId = null;

        $('.elementor-element[id]').each(function () {
            const $section = $(this);
            const sectionId = $section.attr('id');

            const sectionTop = $section.offset().top;
            const sectionHeight = $section.outerHeight();
            const sectionBottom = sectionTop + sectionHeight;

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const windowBottom = scrollTop + windowHeight;

            // Kiểm tra nếu section nằm hoàn toàn trong viewport
            if (sectionTop >= scrollTop && sectionBottom <= windowBottom) {
                newActiveId = sectionId;
                return false; // Dừng loop khi tìm thấy section đầu tiên nằm trọn
            }
        });

        // Nếu tìm thấy một section mới nằm trọn và khác với section hiện tại
        if (newActiveId && newActiveId !== currentActiveId) {
            if (currentActiveId) {
                $('a[href="#' + currentActiveId + '"]').removeClass('active');
            }
            // Thêm class active mới
            $('a[href="#' + newActiveId + '"]').addClass('active');
            currentActiveId = newActiveId;
        }
        ////
        if ($('.pxl_line_scroll').length) {
            let scrollTop = $(window).scrollTop();
            let windowHeight = $(window).height();
            let scrollElement = $(".pxl_line_scroll");
            let elementTop = scrollElement.offset().top;
            let elementHeight = scrollElement.outerHeight();
            let lineElement = $(".pxl_line_scroll .line .line-change");
            let dotElements = $('.pxl_line_scroll .line > .dot');
            dotElements.each(function () {
                let dot = $(this);
                let dotTop = dot.offset().top;
                let isActive = dot.hasClass('active');

                if (scrollTop + windowHeight * 0.8 >= dotTop && scrollTop <= dotTop + dot.outerHeight()) {
                    dot.addClass('active');
                } else {
                    dot.removeClass('active');
                }
            });

            let beforeHeight = (scrollTop + windowHeight * 0.8) - elementTop;
            beforeHeight = Math.max(0, beforeHeight);

            $({ height: lastHeight }).animate({ height: beforeHeight }, {
                duration: 300,
                step: function (now) {
                    lineElement[0].style.setProperty("height", now + "px");
                }
            });

            lastHeight = beforeHeight;
        }

    });


    $(window).on('resize', function () {
        pxl_window_height = $(window).height();
        pxl_window_width = $(window).width();
        stotage_submenu_responsive();
        stotage_header_mobile();
        stotage_fit_to_screen();
        setTimeout(function () {
            stotage_menu_divider_move();
        }, 500);
    });

    $(document).ready(function () {
        stotage_button_parallax();
        stotage_backtotop_progess_bar();
        stotage_type_file_upload();
        //stotage_zoom_point();
        /////
        $('.pxl-grid-inner').each(function () {
            var $wrap = $(this);
            var $items = $wrap.find('.pxl-grid-item');
            var $images = $wrap.find('.bgr-list .image-item');
            $images.removeClass('active preactive').first().addClass('active');

            $items.each(function (index) {
                $(this).on('mouseenter', function () {
                    var $target = $images.eq(index);
                    var $currentActive = $images.filter('.active');

                    if (!$target.is($currentActive)) {
                        $images.removeClass('preactive');

                        $currentActive.removeClass('active').addClass('preactive');
                        $target.removeClass('preactive').addClass('active');
                    }
                });

                $(this).on('mouseleave', function () {
                    $images.removeClass('active preactive').first().addClass('active');
                });
            });
        });


        /////

        let previousValue = $('.your-value .ctf7-total').attr('data-number');
        $('.your-value  .value').text(previousValue);

        setInterval(function () {
            const currentValue = $('.your-value .ctf7-total').attr('data-number');
            if (currentValue !== previousValue) {
                previousValue = currentValue;
                $('.your-value  .value').text(currentValue);
            }
        }, 1);
        ///
        $('a[href^="#"]:not(.tabs a)').on('click', function (e) {
            e.preventDefault();

            const target = $(this.getAttribute('href'));

            if (target.length) {
                $('html, body').animate(
                    {
                        scrollTop: target.offset().top,
                    },
                    600
                );
            }
        });
        /* Hover Active button */

        ///
        var svgIcon = `<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.25391 0.359375C9.36328 0.222656 9.58203 0.222656 9.71875 0.359375L12.8906 3.53125C13.0273 3.66797 13.0273 3.85938 12.8906 3.99609L9.71875 7.16797C9.58203 7.30469 9.36328 7.30469 9.25391 7.16797L9.03516 6.97656C8.92578 6.83984 8.92578 6.64844 9.03516 6.51172L11.332 4.21484H1.07812C0.886719 4.21484 0.75 4.07812 0.75 3.88672V3.61328C0.75 3.44922 0.886719 3.28516 1.07812 3.28516H11.332L9.03516 1.01562C8.92578 0.878906 8.92578 0.6875 9.03516 0.550781L9.25391 0.359375Z" fill="#CB360F"/></svg>`;
        var svgIcon2 = `<svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.71875 1.125C9.84375 0.96875 10.0938 0.96875 10.25 1.125L13.875 4.75C14.0312 4.90625 14.0312 5.125 13.875 5.28125L10.25 8.90625C10.0938 9.0625 9.84375 9.0625 9.71875 8.90625L9.46875 8.6875C9.34375 8.53125 9.34375 8.3125 9.46875 8.15625L12.0938 5.53125H0.375C0.15625 5.53125 0 5.375 0 5.15625V4.84375C0 4.65625 0.15625 4.46875 0.375 4.46875H12.0938L9.46875 1.875C9.34375 1.71875 9.34375 1.5 9.46875 1.34375L9.71875 1.125Z" fill="white"/></svg>`;
        $('.pxl-breadcrumb li + li span').before(svgIcon);
        $('.pxl-breadcrumb li + li a').prepend(svgIcon);
        $('.comment-form .form-submit button').append(svgIcon2);
        //      
        const $items = $('.pxl-sticky-effect-scroll .elementor-widget-container');
        const $inners = $('.pxl-sticky-effect-scroll');
        const $endTrigger = $('.pxl-sticky-effect-scroll .elementor-widget-container');

        if ($items.length > 0) {
            $items.each(function (index, item) {
                gsap.to(item, {
                    opacity: 0,
                    scale: 0.8,
                    scrollTrigger: {
                        trigger: item,
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                    }
                });

                if (index < $items.length - 1) {
                    gsap.to(item, {
                        scrollTrigger: {
                            trigger: item,
                            start: "top top",
                            end: "bottom bottom+=10",
                            endTrigger: $endTrigger[0],
                            scrub: true,
                            pin: true,
                            pinSpacing: false,
                        }
                    });
                }
            });
        }

        $inners.each(function (index, inner) {
            if (index < $inners.length - 1) {
                gsap.to(inner, {
                    yPercent: -30,
                    scale: 1,
                    ease: "Linear.easeNone",
                    scrollTrigger: {
                        trigger: inner,
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                    }
                });
            }
        });

        ///screen image change
        $(".pxl-screen .pxl-screen-wrapper .wrap-img img:first-child").addClass("active");
        $(".pxl-screen .pxl-item--button:first-child").addClass("active");
        $(".pxl-screen .pxl-item--button").on('click', function () {
            $(".pxl-screen .pxl-item--button").removeClass("active");
            $(this).addClass("active");
            let index = $(this).index();

            let $targetImg = $(".pxl-screen .wrap-img img").eq(index);
            $targetImg.addClass("active");
            $(".pxl-screen .wrap-img img").not($targetImg).removeClass("active");
        });

        ////

        $('.comment-form .form-submit button').addClass('btn btn-style-2');
        ////
        $(".pxl-portfolio-grid-layout2 .pxl-grid-inner .pxl-grid-item .pxl-post--inner .pxl-post--category a,.pxl-portfolio-grid-layout3 .pxl-grid-inner .pxl-grid-item .pxl-post--inner .pxl-post--category a").each(function () {
            var content = $(this).text();
            var span = $("<span></span>").text(content);
            $(this).empty().append(span);
        });
        /* Start Menu Mobile */
        $('.pxl-header-menu li.menu-item-has-children').append('<span class="pxl-menu-toggle"></span>');
        $('.pxl-menu-toggle').on('click', function () {
            if ($(this).hasClass('active')) {
                $(this).closest('ul').find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
            } else {
                $(this).closest('ul').find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
                $(this).toggleClass('active');
                $(this).parent().find('> .sub-menu').toggleClass('active');
                $(this).parent().find('> .sub-menu').slideToggle();
            }
        });

        $(document).on("mouseenter mouseleave", "li.pxl-megamenu", function (e) {
            $(this).parents('.elementor-element').toggleClass('section-mega-active', e.type === 'mouseenter');
        });


        $("#pxl-nav-mobile, .pxl-anchor-mobile-menu").on('click', function () {
            $(this).toggleClass('active');
            $('body').toggleClass('body-overflow');
            $('.pxl-header-menu').toggleClass('active');
        });

        $(".pxl-menu-close, .pxl-header-menu-backdrop, #pxl-header-mobile .pxl-menu-primary a.is-one-page").on('click', function () {
            $(this).parents('.pxl-header-main').find('.pxl-header-menu').removeClass('active');
            $('#pxl-nav-mobile').removeClass('active');
            $('body').toggleClass('body-overflow');
        });
        /* End Menu Mobile */

        /* Menu Vertical */
        $('.pxl-nav-vertical li.menu-item-has-children > a').append('<span class="pxl-arrow-toggle"><i class="flaticon-right-up"></i></span>');
        $('.pxl-nav-vertical li.menu-item-has-children > a').on('click', function () {
            if ($(this).hasClass('active')) {
                $(this).next().toggleClass('active').slideToggle();
            } else {
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
                $(this).closest('ul').find('a.active').toggleClass('active');
                $(this).find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).toggleClass('active');
                $(this).next().toggleClass('active').slideToggle();
            }
        });

        /* Mega Menu Max Height */
        var m_h_mega = $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').outerHeight();
        var w_h_mega = $(window).height();
        var w_h_mega_css = w_h_mega - 120;
        if (m_h_mega > w_h_mega) {
            $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').css('max-height', w_h_mega_css + 'px');
            $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').css('overflow-x', 'scroll');
        }
        // Active Mega Menu Hover
        $(document).on("mouseenter mouseleave", "li.pxl-megamenu", function (e) {
            $(this).parents('.elementor-section').toggleClass('section-mega-active', e.type === 'mouseenter');
        });

        /* End Mega Menu Max Height */
        /* Search Popup */
        var $search_wrap_init = $("#pxl-search-popup");
        var search_field = $('#pxl-search-popup .search-field');
        var $body = $('body');

        $(".pxl-search-popup-button").on('click', function (e) {
            if (!$search_wrap_init.hasClass('active')) {
                $search_wrap_init.addClass('active');
                setTimeout(function () { search_field.get(0).focus(); }, 500);
            } else if (search_field.val() === '') {
                $search_wrap_init.removeClass('active');
                search_field.get(0).focus();
            }
            e.preventDefault();
            return false;
        });

        $(".pxl-subscribe-popup .pxl-item--overlay, .pxl-subscribe-popup .pxl-item--close").on('click', function (e) {
            $(this).parents('.pxl-subscribe-popup').removeClass('pxl-active');
            e.preventDefault();
            return false;
        });

        $("#pxl-search-popup .pxl-item--overlay, #pxl-search-popup .pxl-item--close").on('click', function (e) {
            $body.addClass('pxl-search-out-anim');
            setTimeout(function () {
                $body.removeClass('pxl-search-out-anim');
            }, 800);
            setTimeout(function () {
                $search_wrap_init.removeClass('active');
            }, 800);
            e.preventDefault();
            return false;
        });

        /* Scroll To Top */
        $('.pxl-scroll-top').on('click', function () {
            $('html, body').animate({ scrollTop: 0 }, 1200);
            $(this).parents('.pxl-wapper').find('.elementor > .pin-spacer').addClass('scroll-top-active');
            return false;
        });
        /* Arrow Custom */
        $('.pxl-tabs').parents('.pxl-item--title').addClass('pxl--hide-arrow');
        var section_tab = $('.pxl-navigation-tab').parents('.elementor-element').addClass('pxl--hide-arrow');
        setTimeout(function () {
            var target = section_tab.find('.pxl-tabs .pxl-tabs--title');
            var target_clone = target.clone();
            var target_tab = target.parents('.elementor-element.pxl--hide-arrow').find('.pxl-navigation-tab');
            target_tab.append(target_clone);
            target_tab.find('.pxl-item--title').on('click', function () {
                $(this).parents('.elementor-element.pxl--hide-arrow').find('.pxl-navigation-tab .pxl-item--title').toggleClass('active');
                $(this).parents('.elementor-element.pxl--hide-arrow').find('.pxl-tabs .pxl-item--title').toggleClass('active');
                $(this).parents('.elementor-element.pxl--hide-arrow').find('.pxl-tabs .pxl-item--title.active').trigger('click');
            });
        }, 300);
        ////


        var section_carousel = $('.pxl-carousel-nav').parents('.elementor-element').addClass('pxl--hide-pagination');
        setTimeout(function () {
            $('.elementor-element').each(function () {
                const $element = $(this);
                const $source = $element.find('.pxl-swiper-slider .swiper-pagination-progressbar-fill');
                const $target = $element.find('.pxl-carousel-nav .swiper-pagination-fill-custom');
                if ($source.length && $target.length) {
                    let lastTransform = $source.css('transform');
                    let lastDuration = $source.css('transition-duration');

                    function syncStyles() {
                        const currentTransform = $source.css('transform');
                        const currentDuration = $source.css('transition-duration');
                        if (currentTransform !== lastTransform || currentDuration !== lastDuration) {
                            $target.css({
                                'transform': currentTransform,
                                //'transition-duration': currentDuration
                            });

                            lastTransform = currentTransform;
                            lastDuration = currentDuration;
                        }
                    }
                    setInterval(syncStyles, 50);
                }
            });
        }, 100);

        /* Animate Time Delay */

        $('.pxl-grid-masonry').each(function () {
            var eltime = 80;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl-grid-item > .wow').each(function (index, obj) {
                $(this).css('animation-delay', eltime + 'ms');
                if (_elt === index) {
                    eltime = 80;
                    _elt = _elt + elt_inner;
                } else {
                    eltime = eltime + 80;
                }
            });
        });

        $('.btn-text-nina').each(function () {
            var eltime = 0.045;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span').each(function (index, obj) {
                $(this).css('transition-delay', eltime + 's');
                eltime = eltime + 0.045;
            });
        });

        $('.btn-text-nanuk').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span').each(function (index, obj) {
                $(this).css('animation-delay', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        $('.btn-text-smoke').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span > span > span').each(function (index, obj) {
                $(this).css('--d', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        $('.btn-text-reverse .pxl-text--front, .btn-text-reverse .pxl-text--back').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('.pxl-text--inner > span').each(function (index, obj) {
                $(this).css('transition-delay', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        /* End Animate Time Delay */

        $('.label-text-fillter').on('click', function () {
            $(this).parents('.pxl-grid-filter').addClass('active');
        });
        $('.filter-item').on('click', function () {
            $('.pxl-grid-filter').removeClass('active');
        });
        $(document).on('click', '.mfp-iframe', function (e) {
            e.preventDefault();
        });

        /* Lightbox Popup */
        $('.pxl-action-popup').magnificPopup({
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });

        $('.pxl-gallery-lightbox').each(function () {
            $(this).magnificPopup({
                delegate: 'a.lightbox',
                type: 'image',
                gallery: {
                    enabled: true
                },
                mainClass: 'mfp-fade',
            });
        });

        /* Page Title Parallax */
        if ($('#pxl-page-title-default').hasClass('pxl--parallax')) {
            $(this).stellar();
        }

        /* Cart Sidebar Popup */
        $(".pxl-cart-sidebar-button").on('click', function () {
            $('body').addClass('body-overflow');
            $('#pxl-cart-sidebar').addClass('active');
        });
        $("#pxl-cart-sidebar .pxl-popup--overlay, #pxl-cart-sidebar .pxl-item--close").on('click', function () {
            $('body').removeClass('body-overflow');
            $('#pxl-cart-sidebar').removeClass('active');
        });
        $(".pxl-accordion1.style2 .pxl-accordion--content").find("br").remove();
        /* Hover Active Item */
        // $('.pxl-icon-box3 .pxl-item').each(function () {
        //     $(this).hover(function () {
        //         $(this).parents('.pxl-icon-box3').find('.pxl-item').removeClass('active');
        //         $(this).addClass('active');
        //     });
        // });

        /* Start Icon Bounce */
        var boxEls = $('.el-bounce, .pxl-image-effect1, .el-effect-zigzag');
        $.each(boxEls, function (boxIndex, boxEl) {
            loopToggleClass(boxEl, 'active');
        });

        function loopToggleClass(el, toggleClass) {
            el = $(el);
            let counter = 0;
            if (el.hasClass(toggleClass)) {
                waitFor(function () {
                    counter++;
                    return counter == 2;
                }, function () {
                    counter = 0;
                    el.removeClass(toggleClass);
                    loopToggleClass(el, toggleClass);
                }, 'Deactivate', 1000);
            } else {
                waitFor(function () {
                    counter++;
                    return counter == 3;
                }, function () {
                    counter = 0;
                    el.addClass(toggleClass);
                    loopToggleClass(el, toggleClass);
                }, 'Activate', 1000);
            }
        }

        function waitFor(condition, callback, message, time) {
            if (message == null || message == '' || typeof message == 'undefined') {
                message = 'Timeout';
            }
            if (time == null || time == '' || typeof time == 'undefined') {
                time = 100;
            }
            var cond = condition();
            if (cond) {
                callback();
            } else {
                setTimeout(function () {
                    waitFor(condition, callback, message, time);
                }, time);
            }
        }
        ////
        //  let height = $(".pxl-box-grid .pxl-grid-item .pxl-item--holder > .pxl-item--desc").outerHeight();
        //   $(".pxl-item--desc").parent().css("margin-bottom", "-"+height + "px");

        /////
        /* End Icon Bounce */




        /* Image Effect */
        if ($('.pxl-image-tilt').length) {
            $('.pxl-image-tilt').parents('.elementor-top-section').addClass('pxl-image-tilt-active');
            $('.pxl-image-tilt').each(function () {
                var pxl_maxtilt = $(this).data('maxtilt'),
                    pxl_speedtilt = $(this).data('speedtilt'),
                    pxl_perspectivetilt = $(this).data('perspectivetilt');
                VanillaTilt.init(this, {
                    max: pxl_maxtilt,
                    speed: pxl_speedtilt,
                    perspective: pxl_perspectivetilt
                });
            });
        }

        /* Select Theme Style */
        $('.widget.widget_search input').attr('required', true);
        $('.wpcf7-select').each(function () {
            var $this = $(this), numberOfOptions = $(this).children('option').length;

            $this.addClass('pxl-select-hidden');
            $this.wrap('<div class="pxl-select"></div>');
            $this.after('<div class="pxl-select-higthlight"></div>');

            var $styledSelect = $this.next('div.pxl-select-higthlight');
            $styledSelect.text($this.children('option').eq(0).text());

            var $list = $('<ul />', {
                'class': 'pxl-select-options'
            }).insertAfter($styledSelect);

            for (var i = 0; i < numberOfOptions; i++) {
                $('<li />', {
                    text: $this.children('option').eq(i).text(),
                    rel: $this.children('option').eq(i).val()
                }).appendTo($list);
            }

            var $listItems = $list.children('li');

            $styledSelect.on('click', function (e) {
                e.stopPropagation();
                $('div.pxl-select-higthlight.active').not(this).each(function () {
                    $(this).removeClass('active').next('ul.pxl-select-options').addClass('pxl-select-lists-hide');
                });
                $(this).toggleClass('active');
            });

            $listItems.on('click', function (e) {
                e.stopPropagation();
                $styledSelect.text($(this).text()).removeClass('active');
                $this.val($(this).attr('rel'));
            });

            $(document).on('click', function () {
                $styledSelect.removeClass('active');
            });

        });
        ////svg comment
        var svgElement = `
<svg width="200" height="170" viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 85V170H85.7051V85H28.5685C28.5685 53.7547 54.2006 28.3335 85.7051 28.3335V0C38.4445 0 0 38.1282 0 85Z" fill="#003819"/>
  <path d="M199.998 28.3335V0C152.737 0 114.293 38.1282 114.293 85V170H199.998V85H142.861C142.861 53.7547 168.494 28.3335 199.998 28.3335Z" fill="#003819"/>
</svg>
        `;

        $('.single-product li.review ').append(svgElement);
        ///
        /* Nice Select */
        $('.woocommerce-ordering .orderby, #pxl-sidebar-area select, .variations_form.cart .variations select, .pxl-open-table select, .pxl-nice-select').each(function () {
            $(this).niceSelect();
        });

        $('.pxl-post-list .nice-select').each(function () {
            $(this).niceSelect();
        });

        /* Typewriter */
        if ($('.pxl-title--typewriter').length) {
            function typewriterOut(elements, callback) {
                if (elements.length) {
                    elements.eq(0).addClass('is-active');
                    elements.eq(0).delay(2000);
                    elements.eq(0).removeClass('is-active');
                    typewriterOut(elements.slice(1), callback);
                }
                else {
                    callback();
                }
            }

            function typewriterIn(elements, callback) {
                if (elements.length) {
                    elements.eq(0).addClass('is-active');
                    elements.eq(0).delay(2000).slideDown(2000, function () {
                        elements.eq(0).removeClass('is-active');
                        typewriterIn(elements.slice(1), callback);
                    });
                }
                else {
                    callback();
                }
            }

            function typewriterInfinite() {
                typewriterOut($('.pxl-title--typewriter .pxl-item--text'), function () {
                    typewriterIn($('.pxl-title--typewriter .pxl-item--text'), function () {
                        typewriterInfinite();
                    });
                });
            }
            $(function () {
                typewriterInfinite();
            });
        }
        /* End Typewriter */


        /* Get checked input - Mailchimpp */
        $('.mc4wp-form input:checkbox').change(function () {
            if ($(this).is(":checked")) {
                $('.mc4wp-form').addClass("pxl-input-checked");
            } else {
                $('.mc4wp-form').removeClass("pxl-input-checked");
            }
        });

        /* Scroll to content */
        $('.pxl-link-to-section .btn').on('click', function (e) {
            var id_scroll = $(this).attr('href');
            var offsetScroll = $('.pxl-header-elementor-sticky').outerHeight();
            e.preventDefault();
            $("html, body").animate({ scrollTop: $(id_scroll).offset().top - offsetScroll }, 600);
        });

        //Some Widget Default
        //$('.widget .cat-item a, .widget_archive li a').append('<span class="pxl-item--divider"></span>');
        $('.pxl-anchor-button').on('click', function (e) {
            $(this).parent().toggleClass('active');
            //$('body').toggleClass('body-overflow');
        });
        /* Social Button Click */
        $('.pxl-social--button').on('click', function () {
            $(this).toggleClass('active');
        });
        $(document).on('click', function (e) {
            if (e.target.className == 'pxl-social--button active')
                $('.pxl-social--button').removeClass('active');
        });



    });

    jQuery(document).ajaxComplete(function (event, xhr, settings) {
        stotage_shop_quantity();

    });

    jQuery(document).on('updated_wc_div', function () {
        stotage_shop_quantity();
    });

    /* Header Sticky */
    function stotage_header_sticky() {
        if ($('#pxl-header-elementor').hasClass('is-sticky')) {
            if (pxl_scroll_top > 100) {
                $('.pxl-header-elementor-sticky.pxl-sticky-stb').addClass('pxl-header-fixed');
                $('#pxl-header-mobile').addClass('pxl-header-mobile-fixed');
            } else {
                $('.pxl-header-elementor-sticky.pxl-sticky-stb').removeClass('pxl-header-fixed');
                $('#pxl-header-mobile').removeClass('pxl-header-mobile-fixed');
            }

            if (pxl_scroll_status == 'up' && pxl_scroll_top > 100) {
                $('.pxl-header-elementor-sticky.pxl-sticky-stt').addClass('pxl-header-fixed');
            } else {
                $('.pxl-header-elementor-sticky.pxl-sticky-stt').removeClass('pxl-header-fixed');
            }
        }

        $('.pxl-header-elementor-sticky').parents('body').addClass('pxl-header-sticky');
    }

    /* Header Mobile */
    function stotage_header_mobile() {
        var h_header_mobile = $('#pxl-header-elementor').outerHeight();
        if (pxl_window_width < 1199) {
            $('#pxl-header-elementor').css('min-height', h_header_mobile + 'px');
        }
    }

    /* Scroll To Top */
    function stotage_scroll_to_top() {
        if (pxl_scroll_top < pxl_window_height) {
            $('.pxl-scroll-top').addClass('pxl-off').removeClass('pxl-on');
        }
        if (pxl_scroll_top > pxl_window_height) {
            $('.pxl-scroll-top').addClass('pxl-on').removeClass('pxl-off');
        }
    }

    /* Footer Fixed */
    function stotage_footer_fixed() {
        setTimeout(function () {
            var h_footer = $('.pxl-footer-fixed #pxl-footer-elementor').outerHeight() - 1;
            $('.pxl-footer-fixed #pxl-main').css('margin-bottom', h_footer + 'px');
        }, 600);
    }

    /* WooComerce Quantity */
    function stotage_shop_quantity() {
        "use strict";
        $('#pxl-wapper .quantity').append('<span class="quantity-icon quantity-down pxl-icon--minus"></span><span class="quantity-icon quantity-up pxl-icon--plus"></span>');
        $('.quantity-up').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepUp();
            $(this).parents('.woocommerce-cart-form').find('.actions .button').removeAttr('disabled');
        });
        $('.quantity-down').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepDown();
            $(this).parents('.woocommerce-cart-form').find('.actions .button').removeAttr('disabled');
        });
        $('.quantity-icon').on('click', function () {
            var quantity_number = $(this).parents('.quantity').find('input[type="number"]').val();
            var add_to_cart_button = $(this).parents(".product, .woocommerce-product-inner").find(".add_to_cart_button");
            add_to_cart_button.attr('data-quantity', quantity_number);
            add_to_cart_button.attr("href", "?add-to-cart=" + add_to_cart_button.attr("data-product_id") + "&quantity=" + quantity_number);
        });
        $('.woocommerce-cart-form .actions .button').removeAttr('disabled');
    }

    /* Menu Responsive Dropdown */
    function stotage_submenu_responsive() {
        var $stotage_menu = $('.pxl-header-elementor-main, .pxl-header-elementor-sticky');
        $stotage_menu.find('.pxl-menu-primary li').each(function () {
            var $stotage_submenu = $(this).find('> ul.sub-menu');
            if ($stotage_submenu.length == 1) {
                if (($stotage_submenu.offset().left + $stotage_submenu.width() + 0) > $(window).width()) {
                    $stotage_submenu.addClass('pxl-sub-reverse');
                }
            }
        });
    }
    // function //stotage_post_slip() {
    //     var windowHeight = window.innerHeight;
    //     var windowWidth = window.innerWidth;
    //     var scrollTop = $(window).scrollTop();

    //     jQuery('.pxl-post-image--track').each(function () {
    //         var topLimit = parseFloat(jQuery('.pxl-post-image--block').first().css('top'));
    //         var bottomLimit = parseFloat(jQuery('.pxl-post-image--block').first().outerHeight())
    //         + parseFloat(jQuery('.pxl-post-block_2').css('margin-top'));

    //         jQuery('.pxl-post-image--block').removeClass('end').each(function (is) {
    //             var currentTop = jQuery(this).offset().top - scrollTop - topLimit;

    //             var c = parseFloat(currentTop / bottomLimit);
    //             if (c < 0) c = 0;
    //             else if (c > 1) c = 1;

    //             if (c == 0 || is == 0){
    //                 jQuery(this).addClass('active');

    //                 jQuery('#pxl-post-active-link').attr( 'data-service_title', jQuery.trim( jQuery(this).find('.pxl-post-block--min h3').html().replace(/[\r\n\t]|\<[^\>]+\>/g, '') ) );
    //             } else jQuery(this).removeClass('active');

    //             if (c < .5 || is == 0) jQuery(this).addClass('preactive');
    //             else jQuery(this).removeClass('preactive');
    //         });

    //         jQuery('.pxl-post-image--block.preactive').slice(0, -1).removeClass('active').addClass('end');

    //     });
    //     if ($('.pxl-post-slip').length) {
    //         var offsetTop = $('.pxl-post-slip').offset().top + (windowWidth >= 1200 ? 500 : 100) - windowHeight;
    //         if ((scrollTop >= offsetTop) && !pxl_post_slip) {
    //             $(".pxl-post-block_1").addClass("slip-active");
    //             setTimeout(function () {
    //                 $(".pxl-post-block_2").addClass("slip-active");
    //             }, 500);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_3").addClass("slip-active");
    //             }, 600);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_4").addClass("slip-active");
    //             }, 700);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_5").addClass("slip-active");
    //             }, 800);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_6").addClass("slip-active");
    //             }, 900);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_7").addClass("slip-active");
    //             }, 1000);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_8").addClass("slip-active");
    //             }, 1100);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_9").addClass("slip-active");
    //             }, 1200);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_10").addClass("slip-active");
    //             }, 1300);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_11").addClass("slip-active");
    //             }, 1400);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_12").addClass("slip-active");
    //             }, 1500);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_13").addClass("slip-active");
    //             }, 1600);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_14").addClass("slip-active");
    //             }, 1700);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_15").addClass("slip-active");
    //             }, 1800);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_16").addClass("slip-active");
    //             }, 1900);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_17").addClass("slip-active");
    //             }, 2000);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_18").addClass("slip-active");
    //             }, 2100);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_19").addClass("slip-active");
    //             }, 2200);
    //             setTimeout(function () {
    //                 $(".pxl-post-block_20").addClass("slip-active");
    //             }, 2300);

    //             pxl_post_slip = true;
    //         }
    //     }
    // }
    function stotage_panel_anchor_toggle() {
        'use strict';
        $(document).on('click', '.pxl-anchor-button', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var target = $(this).attr('data-target');
            $(target).toggleClass('active');
            $('body').toggleClass('body-overflow');
            $('.pxl-popup--conent .wow').addClass('animated').removeClass('aniOut');
            $('.pxl-popup--conent .fadeInPopup').removeClass('aniOut');
            if ($(target).find('.pxl-search-form').length > 0) {
                setTimeout(function () {
                    $(target).find('.pxl-search-form .pxl-search-field').focus();
                }, 1000);
            }
        });

        $('.pxl-anchor-button').each(function () {
            var t_target = $(this).attr('data-target');
            var t_delay = $(this).attr('data-delay-hover');
            $(t_target).find('.pxl-popup--conent').css('transition-delay', t_delay + 'ms');
            $(t_target).find('.pxl-popup--overlay').css('transition-delay', t_delay + 'ms');
        });

        $(".pxl-hidden-panel-popup .pxl-popup--overlay, .pxl-hidden-panel-popup .pxl-close-popup").on('click', function () {
            $('body').removeClass('body-overflow');
            $('.pxl-hidden-panel-popup').removeClass('active');
            $('.pxl-popup--conent .wow').addClass('aniOut').removeClass('animated');
            $('.pxl-popup--conent .fadeInPopup').addClass('aniOut');
            $('.pxl-anchor-button').parent().removeClass('active');
        });


        $(".pxl-popup--close").on('click', function () {
            $('body').removeClass('body-overflow');
            $(this).parent().removeClass('active');
        });
        $(".pxl-close-popup").on('click', function () {
            $('body').removeClass('body-overflow');
            $('.pxl-page-popup').removeClass('active');
        });
    }

    /* Page Title Scroll Opacity */
    function stotage_ptitle_scroll_opacity() {
        var divs = $('#pxl-page-title-elementor.pxl-scroll-opacity .elementor-widget'),
            limit = $('#pxl-page-title-elementor.pxl-scroll-opacity').outerHeight();
        if (pxl_scroll_top <= limit) {
            divs.css({ 'opacity': (1 - pxl_scroll_top / limit) });
        }
    }






    /* Button Parallax */
    function stotage_button_parallax() {
        $('.btn-text-parallax, .pxl-blog-style2, .pxl-hover-parallax').on('mouseenter', function () {
            $(this).addClass('hovered');
        });

        $('.btn-text-parallax, .pxl-blog-style2, .pxl-hover-parallax').on('mouseleave', function () {
            $(this).removeClass('hovered');
        });

        $('.btn-text-parallax').on('mousemove', function (e) {
            const bounds = this.getBoundingClientRect();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height;
            const deltaX = Math.floor((centerX - e.clientX)) * 0.222;
            const deltaY = Math.floor((centerY - e.clientY)) * 0.333;
            $(this).find('.pxl--btn-text').css({
                transform: 'translate3d(' + deltaX * 0.32 + 'px, ' + deltaY * 0.32 + 'px, 0px)'
            });
        });

        $('.pxl-blog-style2 .pxl-post--featured, .pxl-hover-parallax').on('mousemove', function (e) {
            const bounds = this.getBoundingClientRect();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height;
            const deltaX = Math.floor((centerX - e.clientX)) * 0.222;
            const deltaY = Math.floor((centerY - e.clientY)) * 0.333;
            $(this).find('.pxl-item-parallax, .pxl-post--button').css({
                transform: 'translate3d(' + deltaX * 0.32 + 'px, ' + deltaY * 0.32 + 'px, 0px)'
            });
        });
    }

    function stotage_el_parallax() {
        $('.el-parallax-wrap').on({
            mouseenter: function () {
                const $this = $(this);
                $this.addClass('hovered');
                $this.find('.el-parallax-item').css({
                    transition: 'none'
                });
            },
            mouseleave: function () {
                const $this = $(this);
                $this.removeClass('hovered');
                $this.find('.el-parallax-item').css({
                    transition: 'transform 0.5s ease',
                    transform: 'translate3d(0px, 0px, 0px)'
                });
            },
            mousemove: function (e) {
                const $this = $(this);
                const bounds = this.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const deltaX = (centerX - e.clientX) * 0.07104;
                const deltaY = (centerY - e.clientY) * 0.10656;

                requestAnimationFrame(() => {
                    $this.find('.el-parallax-item').css({
                        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px)`
                    });
                });
            }
        });
    }

    /* Menu Divider Move */
    function stotage_menu_divider_move() {
        $('.pxl-nav-menu1.fr-style-box, .pxl-nav-menu1.fr-style-box2').each(function () {
            var current = $(this).find('.pxl-menu-primary > .current-menu-item, .pxl-menu-primary > .current-menu-parent, .pxl-menu-primary > .current-menu-ancestor');
            if (current.length > 0) {
                var marker = $(this).find('.pxl-divider-move');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                marker.addClass('active');
                current.addClass('pxl-shape-active');
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                        current.removeClass('pxl-shape-active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        current.addClass('pxl-shape-active');
                    });
                }
            } else {
                var marker = $(this).find('.pxl-divider-move');
                var current = $(this).find('.pxl-menu-primary > li:nth-child(1)');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        marker.removeClass('active');
                    });
                }
            }
        });
    }
    function stotage_tab_divider_move() {
        $('.pxl-tabs2').each(function () {
            var current = $(this).find('.pxl-tabs--title > .pxl-item--title.active');
            if (current.length > 0) {
                var marker = $(this).find('.pxl-divider-move');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                marker.addClass('active');
                current.addClass('pxl-shape-active');
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                        current.removeClass('pxl-shape-active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        current.addClass('pxl-shape-active');
                    });
                }
            } else {
                var marker = $(this).find('.pxl-divider-move');
                var current = $(this).find('.pxl-menu-primary > li:nth-child(1)');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        marker.removeClass('active');
                    });
                }
            }
        });
    }

    /* Back To Top Progress Bar */
    function stotage_backtotop_progess_bar() {
        if ($('.pxl-scroll-top').length > 0) {
            var progressPath = document.querySelector('.pxl-scroll-top path');
            var pathLength = progressPath.getTotalLength();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
            progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
            progressPath.style.strokeDashoffset = pathLength;
            progressPath.getBoundingClientRect();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
            var updateProgress = function () {
                var scroll = $(window).scrollTop();
                var height = $(document).height() - $(window).height();
                var progress = pathLength - (scroll * pathLength / height);
                progressPath.style.strokeDashoffset = progress;
            }
            updateProgress();
            $(window).scroll(updateProgress);
            var offset = 50;
            var duration = 550;
            $(window).on('scroll', function () {
                if ($(this).scrollTop() > offset) {
                    $('.pxl-scroll-top').addClass('active-progress');
                } else {
                    $('.pxl-scroll-top').removeClass('active-progress');
                }
            });
        }
    }

    function scrollToggleActive() {
        let lastScrollTop = 0;
        $(window).on("scroll", function () {
            let currentScrollTop = $(this).scrollTop();

            if (currentScrollTop < lastScrollTop) {
                $(".fr-style-scroll").addClass("active");
            } else {
                $(".fr-style-scroll").removeClass("active");
            }

            lastScrollTop = currentScrollTop;
        });
    }
    /* Custom Type File Upload*/
    function stotage_type_file_upload() {

        var multipleSupport = typeof $('<input/>')[0].multiple !== 'undefined',
            isIE = /msie/i.test(navigator.userAgent);

        $.fn.pxl_custom_type_file = function () {

            return this.each(function () {

                var $file = $(this).addClass('pxl-file-upload-hidden'),
                    $wrap = $('<div class="pxl-file-upload-wrapper">'),
                    $button = $('<button type="button" class="pxl-file-upload-button">Choose File</button>'),
                    $input = $('<input type="text" class="pxl-file-upload-input" placeholder="No File Choose" />'),
                    $label = $('<label class="pxl-file-upload-button" for="' + $file[0].id + '">Choose File</label>');
                $file.css({
                    position: 'absolute',
                    opacity: '0',
                    visibility: 'hidden'
                });

                $wrap.insertAfter($file)
                    .append($file, $input, (isIE ? $label : $button));

                $file.attr('tabIndex', -1);
                $button.attr('tabIndex', -1);

                $button.on('click', function () {
                    $file.focus().click();
                });

                $file.change(function () {

                    var files = [], fileArr, filename;

                    if (multipleSupport) {
                        fileArr = $file[0].files;
                        for (var i = 0, len = fileArr.length; i < len; i++) {
                            files.push(fileArr[i].name);
                        }
                        filename = files.join(', ');
                    } else {
                        filename = $file.val().split('\\').pop();
                    }

                    $input.val(filename)
                        .attr('title', filename)
                        .focus();
                });

                $input.on({
                    blur: function () { $file.trigger('blur'); },
                    keydown: function (e) {
                        if (e.which === 13) {
                            if (!isIE) {
                                $file.trigger('click');
                            }
                        } else if (e.which === 8 || e.which === 46) {
                            $file.replaceWith($file = $file.clone(true));
                            $file.trigger('change');
                            $input.val('');
                        } else if (e.which === 9) {
                            return;
                        } else {
                            return false;
                        }
                    }
                });

            });

        };
        $('.wpcf7-file[type=file]').pxl_custom_type_file();
    }



    //  //Shop View Grid/List
    // function stotage_shop_view_layout(){

    //     $(document).on('click','.pxl-view-layout .view-icon a', function(e){
    //         e.preventDefault();
    //         if(!$(this).parent('li').hasClass('active')){
    //             $('.pxl-view-layout .view-icon').removeClass('active');
    //             $(this).parent('li').addClass('active');
    //             $(this).parents('.pxl-content-area').find('ul.products').removeAttr('class').addClass($(this).attr('data-cls'));
    //         }
    //     });
    // }


    // Zoom Point
    // function //stotage_zoom_point() {
    //     $(".pxl-zoom-point").each(function () {

    //         let scaleOffset = $(this).data('offset');
    //         let scaleAmount = $(this).data('scale-mount');

    //         function scrollZoom() {
    //             const images = document.querySelectorAll("[data-scroll-zoom]");
    //             let scrollPosY = 0;
    //             scaleAmount = scaleAmount / 100;

    //             const observerConfig = {
    //                 rootMargin: "0% 0% 0% 0%",
    //                 threshold: 0
    //             };

    //             images.forEach(image => {
    //                 let isVisible = false;
    //                 const observer = new IntersectionObserver((elements, self) => {
    //                     elements.forEach(element => {
    //                         isVisible = element.isIntersecting;
    //                     });
    //                 }, observerConfig);

    //                 observer.observe(image);

    //                 image.style.transform = `scale(${1 + scaleAmount * percentageSeen(image)})`;

    //                 window.addEventListener("scroll", () => {
    //                     if (isVisible) {
    //                         scrollPosY = window.pageYOffset;
    //                         image.style.transform = `scale(${1 +
    //                             scaleAmount * percentageSeen(image)})`;
    //                         }
    //                     });
    //             });

    //             function percentageSeen(element) {
    //                 const parent = element.parentNode;
    //                 const viewportHeight = window.innerHeight;
    //                 const scrollY = window.scrollY;
    //                 const elPosY = parent.getBoundingClientRect().top + scrollY + scaleOffset;
    //                 const borderHeight = parseFloat(getComputedStyle(parent).getPropertyValue('border-bottom-width')) + parseFloat(getComputedStyle(element).getPropertyValue('border-top-width'));
    //                 const elHeight = parent.offsetHeight + borderHeight;

    //                 if (elPosY > scrollY + viewportHeight) {
    //                     return 0;
    //                 } else if (elPosY + elHeight < scrollY) {
    //                     return 100;
    //                 } else {
    //                     const distance = scrollY + viewportHeight - elPosY;
    //                     let percentage = distance / ((viewportHeight + elHeight) / 100);
    //                     percentage = Math.round(percentage);

    //                     return percentage;
    //                 }
    //             }
    //         }

    //         scrollZoom();

    //     });
    // }



    // Fit to Screen
    function stotage_fit_to_screen() {
        $('.pxl-gallery-scroll.h-fit-to-screen').each(function () {
            var h_adminbar = 0;
            var h_section_header = 0;
            var h_section_footer = 0;
            if ($('#wpadminbar').length == 1) {
                h_adminbar = $('#wpadminbar').outerHeight();
            }
            if ($('#pxl-header-elementor').length == 1) {
                h_section_header = $('#pxl-header-elementor').outerHeight();
            }
            if ($('#pxl-footer-elementor').length == 1) {
                h_section_footer = $('#pxl-footer-elementor').outerHeight();
            }
            var h_total = pxl_window_height - (h_adminbar + h_section_header + h_section_footer);
            $(this).css('height', h_total + 'px');
        });
    }

})(jQuery);
