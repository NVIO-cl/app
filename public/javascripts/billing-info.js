$.ajax({ // Billing info api call
  type: "GET",
  url: "https://api.aliachile.com/dev/billing",
  headers: {
      Authorization: 'Bearer ' + Cookies.get("token")
  },
  dataType: 'json',
  success: function (result, status, xhr) {
    // Human-friendly Variable Names
    const planId = result.billingData.planId;
    const nextBillingDate = result.billingData.nextBillingDate;

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

    // Display Billing Date

    if(planId == 0 || planId == '0'){ // If it's a free user
      $('#nextBillingDate').removeClass('animated-placeholder');
      $('#nextBillingDate').text('¡Tu plan actual es gratis!');
    } else if(nextBillingDate != null ||  !isNaN(nextBillingDate)){ // Check for strange errors
      $('#nextBillingDate').removeClass('animated-placeholder');
      $('#nextBillingDate').text(new Date(nextBillingDate).toLocaleDateString('es-CL'));
    } else { // Something went wrong, abandon ship
      $('#nextBillingDate').removeClass('animated-placeholder');
      $('#nextBillingDate').text('Hubo un error al consultar tu siguiente fecha de cobro');
    }
  },
  error: function (xhr, status, error) {
    console.log(error);
  }
});

$.ajax({ // Billing history api call
  type: "GET",
  url: "https://api.aliachile.com/dev/invoice",
  headers: {
      Authorization: 'Bearer ' + Cookies.get("token")
  },
  dataType: 'json',
  success: function (result, status, xhr) {
    const itemList = result.result.items; // Shorthand

    for(var i = 0; i < itemList.length; i++){ // Each row element
      /* You have to check the payment method here because you can't interpolate
         logical statements inside a multiline string (or at least I couldn't
         find how to do so) */
      if(itemList[i].paymentMethod == 0){
        $('#billingHistoryBody').append(`
          <tr>
            <th scope="row">${new Date(itemList[i].createdAt).toLocaleDateString('es-CL')}</th>
            <td>${itemList[i].paymentDetail.name.split(" Período ")[0]}</td>
            <td>${itemList[i].paymentDetail.name.split(" Período ")[1]}</td>
            <td>Sin Método de Pago</td>
            <td>$${itemList[i].paymentDetail.subTotal}</td>
            <td>$${itemList[i].paymentDetail.total}</td>
          </tr>
        `);
      } else if(itemList[i].paymentMethod == 1){
        $('#billingHistoryBody').append(`
          <tr>
            <th scope="row">${new Date(itemList[i].createdAt).toLocaleDateString('es-CL')}</th>
            <td>${itemList[i].paymentDetail.name.split(" Período ")[0]}</td>
            <td>${itemList[i].paymentDetail.name.split(" Período ")[1]}</td>
            <td>Transferencia</td>
            <td>$${itemList[i].paymentDetail.subTotal}</td>
            <td>$${itemList[i].paymentDetail.total}</td>
          </tr>
        `);
      } else {
        // Cry
      }
    }
  },
  error: function (xhr, status, error) {
    console.log(error);
  }
});
