( function( $ ) {


    var pxl_widget_text_image = function( $scope, $ ) {
        if($scope.find('.pxl-text-img-wrap').length <= 0) return;
        var mouseX = 0,
        mouseY = 0;

        $scope.find('.pxl-text-img-wrap .pxl-item--inner').mousemove(function(e){
            var offset = $(this).offset();
            mouseX = (e.pageX - offset.left);
            mouseY = (e.pageY - offset.top);
        });

        $scope.find('.pxl-text-img-wrap ul>li').on("mouseenter", function() {
            $(this).removeClass('deactive').addClass('active');
            var target = $(this).attr('data-target');
            $(this).closest('.pxl-item--inner').find(target).removeClass('deactive').addClass('active');
        });
        $scope.find('.pxl-text-img-wrap ul>li').on("mouseleave", function() {
            $(this).addClass('deactive').removeClass('active');
            var target = $(this).attr('data-target');
            $(this).closest('.pxl-item--inner').find(target).addClass('deactive').removeClass('active');
        });
        const s = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        },
        t = gsap.quickSetter($scope.find('.pxl-text-img-wrap .pxl-item--inner'), "css"),
        e = gsap.quickSetter($scope.find('.pxl-text-img-wrap .pxl-item--inner'), "css");

        gsap.ticker.add((() => {
            const o = .15,
            i = 1 - Math.pow(.85, gsap.ticker.deltaRatio());
            s.x += (mouseX - s.x) * i,
            s.y += (mouseY - s.y) * i,
            t({
                "--pxl-mouse-x": `${s.x}px`
            }), e({
                "--pxl-mouse-y": `${s.y}px`
            })
        }))
    };

    // Scroll Item Run
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
      
      function initScrollItemRun() {
        if(window.innerWidth < 1200) return;
        const items = document.querySelectorAll(
          '[data-scroll-effect="scroll-item-run"]'
        );
      
        items.forEach((el) => {
          const triggerTopRaw = el.getAttribute('data-trigger-top') || '0';
          const triggerOffsetPx = parseInt(triggerTopRaw, 10) || 0;
      
          let direction = 0;
          if (el.classList.contains('scroll-item-run-right-to-left')) {
            direction = 100;
          } else if (el.classList.contains('scroll-item-run-left-to-right')) {
            direction = -100;
          }
      
          gsap.set(el, { xPercent: direction, willChange: 'transform' });
      
          gsap.to(el, {
            xPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: `top+=${triggerOffsetPx} bottom`,
              end: () => `top+=${triggerOffsetPx} ${window.innerHeight * (2 / 3)}`,
              scrub: true,
              invalidateOnRefresh: true
              // markers: true,
            },
          });
        });
      }
      
      document.readyState !== 'loading'
        ? initScrollItemRun()
        : document.addEventListener('DOMContentLoaded', initScrollItemRun);



    // Scroll Item Run

    $( window ).on( 'elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction( 'frontend/element_ready/pxl_meta_box.default', pxl_widget_text_image );
    } );
} )( jQuery );