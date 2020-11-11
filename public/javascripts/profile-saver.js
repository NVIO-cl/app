
//Validate name form
$( "#nameForm" ).submit(function( event ) {
  //Disable button and add spinner
  $("#nameFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');
  //Fade out "datos guardados" if it exist
  if ($("#nameFormSuccess").length) {
    $("#nameFormSuccess").fadeOut()
  }
  //Delete invalid forms styles
  $("#companyName").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#firstName").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#lastName").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  // Stop form from submitting normally
  event.preventDefault();
  // Get values from elements on the page:
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
    if (data != "ok") {
      data.forEach((item, i) => {
        $(item[0]).after('<div class="invalid-feedback">'+item[1]+'</div>')
        $(item[0]).toggleClass('is-invalid')
      });
      $("#nameFormButton").prop('disabled', false).html('Guardar');
    }
    else {
      $("#companyName").toggleClass('is-valid')
      $("#firstName").toggleClass('is-valid')
      $("#lastName").toggleClass('is-valid')
      if ($("#nameFormSuccess").length) {
        $("#nameFormButton").prop('disabled', false).html('Guardar');
        $("#nameFormSuccess").fadeIn()
      }
      else {
        $("#nameFormButton").prop('disabled', false).html('Guardar');
        $("#nameFormButton").after('<div id="nameFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
        $("#nameFormSuccess").fadeIn()
      }
    }
  });
});

//Validate contact form
$( "#contactForm" ).submit(function( event ) {
  //Disable button and add spinner
  $("#contactFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');
  //Fade out "datos guardados" if it exist
  if ($("#contactFormSuccess").length) {
    $("#contactFormSuccess").fadeOut()
  }
  //Delete invalid and valid forms styles
  $("#contactNumber").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#email").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  // Stop form from submitting normally
  event.preventDefault();
  // Get values from elements on the page:
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
    if (data != "ok") {
      data.forEach((item, i) => {
        $(item[0]).after('<div class="invalid-feedback">'+item[1]+'</div>')
        $(item[0]).toggleClass('is-invalid')
      });
      $("#contactFormButton").prop('disabled', false).html('Guardar');
    }
    else {
      $("#contactNumber").toggleClass('is-valid')
      $("#email").toggleClass('is-valid')
      if ($("#contactFormSuccess").length) {
        $("#contactFormButton").prop('disabled', false).html('Guardar');
        $("#contactFormSuccess").fadeIn()
      }
      else {
        $("#contactFormButton").prop('disabled', false).html('Guardar');
        $("#contactFormButton").after('<div id="contactFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
        $("#contactFormSuccess").fadeIn()
      }
    }
  });
});

$( "#transferForm" ).submit(function( event ) {
  //Disable button and add spinner
  $("#transferFormButton").prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Guardando...');
  //Fade out "datos guardados" if it exist
  if ($("#transferFormSuccess").length) {
    $("#transferFormSuccess").fadeOut("slow")
  }
  //Delete invalid and valid forms styles
  $("#companyTurn").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#companyRut").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataName").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataRut").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataBank").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataAccType").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataAccNum").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
  $("#paymentDataEmail").removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
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
    if (data != "ok") {
      data.forEach((item, i) => {
        $(item[0]).after('<div class="invalid-feedback">'+item[1]+'</div>')
        $(item[0]).toggleClass('is-invalid')
      });
      $("#transferFormButton").prop('disabled', false).html('Guardar');
    }
    else {
      $("#companyTurn").toggleClass('is-valid');
      $("#companyRut").toggleClass('is-valid');
      $("#paymentDataName").toggleClass('is-valid');
      $("#paymentDataRut").toggleClass('is-valid');
      $("#paymentDataBank").toggleClass('is-valid');
      $("#paymentDataAccType").toggleClass('is-valid');
      $("#paymentDataAccNum").toggleClass('is-valid');
      $("#paymentDataEmail").toggleClass('is-valid');
      if ($("#transferFormSuccess").length) {
        $("#transferFormButton").prop('disabled', false).html('Guardar');
        $("#transferFormSuccess").fadeIn()
      }
      else {
        $("#transferFormButton").prop('disabled', false).html('Guardar');
        $("#transferFormButton").after('<div id="transferFormSuccess" class="ml-3 d-inline text-success" style="display:none;"><i class="fas fa-check mr-1"></i>Datos guardados</div>')
        $("#transferFormSuccess").fadeIn()
      }
    }
  });
});

$("#imageUploadForm").submit(function(event){
  $("#imageUploadStatus").html('<div class="text-info"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Subiendo...</div>')
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
      $("#imageUploadStatus").html('<div class="text-success"><i class="fas fa-check mr-1"></i>Foto subida</div>')
    },
    error: function (err) {
      $("#imageUploadStatus").html('<div class="text-danger"><i class="fas fa-times mr-1"></i>ERROR</div>')
    }
  });
});

$("#imageUpload").change(function(){
  var reader = new FileReader();
  reader.readAsDataURL(this.files[0]);
  reader.onload = function(){
    $("#imageUploadPreview").attr("src", reader.result);
  }
  $("#imageUploadStatus").html('<div class="text-warning"><i class="fas fa-exclamation mr-1"></i>Foto sin guardar</div>')
});
