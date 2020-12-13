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

$("#newOrder").submit(function (e) {
  console.log("New order submitted!");
  $("#submit").attr("disabled", true);
})
