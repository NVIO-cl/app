$.ajax({
  type: "GET",
  url: "https://api.aliachile.com/dev/billing",
  headers: {
      Authorization: 'Bearer ' + Cookies.get("token") // <- SACAR DE COOKIES
  },
  dataType: 'json',
  success: function (result, status, xhr) {
    // Human-friendly Variable Names
    const planId = result.billingData.planId;
    const paymentMethod = result.billingData.paymentMethod;

    // Display Plan Details
    switch (planId){
      case 0:
        $('#planPrice').text('¡Tu plan actual es gratis!');   // Show plan price
        $('#planName').removeClass('animated-placeholder');   // Remove animation
        $('#planName').text('Camina');                        // Add plan name
        break;
      case '0':
        $('#planPrice').text('¡Tu plan actual es gratis!');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Camina');
        break;
      case '1M':
        $('#planPrice').text('$5.000 mensual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Corre');
        break;
      case '1Y':
        $('#planPrice').text('$48.000 anual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Corre');
        break;
      case '2M':
        $('#planPrice').text('$15.000 mensual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Despega');
        break;
      case '2Y':
        $('#planPrice').text('$144.000 anual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Despega');
        break;
      case '3M':
        $('#planPrice').text('$25.000 mensual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Vuela');
        break;
      case '3Y':
        $('#planPrice').text('$240.000 anual');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Vuela');
        break;
      default:
        $('#planPrice').text('Hubo un error al consultar el costo de tu plan')
    }

    // Display Payment Method
    if(paymentMethod == 0 || paymentMethod == '0'){
      $('#paymentMethod').removeClass('animated-placeholder');
      $('#paymentMethod').text('No has registrado método de pago');
    } else if(paymentMethod == 1 || paymentMethod == '1'){
      $('#paymentMethod').removeClass('animated-placeholder');
      $('#paymentMethod').text('Transferencia');
    } else { // Something went wrong
      $('#paymentMethod').removeClass('animated-placeholder');
      $('#paymentMethod').text('Hubo un error al consultar tu método de pago');
    }
  },
  error: function (xhr, status, error) {
    console.log(error);
  }
});
