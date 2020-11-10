/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()
})

// Submit form when any change detected
$('.js-auto-submit').on('change', function(){
  $(this).closest('form').submit();
});
