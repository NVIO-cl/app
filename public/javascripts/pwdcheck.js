$(document).ready(function(){
  $('#repeatPassword').change(function(){
    if ($('#password').val() != "") {
      if ($('#password').val() != $('#repeatPassword').val()) {
        $('#password').removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
        $('#password').toggleClass('is-invalid')
        $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
        $('#repeatPassword').toggleClass('is-invalid')
        $('#password').after('<div class="invalid-feedback">Las contraseñas no son idénticas</div>')

      }
      else {
        $('#password').removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
        $('#password').toggleClass('is-valid')
        $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
        $('#repeatPassword').toggleClass('is-valid')
      }
    }
    else {
      $('#password').removeClass('is-invalid').removeClass('is-valid')
      $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
    }
  })

  $('#password').change(function(){
    if ($('#repeatPassword').val() != "") {
      if ($('#password').val() != $('#repeatPassword').val()) {
        $('#password').removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
        $('#password').toggleClass('is-invalid')
        $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
        $('#repeatPassword').toggleClass('is-invalid')
        $('#password').after('<div class="invalid-feedback">Las contraseñas no son idénticas</div>')

      }
      else {
        $('#password').removeClass('is-invalid').removeClass('is-valid').next('div.invalid-feedback').remove();
        $('#password').toggleClass('is-valid')
        $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
        $('#repeatPassword').toggleClass('is-valid')
      }
    }
    else {
      $('#password').removeClass('is-invalid').removeClass('is-valid')
      $('#repeatPassword').removeClass('is-invalid').removeClass('is-valid')
    }
  })
})
