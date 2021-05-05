var attributes=[]
var productName = ""
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
  console.log("Original Attributes:");
  console.log(attributes);
  console.log("Original Name:");
  console.log(productName);

  // If the product name is changed
  $("#productName").on('input',function(e){
    $("[id*='mainName']").text($("#productName").val())
  })

  // If any stock is changed
  $("[id$=\\[stock\\]]").on('input', function(e){
    newstock = 0;
    for (var item of $("[id$=\\[stock\\]]")) {
      newstock += parseInt($(item).val());
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
    }
    else{
      $(this).removeClass('is-invalid')
        $(this).next().text("")
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
      $(value).find('input').attr('disabled', false)
    })
    if (missingList.length > 0) {
        console.log("DELETED ATTRIBUTES:");
        console.log(missingList);
        missingList.forEach((item, i) => {
          $.each($('[id$=\\[attribute\\]\\['+attrid+'\\]\\[value\\]]:contains("'+item+'")'),function(key,value){
            console.log($(value).parent().parent().parent());
            card = $(value).parent().parent()
            $(card).find('input').attr('disabled', true)
            $(card).css("opacity","0.5")
          })
        });
    }
    if (newList.length > 0) {
      console.log("NEW ATTRIBUTES:");
      console.log(newList);

      $("#saveChangesButton").addClass('d-none')
      $("#createNewSubs").removeClass('d-none')
    }
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
    }
    else if($(this).val()==""){
      $(this).addClass('is-invalid')
      $(this).next().text("El nombre de atributo no puede estar vacío")
    }
    else {
      $(this).removeClass('is-invalid')
      $(this).next().text("")
    }
  });

  // If "Generar nuevos subproductos is clicked"
  $("#createNewSubs").on('click',function(e){
    e.preventDefault()
    console.log("GENNEW");
  })

})
