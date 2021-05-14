$.ajax({
  type: "GET",
  url: "https://ucdaudqrif.execute-api.us-east-1.amazonaws.com/dev/billing",
  headers: {
      Authorization: 'Bearer ' + Cookies.get("token") // <- SACAR DE COOKIES
  },
  dataType: 'json',
  success: function (result, status, xhr) {
    // Change plan name info
    const planID = result.billingData.planID;
    $('#planName').removeClass('animated-placeholder');
    if(planID == 0){
      $('#planName').text('Camina');
    } else if(planID == 1) {
      $('#planName').text('Corre');
    } else if(planID == 2) {
      $('#planName').text('Despega');
    } else if(planID == 3) {
      $('#planName').text('Vuela');
    }

    // Display last four digits
    $('#lastFour').removeClass('animated-placeholder');
    if(result.flowData.last4CardDigits != null){
      $('#lastFour').text('**** **** **** ' + result.flowData.last4CardDigits);
    } else {
      $('#lastFour').text('No has registrado una tarjeta')
    }

    // Show next billing date
    if(planID != 0 && result.billingData.dueDate != 0){
      const humanDate = new Date(result.billingData.dueDate)
      $('#nextBillingDate').text('Tu siguiente cobro es el ' + humanDate.getDate() + '-' + (humanDate.getUTCMonth() + 1) + '-' + humanDate.getFullYear())
    } else if(planID == 0){
      $('#nextBillingDate').text('¡Tu plan actual es gratis!')
    } else {
      // Something went wrong
    }
  },
  error: function (xhr, status, error) {
    console.log(error);
  }
});
