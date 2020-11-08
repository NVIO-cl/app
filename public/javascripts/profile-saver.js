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

$( "#contactForm" ).submit(function( event ) {
  $("#contactFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');

  if ($("#contactFormSuccess").length) {
    $("#contactFormSuccess").fadeOut()
  }

  // Stop form from submitting normally
  event.preventDefault();

  // Get some values from elements on the page:
  var $form = $( this ),
  contactNumber = $form.find( "input[name='contactNumber']" ).val()
  email = $form.find( "input[name='email']" ).val()

  // Send the data using post
  var posting = $.post( '/profile/saveContact', {
    contactNumber:contactNumber,
    email:email
  });

  // Put the results in a div
  posting.done(function( data ) {
    if ($("#contactFormSuccess").length) {
      $("#contactFormButton").prop('disabled', false).html('Guardar');
      $("#contactFormSuccess").fadeIn()
    }
    else {
      $("#contactFormButton").prop('disabled', false).html('Guardar');
      $("#contactFormButton").after('<div id="contactFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
      $("#contactFormSuccess").fadeIn()
    }
  });
});

$( "#transferForm" ).submit(function( event ) {
  $("#transferFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');

  if ($("#transferFormSuccess").length) {
    $("#transferFormSuccess").fadeOut()
  }

  // Stop form from submitting normally
  event.preventDefault();

  // Get some values from elements on the page:
  var $form = $( this ),
  companyTurn = $form.find( "input[name='companyTurn']" ).val()
  companyRut = $form.find( "input[name='companyRut']" ).val()
  paymentDataName = $form.find( "input[name='paymentDataName']" ).val()
  paymentDataRut = $form.find( "input[name='paymentDataRut']" ).val()
  paymentDataBank = $form.find( "input[name='paymentDataBank']" ).val()
  paymentDataAccType = $form.find( "input[name='paymentDataAccType']" ).val()
  paymentDataAccNum = $form.find( "input[name='paymentDataAccNum']" ).val()
  paymentDataEmail = $form.find( "input[name='paymentDataEmail']" ).val()

  // Send the data using post
  var posting = $.post( '/profile/saveTransfer', {
    companyTurn:companyTurn,
    companyRut:companyRut,
    paymentDataName:paymentDataName,
    paymentDataRut:paymentDataRut,
    paymentDataBank:paymentDataBank,
    paymentDataAccType:paymentDataAccType,
    paymentDataAccNum:paymentDataAccNum,
    paymentDataEmail:paymentDataEmail
  });

  // Put the results in a div
  posting.done(function( data ) {
    if ($("#transferFormSuccess").length) {
      $("#transferFormButton").prop('disabled', false).html('Guardar');
      $("#transferFormSuccess").fadeIn()
    }
    else {
      $("#transferFormButton").prop('disabled', false).html('Guardar');
      $("#transferFormButton").after('<div id="transferFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
      $("#transferFormSuccess").fadeIn()
    }
  });
});

$("#imageUploadForm").submit(function(event){
  console.log("UPLOAD!");
  event.preventDefault();
  var formData = new FormData($(this)[0]);
  $.ajax({
    url: '/profile/saveImage',
    type: 'POST',
    data: formData,
    async: true,
    cache: false,
    contentType: false,
    processData: false,
    success: function (returndata) {
      console.log("RETURN DATA IS: ",returndata);
    },
    error: function (err) {
      console.log("ERROR: ",err);
    }
  });
});

$("#imageUpload").change(function(){
  var reader = new FileReader();
  reader.readAsDataURL(this.files[0]);
  reader.onload = function(){
    $("#imageUploadPreview").attr("src", reader.result);
  }
});
