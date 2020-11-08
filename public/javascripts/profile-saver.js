$( "#nameForm" ).submit(function( event ) {
  $("#nameFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');

  if ($("#nameFormSuccess").length) {
    $("#nameFormSuccess").fadeOut()
  }

  // Stop form from submitting normally
  event.preventDefault();

  // Get some values from elements on the page:
  var $form = $( this ),
  companyName = $form.find( "input[name='companyName']" ).val()
  firstName = $form.find( "input[name='firstName']" ).val()
  lastName = $form.find( "input[name='lastName']" ).val()

  // Send the data using post
  var posting = $.post( '/profile/saveName', {
    companyName: companyName,
    firstName:firstName,
    lastName:lastName
  });

  // Put the results in a div
  posting.done(function( data ) {
    if ($("#nameFormSuccess").length) {
      $("#nameFormButton").prop('disabled', false).html('Guardar');
      $("#nameFormSuccess").fadeIn()
    }
    else {
      $("#nameFormButton").prop('disabled', false).html('Guardar');
      $("#nameFormButton").after('<div id="nameFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
      $("#nameFormSuccess").fadeIn()
    }
  });
});
