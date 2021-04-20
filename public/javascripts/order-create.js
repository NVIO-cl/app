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
    var row = '<tr id="items['+count+']"><td><input class="form-control" id="items['+count+'][product]" name="items['+count+'][product]" type="text" required onfocus="focusItem(this)" onblur="hideItem(this)"><div class="invalid-feedback"> Este producto se encuentra sin stock. <a href="/inventory">Ir al inventario</a></div><div class="card mt-1 float-left shadow-sm" style="position:absolute;z-index:9999; -webkit-transform: translate3d(0,0,10px); max-width:90%; overflow:visible;"><ul class="list-group list-group-flush" id="items['+count+'][autocompleteList]"></ul></div></td><td><input class="form-control" id="items['+count+'][price]" name="items['+count+'][price]" type="number" style="width: 100px;" min="1" required></td><td><input class="form-control" id="items['+count+'][quantity]" name="items['+count+'][quantity]" type="number" min="1" style="width: 100px;" required></td><td><div id="items['+count+'][subtotal]" class="d-inline">$ 0 </div><i class="fas fa-trash d-inline float-right text-danger" id="delete['+count+']" role="button"></td></tr>'
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

  //Define the autocomplete timeout timer
  var autocompleteTimer;

  //On Key Up of inputs, start search timeout
  $(document).on('keyup', "[id$=\\[product\\]]", async function(){
    //Delete the is-valid or is-invalid class
    $(this).removeClass('is-valid');
    $(this).removeClass('is-invalid');
    //Delete the hidden input (if any)
    var itemId = $(this).attr('id').match(/\[(.*?)\]/)[1];
    $("[id$=\\["+itemId+"\\]\\[regProduct\\]]").remove()
    //Reset the timer
    clearTimeout(autocompleteTimer);
    //Get the input that called the function
    var caller = this
    //Set the timer again
    autocompleteTimer = setTimeout(async function(){
      //When the timer ends, send the search request
      await getProducts($(caller).val(), caller)
    }, 500)
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

async function focusItem(e){
  var itemId = $(e).attr('id').match(/\[(.*?)\]/)[1];
  $('[id$=\\[autocompleteList\\]]').hide()
  $('#items\\['+itemId+'\\]\\[autocompleteList\\]').show()
}

async function hideItem(e){
  /*
  setTimeout(function(){
    $(e).next().children().hide()
  }, 100)
  */
}

$(document).mouseup(function (e){
  var container = $.merge($('[id$=\\[product\\]]'), $('[id$=\\[autocompleteList\\]]'))
  var onlist = false;
  $.each(container, function(key, value) {

    if ($(value).is(e.target)) {
      onlist = true;
    }
  });
  if (!onlist) {
    $('[id$=\\[autocompleteList\\]]').hide()
  }
})

async function setProduct(e, name, price, id, stock){
  var itemId = $(e).parent().attr('id').match(/\[(.*?)\]/)[1];
  //Set the input to the correct name
  $('#items\\['+itemId+'\\]\\[product\\]').val(name)
  //Set the price to the correct one
  $('#items\\['+itemId+'\\]\\[price\\]').val(price)
  //Remove hidden ID if any
  $("[id$=\\["+itemId+"\\]\\[regProduct\\]]").remove()
  //Append the associated ID as a hidden input
  $('#items\\['+itemId+'\\]\\[product\\]').before('<input type="hidden" value="'+id+'" id="items['+itemId+'][regProduct]" name="items['+itemId+'][regProduct]">')
  //Set the product validation to green or yellow if product is out of stock
  if (stock > 0 || stock == "N/A") {
    $('#items\\['+itemId+'\\]\\[product\\]').removeClass('is-invalid')
    $('#items\\['+itemId+'\\]\\[product\\]').addClass('is-valid')
  }
  else {
    $('#items\\['+itemId+'\\]\\[product\\]').removeClass('is-valid')
    $('#items\\['+itemId+'\\]\\[product\\]').addClass('is-invalid')
  }
  //Close the list
  $('#items\\['+itemId+'\\]\\[autocompleteList\\]').hide()
  //Recalculate
  recalc()
}

async function getProducts(name, location){
  var itemId = $(location).attr('id').match(/\[(.*?)\]/)[1];
  // Get the autocomplete list Div
  var listDiv = $('#items\\['+itemId+'\\]\\[autocompleteList\\]')
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
        //Append the list
        listDiv.append(`
          <button type="button" class="list-group-item list-group-item-action" onclick="setProduct(this, '${item._source.name}', ${item._source.price}, '${item._id}', '${item._source.stock}')">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <div>${item._source.name}</div>

            </div>
            <p class="mb-1"><small>Precio: $${item._source.price} | Stock: <span class="badge ${stockColor}">${item._source.stock}</span></small></p>

          </button>
        `)
      });
    }
  })
}

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
