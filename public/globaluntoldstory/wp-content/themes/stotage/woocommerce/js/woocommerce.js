;(function ($) {

    "use strict";

    $(document).ready(function () {


        $('.single_variation_wrap').addClass('clearfix');
        $('.woocommerce-variation-add-to-cart').addClass('clearfix');

        $('.cart-total-wrap').on('click', function () {
            $('.widget-cart-sidebar').toggleClass('open');
            $(this).toggleClass('cart-open');
            $('.site-overlay').toggleClass('open');
        });

        $('.site-overlay').on('click', function () {
            $(this).removeClass('open');
            $(this).parents('#page').find('.widget-cart-sidebar').removeClass('open');
        });

        $('.woocommerce-tab-heading').on('click', function () {
            $(this).toggleClass('open');
            $(this).parent().find('.woocommerce-tab-content').slideToggle('');
        });

        $('.site-menu-right .h-btn-cart, .mobile-menu-cart .h-btn-cart').on('click', function (e) {
            e.preventDefault();
            $(this).parents('#ct-header-wrap').find('.widget_shopping_cart').toggleClass('open');
            $('.ct-hidden-sidebar').removeClass('open');
            $('.ct-search-popup').removeClass('open');
        });

        $('.woocommerce-archive-layout .layout-grid').on('click', function () {
            $(this).addClass('active');
            $(this).parent().find('.layout-list').removeClass('active');
            $(this).parents('.site-main').find('ul.products').addClass('ct-products-grid').removeClass('ct-products-list');
        });
         $('.woocommerce-archive-layout .layout-list').on('click', function () {
            $(this).addClass('active');
            $(this).parent().find('.layout-grid').removeClass('active');
            $(this).parents('.site-main').find('ul.products').addClass('ct-products-list').removeClass('ct-products-grid');
        });

        $('.woocommerce-archive-layout .layout-list.active').parents('.site-main').find('ul.products').addClass('ct-products-list').removeClass('ct-products-grid');

        setTimeout(function () {
            $('.ct-grid .product_type_variable, .ct-slick-slider .product_type_variable').removeAttr('data-product_id');
            $('.ct-product-carousel6.woocommerce .woocommerce-product-inner .woocommerce-add-to--cart .button').append( '<i class="flaticon-shopping-cart-1"></i>' );
            $('.ct-product-carousel9.woocommerce .woocommerce-product-inner .woocommerce-add-to--cart .button').append( '<i class="flaticon-shopping-cart-1"></i>' );
        }, 300);

        $(".woocommerce .products").on("click", ".quantity input", function() {
            return false;
        });
        $(".woocommerce .products").on("change input", ".quantity .qty", function() {
            var add_to_cart_button = $(this).parents( ".product" ).find(".add_to_cart_button");
            add_to_cart_button.attr('data-quantity', $(this).val());
            add_to_cart_button.attr("href", "?add-to-cart=" + add_to_cart_button.attr("data-product_id") + "&quantity=" + $(this).val());
        });
        $('.flex-viewport').parents('.woocommerce-gallery-inner').addClass('flex-slider-active');

        /* Add Placeholder Review Form */
        var $text_name = $('.single-product #review_form .comment-form-author label').text();
        $('.single-product #review_form .comment-form-author input').each(function (ev) {
            if (!$(this).val()) {
                $(this).attr("placeholder", $text_name);
            }
        });
        var $text_email = $('.single-product #review_form .comment-form-email label').text();
        $('.single-product #review_form .comment-form-email input').each(function (ev) {
            if (!$(this).val()) {
                $(this).attr("placeholder", $text_email);
            }
        });
        var $text_comment = $('.single-product #review_form .comment-form-comment label').text();
        $('.single-product #review_form .comment-form-comment textarea').each(function (ev) {
            if (!$(this).val()) {
                $(this).attr("placeholder", $text_comment);
            }
        });
        

    });

})(jQuery);

document.querySelectorAll(".product_list_widget li").forEach(item => {
    let title = item.querySelector(".product-title");
    let amount = item.querySelector(".woocommerce-Price-amount");

    if (title && amount) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("product-info");
        wrapper.appendChild(title);
        wrapper.appendChild(amount);

        let link = item.querySelector("a");
        link.insertAdjacentElement("afterend", wrapper);
    }
});



jQuery( document ).on( 'qv_loader_stop', function () {
    jQuery( this ).ready( function ( $ ) {
        $('#yith-quick-view-modal .quantity').append('<span class="quantity-icon quantity-down pxl-icon--minus"></span><span class="quantity-icon quantity-up pxl-icon--plus"></span>');
        $('#yith-quick-view-modal .quantity-up').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepUp();
        });
        $('#yith-quick-view-modal .quantity-down').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepDown();
        });
    } );
} );

jQuery(document).ready(function($) {
    $('.woocommerce-tabs .tabs li a').off('click'); 
    const svg = `
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.875 14.6562C16.0312 14.8125 16.0312 15.0625 15.875 15.1875L15.1562 15.9062C15.0312 16.0625 14.7812 16.0625 14.625 15.9062L10.8438 12.125C10.7812 12.0312 10.75 11.9375 10.75 11.8438V11.4375C9.59375 12.4062 8.125 13 6.5 13C2.90625 13 0 10.0938 0 6.5C0 2.9375 2.90625 0 6.5 0C10.0625 0 13 2.9375 13 6.5C13 8.125 12.375 9.625 11.4062 10.75H11.8125C11.9062 10.75 12 10.8125 12.0938 10.875L15.875 14.6562ZM6.5 11.5C9.25 11.5 11.5 9.28125 11.5 6.5C11.5 3.75 9.25 1.5 6.5 1.5C3.71875 1.5 1.5 3.75 1.5 6.5C1.5 9.28125 3.71875 11.5 6.5 11.5Z" fill="#002C14"/>
    </svg>
  `;
  
  $('.widget_product_search button').append(svg);
});


document.addEventListener("DOMContentLoaded", function () {
    const summary = document.querySelector('.woocommerce-summary-inner');
    const tabs = document.querySelector('.woocommerce-tabs');

    if (summary && tabs) {
        const width = summary.offsetWidth;
        tabs.style.width = width + 'px';
        tabs.style.margin = '0 0 0 auto'; 
    }
});
