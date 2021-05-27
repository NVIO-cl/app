$(document).ready(function(){
  var correPrice = 5000;
  var despegaPrice = 15000;
  var vuelaPrice = 25000;

  var selectedPlanName = "Plan Corre";
  var selectedBillingPeriod = "Anual"; //default

  var selectedPeriodMult = 12*0.8;
  var selectedPlanPrice = 3500;

  var planPrice = 0;
  var planPriceString = "";


  var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});

  if ($('#corre').prop("checked") == true) {
    console.log("CORRE IS CHECKED");
    selectedPlanName = "Plan Corre";

    selectedPlanPrice = correPrice;
    planPrice = selectedPlanPrice * selectedPeriodMult;

  } else if ($('#despega').prop("checked") == true){
    console.log("DESPEGA IS CHECKED");
    selectedPlanName = "Plan Despega";

    selectedPlanPrice = despegarPrice;
    planPrice = despegaPrice* selectedPeriodMult;

  } else if ($('#vuela').prop("checked") == true){
    console.log("VUELA IS CHECKED");
    selectedPlanName = "Plan Vuela";

    selectedPlanPrice = vuelaPrice;
    planPrice = selectedPlanPrice* selectedPeriodMult;
  }


  recalc();

  $('#mensual').click(()=>{
    selectedPeriodMult = 1;
    selectedBillingPeriod = "Mensual";
    $('#corre-price').text('$5.000 / mes');
    $('#despega-price').text('$15.000 / mes');
    $('#vuela-price').text('$25.000 / mes');
    recalc();
  });

  $('#anual').click(()=>{
    selectedPeriodMult = 12*0.8;
    selectedBillingPeriod = "Anual";

    $('#corre-price').text('$4.000 / mes');
    $('#despega-price').text('$12.000 / mes');
    $('#vuela-price').text('$20.000 / mes');
    recalc();
  });

  $('#corre').click(()=>{
    console.log("CHANGED TO CORRE");
    selectedPlanPrice = correPrice;
    selectedPlanName="Plan Corre";
    recalc();

  });

  $('#despega').click(()=>{
    console.log("CHANGED TO DESPEGA");
    selectedPlanPrice = despegaPrice;
    selectedPlanName="Plan Despega";
    recalc();
  });

  $('#vuela').click(()=>{
    console.log("CHANGED TO VUELA");
    selectedPlanPrice = vuelaPrice;
    selectedPlanName="Plan Vuela";
    recalc();
  });
  function recalc(){
    planPrice = selectedPlanPrice* selectedPeriodMult;
    planPrice = locale.format(planPrice);
    $('#planName').text(selectedPlanName + " " + selectedBillingPeriod);
    $('#planPrice').text(planPrice);
    $('#totalPrice').text(planPrice);
  }

  function a(){
    var couponCode = $("#couponCheck").val();
    $.ajax({
      type: "GET",
      url: "https://api.aliachile.com/dev/coupon/checkValidity?couponCode=" + couponCode,
      headers: {
        Authorization: 'Bearer ' + Cookies.get("token")
      },
      dataType: 'json',
      success: function (result, status, xhr) {
        if(result.result.valid === true){
          $('#couponCheck').addClass("is-valid")
        } else {
          $('#couponCheck').addClass("is-invalid")
        }
        $('#couponCheckButton').text($('#couponCheckButton').text() == 'Aplicar' ? 'Limpiar' : 'Aplicar');
      },
      error: function (xhr, status, error) {
        console.log(error);
      }
    })
  }

  function b(){
    $('#couponForm #couponCheck').val('');
    $('#couponCheckButton').text($('#couponCheckButton').text() == 'Aplicar' ? 'Limpiar' : 'Aplicar');
    $('#couponCheck').removeClass("is-invalid")
    $('#couponCheck').removeClass("is-valid")
  }

  $("#couponCheckButton").click(function() {
    return (this.tog = !this.tog) ? a() : b();
  });
});
