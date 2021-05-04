var attributes=[]
$(document).ready(function(){

  //Get the original attributes and values
  $.each($('[id^=attributes][id $=\\[name\\]]'), function(key,value){
    attributes[key] = {
      name: $(value).val(),
      attributes: $("[id^=attributes\\["+key+"\\]\\[values\\]]").val().split(',')
    }
  })
  console.log("Original Attributes:");
  console.log(attributes);



  $("#productName").on('input',function(e){
    $("[id*='mainName']").text($("#productName").val())

  })

  $("[id$=\\[stock\\]]").on('input', function(e){
    newstock = 0;
    for (var item of $("[id$=\\[stock\\]]")) {
      console.log($(item).val());
      newstock += parseInt($(item).val());
    }
    $("#productStock").val(newstock);
  })

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
    let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
    if (findDuplicates(newAttributes).length > 0) {
      console.log("DUPLICATE ITEMS");
      $(this).addClass('is-invalid')
      $(this).next().text("No pueden existir atributos duplicados")
    }
    else{
      $(this).removeClass('is-invalid')
    }
    console.log(newAttributes);

  })

  $('[id ^=attributes][id $=\\[name\\]]').on('input', function(e){
    var index = parseInt($(this).attr('id').replace('attributes[','').replace('][name]',''));
    $('[id$=\\[attribute\\]\\['+index+'\\]\\[name\\]]').text($(this).val())

  })

})
