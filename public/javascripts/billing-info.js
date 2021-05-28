$.ajax({ // Billing info api call
  type: "GET",
  url: "https://api.aliachile.com/dev/billing",
  headers: {
      Authorization: 'Bearer ' + Cookies.get("token")
  },
  dataType: 'json',
  success: function (result, status, xhr) {
    // Human-friendly Variable Names
    var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});
    const planId = result.billingData.planId;
    const nextBillingDate = result.billingData.nextBillingDate;
    const paymentMethod = result.billingData.paymentMethod;
    const changeAtEnd = result.billingData.changeAtEnd;

    var name = ""
    var period = ""
    var multiplier = 0;
    var price = 0;

    // If cancelAtEnd is true
    if (result.billingData.cancelAtEnd){
      $('#nextBillingDateTitle').text('Fecha de Término del Plan');
      $('#autoRenewal').removeClass('animated-placeholder');
      $('#autoRenewal').text('Desactivada');
    } else {
      $('#nextBillingDateTitle').text('Fecha de Próxima Factura');
      $('#autoRenewal').removeClass('animated-placeholder');
      $('#autoRenewal').text('Activada');
    }

    if (result.billingData.changeAtEnd != null){

      if (changeAtEnd.charAt(1) == "Y"){
        multiplier = 12*0.8;
        period = "anual"
      } else if (changeAtEnd.charAt(1) == "M") {
        multiplier = 1;
        period = "mensual"
      }
      if (parseInt(changeAtEnd.charAt(0)) == 1){
        price = 5000;
        name = "Corre"
      } else if (parseInt(changeAtEnd.charAt(0)) == 2){
        price = 15000;
        name = "Despega"
      } else if (parseInt(changeAtEnd.charAt(0)) == 3){
        price = 25000;
        name = "Vuela"
      }
      var finalPrice = locale.format(price*multiplier);

      $('#newPlanName').removeClass('animated-placeholder');
      $('#newPlanNameTitle').text('Nombre del Próximo Plan');
      $('#newPlanName').text(name);
      $('#newPlanPrice').removeClass('animated-placeholder');
      $('#newPlanPriceTitle').text('Precio del Próximo Plan');
      $('#newPlanPrice').text(finalPrice + " " + period);
    } else {
      $('#newPlanNameCol').addClass("d-none");
      $('#newPlanPriceCol').addClass("d-none");
    }

    // Display Plan Details
    switch (planId){
      case 0:
        $('#planPrice').text('¡Tu plan actual es gratis!');   // Show plan price
        $('#planPrice').removeClass('animated-placeholder');   // Remove animation
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Camina');                        // Add plan name
        break;
      case '0':
        $('#planPrice').text('¡Tu plan actual es gratis!');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Camina');
        break;
      case '1M':
        $('#planPrice').text('$5.000 mensual');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Corre');
        break;
      case '1Y':
        $('#planPrice').text('$48.000 anual');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Corre');
        break;
      case '2M':
        $('#planPrice').text('$15.000 mensual');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Despega');
        break;
      case '2Y':
        $('#planPrice').text('$144.000 anual');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Despega');
        break;
      case '3M':
        $('#planPrice').text('$25.000 mensual');
        $('#planPrice').removeClass('animated-placeholder');
        $('#planName').removeClass('animated-placeholder');
        $('#planName').text('Vuela');
        break;
      case '3Y':
        $('#planPrice').text('$240.000 anual');
        $('#planPrice').removeClass('animated-placeholder');
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

    // Display Payment Method

    switch (paymentMethod) {
      case 0:
        $('#paymentMethod').removeClass('animated-placeholder');           // Remove animation
        $('#paymentMethod').text('No hay método de pago registrado');      // Add plan name
        break;
      case 1:
        $('#paymentMethod').removeClass('animated-placeholder');
        $('#paymentMethod').text('Transferencia');
        break;
      case 2:
        $('#paymentMethod').removeClass('animated-placeholder');
        $('#paymentMethod').text('Flow');
        break;
      default:
        $('#paymentMethod').text('Hubo un error al consultar el método de pago')
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
    var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});
    for(var i = 0; i < itemList.length; i++){ // Each row element

      var status = itemList[i].status
      var colorStatus = ""
      var paymentButton = ""
      var paymentHref = "#invoice-pay"
      var paymentTarget = "#modal-pay"

      if (status == 0 || status == '0'){
        status = "Sin Pagar"
        colorStatus = "text-danger font-weight-bold"
      } else if (status == 1 || status == '1'){
        status = "Esperando Confirmación"
        colorStatus = "text-warning font-weight-bold"
        paymentButton = "disabled"
        paymentHref = "#"
        paymentTarget = "#"
      } else if (status == 2 || status == '2'){
        status = "Pagado"
        colorStatus = "text-success font-weight-bold"
        paymentButton = "disabled"
        paymentHref = "#"
        paymentTarget = "#"
      } else if (status == 3 || status == '3'){
        status = "Fallido"
        colorStatus = "text-danger font-weight-bold"
      } else if (status == 4 || status == '4'){
        status = "Expirado"
        colorStatus = "text-muted font-weight-bold"
        paymentButton = "disabled"
        paymentHref = "#"
        paymentTarget = "#"
      } else if (status == 5 || status == '5'){
        status = "Cancelado"
        colorStatus = "text-muted font-weight-bold"
        paymentButton = "disabled"
        paymentHref = "#"
        paymentTarget = "#"
      }

      var paymentMethod = itemList[i].paymentMethod

      if (paymentMethod == 0 || paymentMethod == '0'){
        paymentMethod = "Ninguno"
      } else if (paymentMethod == 1 || paymentMethod == '1'){
        paymentMethod = "Transferencia"
      } else if (paymentMethod == 2 || paymentMethod == '2'){
        paymentMethod = "Flow"
      } else if (paymentMethod == 3 || paymentMethod == '3'){
        paymentMethod = "Stripe"
      } else if (paymentMethod == 4 || paymentMethod == '4'){
        paymentMethod = "Paypal"
      }

      $('#billingHistoryBody').append(`
        <tr>
          <th scope="row">${new Date(itemList[i].createdAt).toLocaleDateString('es-CL')}</th>
          <td>${itemList[i].invoiceDetail.name.split(" Período ")[0]}</td>
          <td>${itemList[i].invoiceDetail.name.split(" Período ")[1]}</td>
          <td>${paymentMethod}</td>
          <td>${locale.format(itemList[i].invoiceDetail.total)}</td>
          <td class="${colorStatus}">${status}</td>
          <td><a class="btn btn-primary" data-id="${itemList[i].SK.replace("INVOICE#","")}" style="background: #12c4f2;border: #12c4f2;padding-bottom: 3px;padding-top: 3px;" data-toggle='modal' data-target='#modal-invoice' href="#invoice">Ver más</a></td>
          <td><a class="btn btn-primary ${paymentButton}" data-id="${itemList[i].SK.replace("INVOICE#","")}" style="background: #12c4f2;border: #12c4f2;padding-bottom: 3px;padding-top: 3px;" data-toggle='modal' data-target=${paymentTarget} href=${paymentHref}>Ver más</a></td>    
        </tr>
      `);
    }
  },
  error: function (xhr, status, error) {
    console.log(error);
  }
});

