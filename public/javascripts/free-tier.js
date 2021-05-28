document.getElementById('freePlan').onclick = callFree;

function callFree(e){ // Switch to free plan
  $.ajax({
    type: "POST",
    url: "https://api.aliachile.com/dev/subscription/cancel",
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
  });
}

var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});

$('#modal-change').on('show.bs.modal', function (event) {
  var planId = $(event.relatedTarget).data("id");
  var currentPlan = $(event.relatedTarget).data("currentplan");
  var planPrice = 0;
  var selectedPeriodMult = 12*0.8;
  var selectedPeriodName = "anual";
  $('#planId').val(planId);

  if (planId == 1) {
    planPrice = 5000;
    $('#changePlanTitle').text("¿Deseas cambiarte al plan Corre?");
    $('#changePlanModalTitle').text("Cambiar a Plan Corre");
    recalc();
  }
  if (planId == 2) {
      planPrice = 15000;
    $('#changePlanTitle').text("¿Deseas cambiarte al plan Despega?");
    $('#changePlanModalTitle').text("Cambiar a Plan Despega");
    recalc();
  }
  if (planId == 3) {
    planPrice = 25000;
    $('#changePlanTitle').text("¿Deseas cambiarte al plan Vuela?");
    $('#changePlanModalTitle').text("Cambiar a Plan Vuela");
    recalc();
  }
  if (planId > currentPlan) {
    $('#changePlanPeriod').text("El cambio de plan se realizará de inmediato");
    $('#changePlanUsage').text("Tendrás acceso a las nuevas funcionalidades sin esperar a la fecha de facturación");
    $('#changePlanReturn').text("Tu próxima factura mostrará el nuevo valor del plan");
  } else {
    $('#changePlanPeriod').text("El cambio se hará efectivo una vez finalizado el periodo actual");
    $('#changePlanUsage').text("Podrá seguir usando tu plan actual hasta ese día");
    $('#changePlanReturn').text("Luego de eso, tu plan cambiará automáticamente");
  }

  $('#mensual').click(()=>{
    selectedPeriodMult = 1;
    selectedPeriodName = "mensual";
    recalc();
  });
  $('#anual').click(()=>{
    selectedPeriodMult = 12*0.8;
    selectedPeriodName = "anual";
    recalc();
  });

  $('#changePlan').click(function(){
    var fullPlanId = planId + $("input[name=billingPeriod]:checked").val();
    // Call the API request to change plan
    $.ajax({
      type: "POST",
      url: "https://api.aliachile.com/dev/subscription/change",
      data: {planId: fullPlanId},
      dataType: 'json',
      success: function(result,status,xhr){
        window.location.replace("/billing");
      },
      error: function(xhr,status,error){
        console.log(error);
        alert(error);
      }
    });
  });
  function recalc(){
    var pricingTotal = planPrice * selectedPeriodMult;
    $('#pricingTotal').text("Total: " + locale.format(pricingTotal) + " " + selectedPeriodName);
  }
});
