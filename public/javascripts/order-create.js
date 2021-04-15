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
      var price = $(this).val()
      var quantity = $('#items\\['+index+'\\]\\[quantity\\]').val()
      var subtotal = price * quantity;
      $('#items\\['+index+'\\]\\[subtotal\\]').html("$ " + subtotal)
      total = total + subtotal
    })
    var shippingCost = 0
    if ($('#shippingCost').val() != ""){
      shippingCost = $('#shippingCost').val();
    }

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
  var autocompleteTimer;
  $('#items\\[0\\]\\[product\\]').keyup(async function(){
    clearTimeout(autocompleteTimer);
    var caller = this
    autocompleteTimer = setTimeout(async function(){
      console.log("Firing up search!");
      await getProducts($(caller).val(), caller)
    }, 500)
  });
});

async function getProducts(name, location){
  // Get the autocomplete list Div
  var listDiv = $(location).next().children();
  //Clear the div
  $(listDiv).html("");
  //Set a "Searching"
  $(listDiv).html('<li class="list-group-item"><div class="spinner-border spinner-border-sm" role="status"></div></li>')
  // Get the products that match the query
  var arr = { name:name};
  $.ajax({
    url: '/inventory/searchProduct',
    type: 'POST',
    data: JSON.stringify(arr),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    async: true,
    success: function(msg) {
      $(listDiv).html("");
      // Iterate through the results
      msg.forEach((item, i) => {
        var stockColor = "badge-secondary"
        //If the stock is undefined, show N/A
        if (item._source.stock === undefined) {
          item._source.stock = "N/A"
        }
        //Stock amount cases
        if (item._source.stock > 5) {
          stockColor = "badge-success"
        }
        else if (item._source.stock <= 5 && item._source.stock > 0) {
          stockColor = "badge-warning"
        }
        else if (item._source.stock == 0){
          stockColor = "badge-danger"
        }
        listDiv.append(`
          <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            ${item._source.name}
            <span class="badge ml-2 ${stockColor}">${item._source.stock}</span>
          </button>
          `)
        console.log(item);
      });
    }
  })
}
