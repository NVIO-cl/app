window.onload = (e) => {
    valueChanged();
};

function valueChanged(){
    if($('#checkShipping').is(':checked'))
        $('#shippingInfo').show();
    else
        $('#shippingInfo').hide();

    if($('#checkInStore').is(':checked'))
        $('#shippingInfo').hide();
    else
        $('#shippingInfo').show();
}