$('#modal-invoice').on('show.bs.modal', function (event){
  var invoiceId = $(event.relatedTarget).data("id");
  $.ajax({ // Billing info api call
    type: "GET",
    url: "https://api.aliachile.com/dev/invoice/" + invoiceId,
    headers: {
      Authorization: 'Bearer ' + Cookies.get("token")
    },
    dataType: 'json',
    success: function (result, status, xhr) {
      var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});
      var paymentMethod = result.result.paymentMethod

      if (paymentMethod == 0 || paymentMethod == '0'){
        paymentMethod = "Sin método de pago"
      } else if (paymentMethod == 1 || paymentMethod == '1'){
        paymentMethod = "Transferencia"
      }

      var status = result.result.status

      if (status == 0 || status == '0'){
        status = "Sin pagar"
      } else if (status == 1 || status == '1'){
        status = "Esperando Confirmación"
      } else if (status == 2 || status == '2'){
        status = "Pagado"
      } else if (status == 3 || status == '3'){
        status = "Fallido"
      } else if (status == 4 || status == '4'){
        status = "Expirado"
      } else if (status == 5 || status == '5'){
        status = "Cancelado"
      }

      console.log(result)
      const invoiceTitle =  "Detalles de la facturación " + invoiceId
      $('#invoiceTitle').text(invoiceTitle);

      const invoiceDate =  "Fecha de creación : " + new Date(result.result.createdAt).toLocaleDateString('es-CL')
      $('#invoiceDate').text(invoiceDate);

      const invoiceDescription =  "Nombre del plan: " + result.result.invoiceDetail.name.split(" Período ")[0]
      $('#invoiceDescription').text(invoiceDescription);

      const invoicePeriod =  "Periodo: " + result.result.invoiceDetail.name.split(" Período ")[1]
      $('#invoicePeriod').text(invoicePeriod);

      const invoicePaymentMethod =  "Forma de pago: " + paymentMethod
      $('#invoicePaymentMethod').text(invoicePaymentMethod);

      const invoiceSubtotal =  "Subtotal: " + locale.format(result.result.invoiceDetail.subTotal)
      $('#invoiceSubtotal').text(invoiceSubtotal);

      if (result.result.invoiceDetail.discount){
        const invoiceDiscount =  "Descuento: " + locale.format(result.result.invoiceDetail.discount)
        $('#invoiceDiscount').text(invoiceDiscount);

        const invoiceDiscountReason =  "Razón: " + result.result.invoiceDetail.discountReason
        $('#invoiceDiscountReason').text(invoiceDiscountReason);
      }

      const invoiceTotal =  "Total: " + locale.format(result.result.invoiceDetail.total)
      $('#invoiceTotal').text(invoiceTotal);

      const retryInvoice =  "Re-intentos : " + result.result.retries
      $('#retryInvoice').text(retryInvoice);

      const updatedAtInvoice =  "Última modificación : " + new Date(result.result.updatedAt).toLocaleDateString('es-CL')
      $('#updatedAtInvoice').text(updatedAtInvoice);

      const statusInvoice =  "Estado de facturación : " + status
      $('#statusInvoice').text(statusInvoice);

    },
    error: function (xhr, status, error) {
      console.log(error);
    }
  })
});

$('#modal-pay').on('show.bs.modal', function (event) {
  var invoiceId = $(event.relatedTarget).data("id");
  $.ajax({ // Billing info api call
    type: "GET",
    url: "https://api.aliachile.com/dev/invoice/" + invoiceId,
    headers: {
      Authorization: 'Bearer ' + Cookies.get("token")
    },
    dataType: 'json',
    success: function (result, status, xhr) {
      var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});
      const invoiceTotalPayment = "Total: " + locale.format(result.result.invoiceDetail.total);
      $('#invoiceTotalPayment').text(invoiceTotalPayment);
    },
    error: function (xhr, status, error) {
      console.log(error);
    }
  })

  $('#paymentReady').click(function() {
    $.ajax({ // Billing info api call
      type: "PUT",
      url: "https://api.aliachile.com/dev/invoice/" + invoiceId,
      headers: {
        Authorization: 'Bearer ' + Cookies.get("token")
      },
      dataType: 'json',
      success: function (result, status, xhr) {
        window.location.replace('/billing');
      },
      error: function (xhr, status, error) {
        console.log(error);
      }
    })
  });
});

