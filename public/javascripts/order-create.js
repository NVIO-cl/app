window.onload = (e) => {

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

$(document).ready(function(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();
  if(dd<10){
        dd='0'+dd
    }
    if(mm<10){
        mm='0'+mm
    }
today = yyyy+'-'+mm+'-'+dd;
  $('#pickupDate').attr('min', today)
  $('#shippingDate').attr('min', today)


  valueChanged();
  $(window).keydown(function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });
  var count = 1;
  $('#clickAdd').click(function(e){
    var last = count-1
    var row = '<tr id="items['+count+']"><td><input class="form-control" id="items['+count+'][product]" name="items['+count+'][product]" type="text" required></td><td><input class="form-control" id="items['+count+'][price]" name="items['+count+'][price]" type="number" style="width: 100px;" min="1" required></td><td><input class="form-control" id="items['+count+'][quantity]" name="items['+count+'][quantity]" type="number" min="1" style="width: 100px;" required></td><td><div id="items['+count+'][subtotal]" class="d-inline">$ 0 </div><i class="fas fa-trash d-inline float-right text-danger" id="delete['+count+']" role="button"></td></tr>'
    $('#items\\['+last+'\\]').after(row)
    count++;
    e.preventDefault();
  });

  $('body').on('change', "[id$=\\[price\\]]", function(){
    recalc();
  })

  $('body').on('change', "[id$=\\[quantity\\]]", function(){
    recalc();
  })

  function recalc(){
    var total = 0;
    $("[id$=\\[price\\]]").each(function(index){
      var item = parseInt($(this).attr('id').replace("items[", "").replace("][price]", ""));
      if (item != index) {
        $('#items\\['+item+'\\]\\[product\\]').attr('name', 'items['+index+'][product]')
        $('#items\\['+item+'\\]\\[price\\]').attr('name', 'items['+index+'][price]')
        $('#items\\['+item+'\\]\\[quantity\\]').attr('name', 'items['+index+'][quantity]')

        $('#items\\['+item+'\\]').attr('id', 'items['+index+']')
        $('#items\\['+item+'\\]\\[product\\]').attr('id', 'items['+index+'][product]')
        $('#items\\['+item+'\\]\\[price\\]').attr('id', 'items['+index+'][price]')
        $('#items\\['+item+'\\]\\[quantity\\]').attr('id', 'items['+index+'][quantity]')



        $('#items\\['+item+'\\]\\[subtotal\\]').attr('id', 'items['+index+'][subtotal]')
        $('#delete\\['+item+'\\]').attr('id', 'delete['+index+']')

      }
      var price = $(this).val().replace('.',"")
      console.log(price);
      var quantity = $('#items\\['+index+'\\]\\[quantity\\]').val().replace('.',"")
      var subtotal = price * quantity;
      $('#items\\['+index+'\\]\\[subtotal\\]').html("$ " + subtotal)
      total = total + subtotal
    })
    var shippingCost = 0
    if ($('#shippingCost').val() != ""){
      shippingCost = $('#shippingCost').val().replace('.',"");
    }

    $("#totalProd").html("$ " + total);
    total = parseInt(total) + parseInt(shippingCost);
    $("#totalFin").html("$ " + total);
  }

  $('#shippingCost').change(function(){
    if ($('#shippingCost').val() == "") {
      $('#shippingCost').val(0);
    }

    $('#totalShip').html('$ ' + $('#shippingCost').val().replace('.',""))
    recalc();
  })

  $('body').on('click', "[id^=delete]", function(){
    if ($(this).attr('id') == 'delete[0]') {
      alert("No puedes eliminar el primer producto")
    }
    else {
      id = parseInt($(this).attr('id').replace("delete[", "").replace("]", ""))
      $('#items\\['+id+'\\]').fadeOut("fast",function(){
        $('#items\\['+id+'\\]').remove();
        recalc();
        count--;
      });
    }
  })
});
