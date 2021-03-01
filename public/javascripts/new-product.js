$(document).ready(function(){
  var attributeCount = 1;
  console.log("Document ready!");
  $('#createAttribute').click(function(e){
    var last = attributeCount-1
    var row = '<hr><div class="form-row" id="attributes['+attributeCount+']"><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeName"><strong>Atributo</strong></br></label><input class="form-control" type="text" placeholder="Ej: Talla" id="attributes['+attributeCount+'][name]" name="attributes['+attributeCount+'][name]"></div></div><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeValues"><strong>Valores</strong></br></label><input class="form-control" type="text" placeholder="Ej: S, M, L, XL" id="attributes['+attributeCount+'][values]" name="attributes['+attributeCount+'][values]"></div></div><div class="col-xs-2 col-sm-12 text-center text-md-left p-2 col-md-4 col-lg-4 mt-md-4 mt-lg-4"><div class="form-group"><a class="btn btn-primary" id="borrar" type="button" style="background: #0861ff; border: #0d87f0;"><i class="fa fa-trash" id= "delete['+attributeCount+']" role="button"></i>&nbsp;Borrar</a></div></div>'
    $('#attributes\\['+last+'\\]').after(row)
    attributeCount++;
    e.preventDefault();
    console.log("Attribute created");
  })

  $('#checkStock').click(function(e) {
    $('#stock').toggleClass("d-none")
  })

  $('#checkAttributes').click(function(e) {
    $('#attributes').toggleClass("d-none")
  })
})

