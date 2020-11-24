window.onload = (e) => {
    valueChanged();
};

function valueChanged(){
    if($('#checkShipping').is(':checked')){
      console.log("Shipping is mandatory");
      $('#shippingInfo').show();
      $('#locality').attr('required', true)
      $('#shippingMethod').attr('required', true)
      $('#shippingCost').attr('required', true)
    }
    if($('#checkInStore').is(':checked')){
        console.log("Shipping is NOT mandatory");
        $('#shippingInfo').hide();
        $('#locality').attr('required', false)
        $('#shippingMethod').attr('required', false)
        $('#shippingCost').attr('required', false)
    }
}
