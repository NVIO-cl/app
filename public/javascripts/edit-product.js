var attributes=[]
var productName = ""
var subCount = 0
var oldReturning = []
let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
$(document).ready(function(){

  //Get the original attributes, values and product name
  $.each($('[id^=attributes][id $=\\[name\\]]'), function(key,value){
    attributes[key] = {
      name: $(value).val(),
      attributes: $("[id^=attributes\\["+key+"\\]\\[values\\]]").val().split(',')
    }
  })
  productName = $("#productName").val()
  subCount = $("[id^=subproductCard]").length

  // Check if any subproduct has an attribute value that is not in the list
  $.each($("[id^=subproductCard]"), function(key,value){
    $.each($(value).find($('[id$=\\[attribute\\]]')), function(i,item){
      //Check for each attribute
      if (!attributes[i].attributes.includes($(item).val())) {
        $(value).children().css("opacity","0.5")
        $(value).find('input').attr('readonly', true)
      }
    })
  })

  // If the product name is changed
  $("#productName").on('input',function(e){
    if ($(this).val() == "") {
      $(this).addClass('is-invalid')
      $("#saveChangesButton").attr('readonly','readonly')
    }
    else {
      $(this).removeClass('is-invalid')
      $("#saveChangesButton").attr('readonly',false)
    }
    $("[id*='mainName']").text($("#productName").val())
  })

  // If any stock is changed
  $(document).on('input',"[id$=\\[stock\\]]", function(e){
    newstock = 0;
    for (var item of $("[id$=\\[stock\\]]")) {
      if (!isNaN(parseInt($(item).val()))) {
        newstock += parseInt($(item).val());
      }
    }
    $("#productStock").val(newstock);
  })

  // If any attribute values is changed
  $("[id$=\\[values\\]]").on('input', function(e){
    var newAttributes = $(this).val().split(",")
    newAttributes.forEach((item, i) => {
      if (item.trim() == "") {
        newAttributes.splice(i,1)
      }
      else {
        newAttributes[i] = item.trim()
      }
    });
    if (findDuplicates(newAttributes).length > 0) {
      $(this).addClass('is-invalid')
      $(this).next().text("No pueden existir atributos duplicados")
      $("#saveChangesButton").attr('readonly','readonly')
    }
    else{
      $(this).removeClass('is-invalid')
      $(this).next().text("")
      $("#saveChangesButton").attr('readonly',false)
    }
    //Compare with existing attributes
    var attrid = parseInt($(this).attr('id').replace('][values]','').replace('attributes[',''))
    missingList = attributes[attrid].attributes.filter(function(val) {
      return newAttributes.indexOf(val) == -1;
    });
    newList = newAttributes.filter(function(val) {
      return attributes[attrid].attributes.indexOf(val) == -1;
    });
    $.each($("[id^=subproductCard]"), function(key,value){
      $(value).children().css("opacity","1")
      $(value).find('input').attr('readonly', false)
      $.each($(value).find($('[id$=\\[attribute\\]]')), function(i,item){
        //Check for each attribute
        if (!attributes[i].attributes.includes($(item).val())) {
          $(value).children().css("opacity","0.5")
          $(value).find('input').attr('readonly', true)
        }
      })
    })
    if (missingList.length > 0) {
        missingList.forEach((item, i) => {
          $.each($('[id$=\\[attribute\\]\\['+attrid+'\\]\\[value\\]]:contains("'+item+'")'),function(key,value){
            card = $(value).parent().parent()
            $(card).find('input').attr('readonly', true)
            $(card).css("opacity","0.5")
          })
        });
    }
    $.each($("[id^=subproductCard]"), function(key,value){
      console.log("====ITEM====");
      $.each($(value).find($('[id$=\\[attribute\\]]')), function(i,item){
        console.log("ATTRIBUTE " +i+ " " + $(item).val());
        //Check for each attribute
        if (newAttributes.includes($(item).val())) {
          $(value).children().css("opacity","1")
          $(value).find('input').attr('readonly', false)
          if (!attributes[i].attributes.includes($(item).val())) {
            newList = newList.filter(val=> val !== $(item).val())
            if(oldReturning.indexOf($(item).val()) === -1) {
              oldReturning.push($(item).val());
            }
          }
        }
      })
    })
    if (newList.length > 0) {
      $("#saveChangesButton").addClass('d-none')
      $("#createNewSubs").removeClass('d-none')
    }
    else {
      $("#saveChangesButton").removeClass('d-none')
      $("#createNewSubs").addClass('d-none')
    }
    console.log(newAttributes);
    $.each($("[id^=subproductCard]"), function(key,value){
      $.each($(value).find($('[id$=\\[attribute\\]]')), function(i,item){
      })
    })
  })

  // If any attribute name is changed
  $('[id ^=attributes][id $=\\[name\\]]').on('input', function(e){
    var index = parseInt($(this).attr('id').replace('attributes[','').replace('][name]',''));
    $('[id$=\\[attribute\\]\\['+index+'\\]\\[name\\]]').text($(this).val())
    var attributes = []
    $('[id ^=attributes][id $=\\[name\\]]').each(function(){
      attributes.push($(this).val())
    })
    if (findDuplicates(attributes).length > 0) {
      $(this).addClass('is-invalid')
      $(this).next().text("No pueden existir nombres de atributos duplicados")
      $("#saveChangesButton").attr('readonly','readonly')

    }
    else if($(this).val()==""){
      $(this).addClass('is-invalid')
      $(this).next().text("El nombre de atributo no puede estar vacío")
      $("#saveChangesButton").attr('readonly','readonly')
    }
    else {
      $(this).removeClass('is-invalid')
      $(this).next().text("")
      $("#saveChangesButton").attr('readonly',false)
    }
  });

  // If "Generar nuevos subproductos is clicked"
  $("#createNewSubs").on('click',function(e){
    e.preventDefault()
    // Filter the new attributes
    var ogList = []
    attributes.forEach((item, i) => {
      ogList[i] = item.attributes
    });
    console.log("OG LIST:");
    console.log(ogList);
    newList = []
    newFilter = []
    $.each($("[id$=\\[values\\]]"),function(key,value){
      newList[key] = $(value).val().split(",")
      newList[key].forEach((item, i) => {
        newList[key][i] = item.trim();

      });
    });
    console.log("NEW LIST:");
    console.log(newList);
    // Check if any new value is already a readonly subproduct


    newList.forEach((listItem, listKey) => {
      oldReturning.forEach((item, i) => {
        newList[listKey] = newList[listKey].filter(val=> val !== item)
      });
    });
    console.log(newList);


    var ogSubproducts = cartesianProduct(ogList);
    var newSubproductList = cartesianProduct(newList);
    var toCreate = []
    // Generate new combinations
    newSubproductList.forEach((newSubItem, newSubIndex) => {
      var createIt = true
      ogSubproducts.forEach((ogSubItem, ogSubIndex) => {
        if (arrayEquals(newSubItem,ogSubItem)) {
          createIt = false
        }
      });
      if (createIt){
        // Set only the new ones
        toCreate.push(newSubItem)
      }
    });
    newsubArray = []
    var oldSubCount = subCount
    toCreate.forEach((item, i) => {
      var sp = i + oldSubCount
      newsubArray = {}
      newsubArray.productName = productName
      item.forEach((attribute, n) => {
        newsubArray.productName = newsubArray.productName + " " + attributes[n].name + " " + attribute
      });
      // Create the card

      var card = `
      <div class="col-xs-4 col-sm-4 col-md-4 col-lg-4" id="subproductCard[${sp}]">
        <div class="card shadow mb-3" style="opacity: 1;">
          <div class="card-header py-3">
            <p class="text-primary m-0 font-weight-bold d-inline" id="subproduct[${sp}][mainName]">${productName}</p>
      `
      item.forEach((attribute, n) => {
        card = card + `
        <p class="text-primary m-0 font-weight-bold d-inline" id="subproduct[${sp}][attribute][${n}][name]">${attributes[n].name}</p>
        <input type="hidden" name="subproduct[${sp}][attribute][${n}][name]" id="subproduct[${sp}][attribute][${n}][name]" value="${attributes[n].name}">
        <p class="text-primary m-0 font-weight-bold d-inline" id="subproduct[${sp}][attribute][${n}][value]">${attribute}</p>
        <input type="hidden" name="subproduct[${sp}][attribute][${n}][attribute]" id="subproduct[${sp}][attribute][${n}][attribute]" value="${attribute}">
        `
      });
      card = card + `
          </div>
          <div class="card-body" id="subproduct[${sp}]">
            <input type="hidden" id="subproduct[${sp}][name]" name="subproduct[${sp}][name]" value="${newsubArray.productName}">
            <div class="form-row">
              <div class="col-xs-2 col-sm-12 col-md-12">
                <div class="form-group">
                  <label for="productPrice"><strong>Precio</strong></label>
                  <input class="form-control" id="subproduct[${sp}][price]" name="subproduct[${sp}][price]" type="number">
                </div>
                <div class="form-group" id="subproduct[${sp}][stockGroup]">
                  <label for="productStock"><strong>Stock</strong><br></label>
                  <input class="form-control" id="subproduct[${sp}][stock]" name="subproduct[${sp}][stock]" type="number">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      `
      $('#subproductForms').append(card)
      subCount++
    });
    newList.forEach((item, i) => {
      attributes[i].attributes = item
    });
    $("#saveChangesButton").removeClass('d-none')
    $("#createNewSubs").addClass('d-none')
  })
})

function cartesianProduct(arr) {
  return arr.reduce(function(a,b){
    return a.map(function(x){
      return b.map(function(y){
        return x.concat([y]);
      })
    }).reduce(function(a,b){ return a.concat(b) },[])
  }, [[]])
}

// https://masteringjs.io/tutorials/fundamentals/compare-arrays
function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}
