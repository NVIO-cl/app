$(document).ready(function(){
  var attributeCount = 1;
  var subproducts = false;
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
  })

  $('#checkStock').click(function(e) {
    $('#stock').toggleClass("d-none")
  })

  $('#checkAttributes').click(function(e) {
    $('#attributes').toggleClass("d-none")
    if ($('#checkAttributes').is(":checked")) {
      $('#createProductButton').html('Generar subproductos')
      subproducts = true;
    }
    else {
      $('#createProductButton').html('Crear producto')
      subproducts = false;
    }
  })

  $('body').on('click', "[id^=delete]", function(){
    if ($(this).attr('id') == 'delete[0]') {
      alert("No puedes eliminar el primer atributo")
    }
    else {
      id = parseInt($(this).attr('id').replace("delete[", "").replace("]", ""))
      $('#attributes\\['+id+'\\]').fadeOut("fast",function(){
        $('#attributes\\['+id+'\\]').remove();
        $('#separator\\['+id+'\\]').remove();
        recalc();
        attributeCount--;
      });
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
    $('#createProductButton').addClass("disabled").attr("disabled", true);
    var hasEmptyData = false;
    e.preventDefault();
    if ($('#productName').val() == "") {
      $('#productName').addClass("is-invalid")
      hasEmptyData=true;
    }
    else {
      $('#productName').removeClass("is-invalid")
      $('#productName').addClass("is-valid")
    }
    if ($('#productPrice').val() == "") {
      $('#productPrice').addClass("is-invalid")
      hasEmptyData=true;
    }
    else {
      $('#productPrice').removeClass("is-invalid")
      $('#productPrice').addClass("is-valid")
    }
    if (subproducts) {
      //Check if subproducts are filled with data
      var $attributes = $("[id$=\\[name\\]]");
      $attributes.each((index) => {
        if ($('#attributes\\['+index+'\\]\\[name\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-invalid')
          hasEmptyData=true;
        }
        else {
          $('#attributes\\['+index+'\\]\\[name\\]').removeClass('is-invalid')
          $('#attributes\\['+index+'\\]\\[name\\]').addClass('is-valid')
        }
        if ($('#attributes\\['+index+'\\]\\[values\\]').val()=="") {
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-invalid')
          hasEmptyData=true;
        }
        else {
          $('#attributes\\['+index+'\\]\\[values\\]').removeClass('is-invalid')
          $('#attributes\\['+index+'\\]\\[values\\]').addClass('is-valid')
        }
      });
    }
    if (!hasEmptyData) {
      if (subproducts) {
        $('#createProductButton').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generando...')
        generateSubproducts();
      }
      else {
        $('#createProductButton').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...')
        $('#createProduct').submit()
      }
    }
    else {
      console.log("EMPTY DATA WARN");
      $('#createProductButton').removeClass("disabled").attr("disabled", false);
    }
  })

  function generateSubproducts(){
    console.log("GENERATING SUBPRODUCTS");
    var productPrice = $('#productPrice').val()
    var subproducts = [];
    var attributeNames = [];
    $("[id$=\\[name\\]]").each(function(index){
      attributeNames.push($('#attributes\\['+index+'\\]\\[name\\]').val())
      var values = $('#attributes\\['+index+'\\]\\[values\\]').val().split(",");
      values.forEach((item, i) => {
        values[i] = item.trim()
      });

      subproducts.push(values);
    })
    console.log(attributeNames);
    console.log(subproducts);

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

    var subproductList = cartesianProduct(subproducts);
    subproductList.forEach((subproduct, i) => {
      var name = $('#productName').val()
      console.log(subproduct);
      subproduct.forEach((item, i) => {
        name = name.concat(" ", attributeNames[i], " ", item);
      });
      console.log(name);
      var card = `
      <div class="col-xs-4 col-sm-4 col-md-4 col-lg-4" id="subproductCard[${i}]">
        <div class="card shadow mb-3">
          <div class="card-header py-3">
            <p class="text-primary m-0 font-weight-bold">${name}</p>
          </div>
          <div class="card-body" id="subproduct[${i}]">
            <input type="hidden" id="subproduct[${i}][fullName]" name="subproduct[${i}][fullName]" value="${name}">
              <div class="form-row">
                <div class="col-xs-2 col-sm-12 col-md-12">
                  <div class="form-group">
                    <label for="productPrice"><strong>Precio</strong></label>
                    <input class="form-control" id="subproduct[${i}][price]" name="subproduct[${i}][price]" type="number" placeholder="Ej: 8000" value="${productPrice}">
                  </div>
                  <div class="form-group">
                    <label for="productStock"><strong>Stock</strong><br></label>
                    <input class="form-control" id="subproduct[${i}][stock]" name="subproduct[${i}][stock]" type="number" placeholder="Ej: 25">
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      `
      $('#subproductForms').append(card)
    });
    $('#createProductButton').addClass("d-none").attr("disabled", false);
  }
})
