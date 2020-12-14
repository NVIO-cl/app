window.onload = (e) => {
    valueChanged();
};

function valueChanged(){
    if($('#checkShipping').is(':checked')){
      // Shipping is mandatory
      $('#shippingInfo').show();
      $('#pickupInfo').hide();
      $('#locality').attr('required', true);
      $('#shippingMethod').attr('required', true);
      $('#shippingCost').attr('required', true);
      $('#pickupAddress').attr('required', false);
    }
    if($('#checkInStore').is(':checked')){
        // Shipping is NOT mandatory
        $('#shippingInfo').hide();
        $('#pickupInfo').show();
        $('#locality').attr('required', false);
        $('#shippingMethod').attr('required', false);
        $('#shippingCost').attr('required', false);
        $('#pickupAddress').attr('required', true);
    }
}

/*
$("#newOrder").submit(function (e) { // This works but doesn't give the user any feedback
  if($('#checkCash').is(':checked') && $('#checkShipping').is(':checked')){ // No cash AND shipping
        e.preventDefault();
  } else {
      $("#submit").attr("disabled", true);
  }
});
*/