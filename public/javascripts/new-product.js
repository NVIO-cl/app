$(document).ready(function(){
  var attributeCount = 1;
  console.log("Document ready!");
  $('#createAttribute').click(function(e){
    var last = attributeCount-1
    var row = '<hr><div class="form-row" id="attributes['+attributeCount+']"><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeName"><strong>Atributo</strong></br></label><input class="form-control" type="text" placeholder="Ej: Talla" id="attributes['+attributeCount+'][name]" name="attributes['+attributeCount+'][name]"></div></div><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeValues"><strong>Valores</strong></br></label><input class="form-control" type="text" placeholder="Ej: S, M, L, XL" id="attributes['+attributeCount+'][values]" name="attributes['+attributeCount+'][values]"><i class="fas fa-trash text-danger" id="delete['+attributeCount+']" role="button"></div></div><div class="col-xs-2 col-md-4"></div></div>'
    $('#attributes\\['+last+'\\]').after(row)
    attributeCount++;
    e.preventDefault();
    console.log("Attribute created");

  })
})
