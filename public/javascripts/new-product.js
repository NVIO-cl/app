$(document).ready(function(){
  var attributeCount = 1;
  $('#createAttribute').click(function(e){
    var last = attributeCount-1
    var row = '<hr id="separator['+attributeCount+']"><div class="form-row" id="attributes['+attributeCount+']"><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeName"><strong>Atributo</strong></br></label><input class="form-control" type="text" placeholder="Ej: Talla" id="attributes['+attributeCount+'][name]" name="attributes['+attributeCount+'][name]"></div></div><div class="col-xs-2 col-md-4"><div class="form-group"><label for="attributeValues"><strong>Valores</strong></br></label><input class="form-control" type="text" placeholder="Ej: S, M, L, XL" id="attributes['+attributeCount+'][values]" name="attributes['+attributeCount+'][values]"></div></div><div class="col-xs-2 col-sm-12 text-center text-md-left p-2 col-md-4 col-lg-4 mt-md-4 mt-lg-4"><div class="form-group"><a class="btn btn-primary" id= "delete['+attributeCount+']" type="button" style="background: #0861ff; border: #0d87f0;"><i class="fa fa-trash" role="button"></i>&nbsp;Borrar</a></div></div>'
    $('#attributes\\['+last+'\\]').after(row)
    attributeCount++;
    e.preventDefault();
  })

  $('#checkStock').click(function(e) {
    $('#stock').toggleClass("d-none")
  })

  $('#checkAttributes').click(function(e) {
    $('#attributes').toggleClass("d-none")
  })

  $('body').on('click', "[id^=delete]", function(){
    if ($(this).attr('id') == 'delete[0]') {
      alert("No puedes eliminar el primer producto")
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

})
