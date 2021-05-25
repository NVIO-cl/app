$(document).ready(function(){
  var attributeCount = 1;
  var subproducts = false;
  var regenExists = false;
  $('#createAttribute').click(function(e){

    var last = attributeCount-1
    var row = `
    <hr id="separator[${attributeCount}]">
    <div class="form-row" id="attributes[${attributeCount}]">
      <div class="col-xs-2 col-md-4">
        <div class="form-group">
          <label for="attributeName"><strong>Atributo</strong></br></label>
          <input class="form-control" type="text" placeholder="Ej: Talla" id="attributes[${attributeCount}][name]" name="attributes[${attributeCount}][name]">
          <div class="invalid-feedback">El nombre del atributo no puede estar vacío</div>
        </div>
      </div>
      <div class="col-xs-2 col-md-4">
        <div class="form-group">
          <label for="attributeValues"><strong>Valores</strong></br></label>
          <input class="form-control" type="text" placeholder="Ej: S, M, L, XL" id="attributes[${attributeCount}][values]" name="attributes[${attributeCount}][values]">
          <div class="invalid-feedback">El atributo debe tener al menos un valor</div>
        </div>
      </div>
      <div class="col-xs-2 col-sm-12 text-center text-md-left p-2 col-md-4 col-lg-4 mt-md-4 mt-lg-4"><div class="form-group">
        <a class="btn btn-primary" id= "delete[${attributeCount}]" type="button" style="background: #0861ff; border: #0d87f0;"><i class="fa fa-trash" role="button"></i>&nbsp;Borrar</a>
      </div>
    </div>
    `;
    $('#attributes\\['+last+'\\]').after(row)
    attributeCount++;
    e.preventDefault();
  });

  $('#checkStock').click(function(e) {
    if (!$('#checkAttributes').is(":checked")) {
      if ($('#checkStock').is(":checked")) {
        $('#stock').removeClass("d-none")
      }
      else {
        $('#stock').addClass("d-none")
      }
    }
    else {
      if ($('#checkStock').is(':checked')) {
        $("[id$='stockGroup\\]']").each(function(){
          $(this).removeClass("d-none")
        })
      }
      else {
        $("[id$='stockGroup\\]']").each(function(){
          $(this).addClass("d-none")
        })
      }
    }

  });

  $('#checkAttributes').click(function(e) {
    $('#attributes').toggleClass("d-none");
    if ($('#checkAttributes').is(":checked")) {
      $("#priceLabel").html("<b>Precio base</b>");
      $('#createProductButton').html('Generar subproductos');
      if($('#checkStock').is(":checked")){
        $('#stock').addClass("d-none");
      }
      subproducts = true;
    }
    else {
      $("#priceLabel").html("<b>Precio</b>")
      $('#createProductButton').html('Crear producto');
      if ($('#checkStock').is(":checked")) {
        $('#stock').removeClass("d-none");
      }
      else {
        $('#stock').addClass("d-none");
      }
      subproducts = false;

    }
  })

  $('body').on('click', "[id^=delete]", function(){
    if ($(this).attr('id') == 'delete[0]') {
      alert("No puedes eliminar el primer atributo")
    } else {
      id = parseInt($(this).attr('id').replace("delete[", "").replace("]", ""))
      $('#attributes\\['+id+'\\]').fadeOut("fast",function(){
        $('#attributes\\['+id+'\\]').remove();
        $('#separator\\['+id+'\\]').remove();
        recalc();
        attributeCount--;
      });
      // Make the "regen attributes" button exists, plain jquery can't handle 'on("remove")'
      if($('#createProductButton').hasClass("d-none")){ // this means createProductButton is disabled
        if(!regenExists){ // Check to see if the regenerate button exists
          $("<br><button id='regenerateAttributes' class='btn btn-primary btn-sm' style='background: #12c4f2; border: #12c4f2; margin-top: 10px;'>Actualizar Atributos</button>").appendTo($('#createAttribute').parent());
          regenExists = !regenExists;
        }
        // TODO: Notify the user that they have changes pending update if they click "submit" while the "regenerateAttributes" button still exists
      }
    }
  })

  function recalc(){
    $("[id$=\\[name\\]]").each(function(index){
      var item = parseInt($(this).attr('id').replace("attributes[", "").replace("][name]", ""));
      if (item != index) {
        $('#attributes\\['+item+'\\]\\[name\\]').attr('name', 'attributes['+index+'][name]')
        $('#attributes\\['+item+'\\]\\[values\\]').attr('name', 'attributes['+index+'][values]')
        $('#separator\\['+item+'\\]').attr('id', 'separator['+index+']')
        $('#attributes\\['+item+'\\]').attr('id', 'attributes['+index+']')
        $('#attributes\\['+item+'\\]\\[name\\]').attr('id', 'attributes['+index+'][name]')
        $('#attributes\\['+item+'\\]\\[values\\]').attr('id', 'attributes['+index+'][values]')
        $('#delete\\['+item+'\\]').attr('id', 'delete['+index+']')
      }
    })
  }

  $('#createProductButton').click(function(e){
    //$('#createProductButton').addClass("disabled").attr("disabled", true);
    var hasEmptyData = false;
    var hasNegatives = false;
    e.preventDefault();
    if ($('#productName').val() == "") {
      $('#productName').addClass("is-invalid")
      hasEmptyData=true;
    } else {
      $('#productName').removeClass("is-invalid")
      $('#productName').addClass("is-valid")
    }

    if ($('#productPrice').val() == "") {
      $('#productPrice').addClass("is-invalid")
      hasEmptyData=true;
    } else if (parseInt($('#productPrice').val()) <= 0) {
      $('#productPrice').addClass("is-invalid")
      hasNegatives=true;
    } else {
      $('#productPrice').removeClass("is-invalid")
      $('#productPrice').addClass("is-valid")
    }

    if ($('#checkStock').is(":checked") && !$('#checkAttributes').is(":checked")) {
      if ($('#productStock').val() == "") {
        $('#productStock').addClass("is-invalid")
        hasEmptyData=true;
      } else if (parseInt($('#productStock').val()) <= 0) {
        $('#productStock').addClass("is-invalid")
        hasNegatives=true;
      } else {
        $('#productStock').removeClass("is-invalid")
        $('#productStock').addClass("is-valid")
      }
    }


    if (subproducts) {
      //Check if subproducts are filled with data
      var $attributes = $("[id$=\\[name\\]]");
      $attributes.each((index) => {
        if ($('#attributes\\['+index+'\\]\\[name\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-invalid')
          hasEmptyData=true;
        } else {
          $('#attributes\\['+index+'\\]\\[name\\]').removeClass('is-invalid')
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-valid')
        }

        if ($('#attributes\\['+index+'\\]\\[values\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-invalid')
          hasEmptyData=true;
        } else {
          $('#attributes\\['+index+'\\]\\[values\\]').removeClass('is-invalid')
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-valid')
        }
      });
    }
    if (!hasEmptyData && !hasNegatives) {
      if (subproducts) {
        $('#createProductButton').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generando...')
        generateSubproducts();
        // $('#prodContainer').after(` // Conflicts with #subproductForms def in pug
        //   <div class="container-fluid">
        //     <div class="col-lg-12" style="padding-left: 0px; padding-right: 0px;">
        //       <div class="row" id="subproductForms">
        //       </div>
        //     </div>
        //   </div>
        // `)
      } else {
        $('#createProductButton').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...')
        $('#createProduct').submit()
      }
    } else {
      $('#createProductButton').removeClass("disabled").attr("disabled", false);
    }


  })

  // Show the "update attributes" button if there are changes in the attributes
  $('#attributes').on('change', function(){
    if($('#createProductButton').hasClass("d-none")){ // this means createProductButton is disabled
      if(!regenExists){ // Check to see if the regenerate button exists
        $("<br><button id='regenerateAttributes' class='btn btn-primary btn-sm' style='background: #12c4f2; border: #12c4f2; margin-top: 10px;'>Actualizar Atributos</button>").appendTo($('#createAttribute').parent());
        regenExists = !regenExists;
      }
      // TODO: Notify the user that they have changes pending update if they click "submit" while the "regenerateAttributes" button still exists
    }
  });

  // Generate new attributes
  $(document).on('click', '#regenerateAttributes', function(e){
    // Brutish solution: Once the button is clicked, clear subproducts, then generate, then hide the button
    // The cleaner way to do this is to check for differences, keep a list of the IDs that exist, then compare it to the list that would be generated and remove/add cards accordingly
    e.preventDefault();
    // validate form
    var hasEmptyData = false;
    if ($('#productName').val() == "") {
      $('#productName').addClass("is-invalid");
      hasEmptyData=true;
    } else {
      $('#productName').removeClass("is-invalid");
      $('#productName').addClass("is-valid");
    }
    if ($('#productPrice').val() == "") {
      $('#productPrice').addClass("is-invalid");
      hasEmptyData=true;
    } else {
      $('#productPrice').removeClass("is-invalid");
      $('#productPrice').addClass("is-valid");
    }
    if (subproducts) {
      //Check if subproducts are filled with data
      var $attributes = $("[id$=\\[name\\]]");
      $attributes.each((index) => {
        if ($('#attributes\\['+index+'\\]\\[name\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-invalid');
          hasEmptyData=true;
        }
        else {
          $('#attributes\\['+index+'\\]\\[name\\]').removeClass('is-invalid');
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-valid');
        }
        if ($('#attributes\\['+index+'\\]\\[values\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-invalid');
          hasEmptyData=true;
        }
        else {
          $('#attributes\\['+index+'\\]\\[values\\]').removeClass('is-invalid');
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-valid');
        }
      });
    }
    if (!hasEmptyData) {
      // remove extraneous elements
      $('#subproductForms').empty();
      generateSubproducts();
      $('#regenerateAttributes').remove();
      $('#createSubproducts').remove();
      $('br').remove();
      regenExists = !regenExists;
      // TODO: Implement a cleaner way to do this, as described at the beginning of this function
    } else {
      // something's empty, do nothing
    }
  });

  function generateSubproducts(){
    var productPrice = $('#productPrice').val();
    var subproducts = [];
    var attributeNames = [];
    $("[id$=\\[name\\]]").each(function(index){
      attributeNames.push($('#attributes\\['+index+'\\]\\[name\\]').val())
      var values = $('#attributes\\['+index+'\\]\\[values\\]').val().split(",");
      values.forEach((item, i) => {
        values[i] = item.trim();
      });

      subproducts.push(values);
    })

    // https://stackoverflow.com/a/36234242
    function cartesianProduct(arr) {
      return arr.reduce(function(a,b){
        return a.map(function(x){
          return b.map(function(y){
            return x.concat([y]);
          })
        }).reduce(function(a,b){ return a.concat(b) },[])
      }, [[]])
    }
    var subproductsCount = 0;
    var subproductList = cartesianProduct(subproducts);
    subproductList.forEach((subproduct, i) => {
      var attributes = []
      var name = $('#productName').val()
      subproductsCount++
      subproduct.forEach((item, i) => {
        name = name.concat(" ", attributeNames[i], " ", item);
        attributes.push({
          name:attributeNames[i],
          value: item
        })
      });
      var card = `
      <div class="col-xs-4 col-sm-4 col-md-4 col-lg-4" id="subproductCard[${i}]">
        <div class="card shadow mb-3">
          <div class="card-header py-3">
            <p class="text-primary m-0 font-weight-bold">${name}</p>
          </div>
          <div class="card-body" id="subproduct[${i}]">
            <input type="hidden" id="subproduct[${i}][name]" name="subproduct[${i}][name]" value="${name}">
              <div class="form-row">
                <div class="col-xs-2 col-sm-12 col-md-12">
                  <div class="form-group">
                    <label for="productPrice"><strong>Precio</strong></label>
                    <input class="form-control" id="subproduct[${i}][price]" name="subproduct[${i}][price]" type="number" placeholder="Ej: 8000" value="${productPrice}" >
                    <div class="invalid-feedback">El precio no puede estar vacío y debe ser mayor a cero</div>
                  </div>
                  <div class="form-group" id="subproduct[${i}][stockGroup]">
                    <label for="productStock"><strong>Stock</strong><br></label>
                    <input class="form-control" id="subproduct[${i}][stock]" name="subproduct[${i}][stock]" type="number" placeholder="Ej: 25" >
                    <div class="invalid-feedback">El stock no puede estar vacío y debe ser mayor a cero</div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      `
      $('#subproductForms').append(card)
      attributes.forEach((attribute, n) => {
        var attributesHtml = `
        <input type="hidden" id="subproduct[${i}][attributes][${n}][name]" name="subproduct[${i}][attributes][${n}][name]" value="${attribute.name}">
        <input type="hidden" id="subproduct[${i}][attributes][${n}][value]" name="subproduct[${i}][attributes][${n}][value]" value="${attribute.value}">
        `
        $('[id^=subproduct\\['+i+'\\]\\[name\\]').append(attributesHtml)
      });

    });
    $('#createProductButton').addClass("d-none").attr("disabled", false);
    if ($('#checkStock').is(":checked")) {
    }
    else {
      for (var i = 0; i < subproductsCount; i++) {
        $('#subproduct\\['+i+'\\]\\[stockGroup\\]').addClass('d-none')

      }
    }
    $('#subproductForms').after(`
      <div class="form-group text-center">
        <button class="btn btn-primary btn-sm" id="createSubproducts" style="background: #12c4f2; border: #12c4f2; margin-top: 10px;"">Guardar Subproductos</button>
      </div>
    `);

    $(document).on("click", "#createSubproducts", function(e) {
      e.preventDefault();
      var hasEmptyData = false;
      for (var i = 0; i < subproductsCount; i++)  {

        if ($('input[id="subproduct['+i+'][price]"]').val() == "" || $('input[id="subproduct['+i+'][price]"]').val() === undefined){
          $('input[id="subproduct['+i+'][price]"]').addClass("is-invalid");
          hasEmptyData=true;
        } else if (parseInt($('input[id="subproduct['+i+'][price]"]').val()) <= 0) {
          $('input[id="subproduct['+i+'][price]"]').addClass("is-invalid");
          hasEmptyData=true;
        } else {
          $('input[id="subproduct['+i+'][price]"]').removeClass("is-invalid");
          $('input[id="subproduct['+i+'][price]"]').addClass("is-valid");
        }

        if ($('#checkStock').is(":checked")) {
          if ($('input[id="subproduct['+i+'][stock]"]').val() == "" || $('input[id="subproduct['+i+'][stock]"]').val() === undefined){
            $('input[id="subproduct['+i+'][stock]"]').addClass("is-invalid");
            hasEmptyData=true;
          } else if (parseInt($('input[id="subproduct['+i+'][stock]"]').val()) <= 0) {
            $('input[id="subproduct['+i+'][stock]"]').addClass("is-invalid");
            hasEmptyData=true;
          } else {
            $('input[id="subproduct['+i+'][stock]"]').removeClass("is-invalid");
            $('input[id="subproduct['+i+'][stock]"]').addClass("is-valid");
          }
        }
      }
      if (hasEmptyData == false){
        $('#createProduct').submit()
      }else{
        // Something went wrong, do nothing
      }
    });
  }
});
