$(document).ready(function(){
  $(window).keydown(function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });
  var count = 1;
  $('#clickAdd').click(function(e){
    var last = count-1
    var row = '<tr id="items['+count+']"><td><input class="form-control" id="items['+count+'][product]" name="items['+count+'][product]" type="text"></td><td><input class="form-control" id="items['+count+'][price]" name="items['+count+'][price]" type="number" style="width: 100px;"></td><td><input class="form-control" id="items['+count+'][quantity]" name="items['+count+'][quantity]" type="number" style="width: 100px;"></td><td><div id="items['+count+'][subtotal]">$ 0</div></td></tr>'
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
      var price = $(this).val()
      var quantity = $('#items\\['+index+'\\]\\[quantity\\]').val()

      var subtotal = price * quantity;
      $('#items\\['+index+'\\]\\[subtotal\\]').html("$ " + subtotal)
      total = total + subtotal
    })
    var shippingCost = $('#shippingCost').val()

    $("#totalProd").html("$ " + total);
    total = parseInt(total) + parseInt(shippingCost);
    $("#totalFin").html("$ " + total);
  }

  $('#shippingCost').change(function(){
    if ($('#shippingCost').val() == "") {
      $('#shippingCost').val(0);
    }

    $('#totalShip').html('$ ' + $('#shippingCost').val())
    recalc();
  })
});
