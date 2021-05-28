$(document).ready(function(){
  var correPrice = 5000;
  var despegaPrice = 15000;
  var vuelaPrice = 25000;

  var selectedPlanName = "Plan Corre"; // default

  var selectedPlanNumber = "1";
  var selectedPlanPeriod = "Y";
  var planId = selectedPlanNumber+selectedPlanPeriod; // default
  var selectedBillingPeriod = "Anual"; //default

  var selectedPeriodMult = 12*0.8;
  var selectedPlanPrice = 3500;

  var planPrice = 0;
  var totalPrice = 0;
  var planPriceString = "";

  var discountMethod = "";
  var discountAmount = 0;
  var amount = 0;
  var name ="";
  var allowedPlans = [];


  var locale = Intl.NumberFormat('es-CL', {style: "currency",currency:"CLP"});

  if ($('#corre').prop("checked") == true) {
    selectedPlanName = "Plan Corre";
    selectedPlanNumber = "1";

    selectedPlanPrice = correPrice;
    planPrice = selectedPlanPrice * selectedPeriodMult;

  } else if ($('#despega').prop("checked") == true){
    selectedPlanName = "Plan Despega";
    selectedPlanNumber = "2";

    selectedPlanPrice = despegaPrice;
    planPrice = despegaPrice* selectedPeriodMult;

  } else if ($('#vuela').prop("checked") == true){
    selectedPlanName = "Plan Vuela";
    selectedPlanNumber = "3";

    selectedPlanPrice = vuelaPrice;
    planPrice = selectedPlanPrice* selectedPeriodMult;
  }
  recalc();

  $('#mensual').click(()=>{
    selectedPeriodMult = 1;
    selectedBillingPeriod = "Mensual";
    selectedPlanPeriod = "M";
    $('#corre-price').text('$5.000 / mes');
    $('#despega-price').text('$15.000 / mes');
    $('#vuela-price').text('¡Próximamente!');
    recalc();
  });

  $('#anual').click(()=>{
    selectedPeriodMult = 12*0.8;
    selectedBillingPeriod = "Anual";
    selectedPlanPeriod = "Y";
    $('#corre-price').text('$4.000 / mes');
    $('#despega-price').text('$12.000 / mes');
    $('#vuela-price').text('¡Próximamente!');
    recalc();
  });

  $('#corre').click(()=>{
    selectedPlanPrice = correPrice;
    selectedPlanName="Plan Corre";
    selectedPlanNumber = "1";
    recalc();
  });

  $('#despega').click(()=>{
    selectedPlanPrice = despegaPrice;
    selectedPlanName="Plan Despega";
    selectedPlanNumber = "2";
    recalc();
  });

  $('#vuela').click(()=>{
    selectedPlanPrice = vuelaPrice;
    selectedPlanName="Plan Vuela";
    selectedPlanNumber = "3";
    recalc();
  });

  function recalc(){
    // First get the plan price
    planPrice = selectedPlanPrice * selectedPeriodMult;

    // Check if there's a discount applied
    if (discountMethod) {
      $('#discountName').text(name);
      // If the discount is months, calculate based on period and plan
      if (discountMethod=="month" && selectedPlanPeriod == "Y") {
        discountAmount = selectedPlanPrice*0.8*amount;
        $('#discountPrice').text(locale.format(-discountAmount));
      } else if(discountMethod=="month" && selectedPlanPeriod == "M"){
        discountAmount = selectedPlanPrice*amount;
        $('#discountPrice').text(locale.format(-discountAmount));
      }

      // If it's fixed, just discount
      if (discountMethod=="fixed") {
        discountAmount = amount;
        $('#discountPrice').text(locale.format(-discountAmount));
      }

      // If it's percentage, the discount amount is price*(1-amount)
      if (discountMethod == "percentage") {
        discountAmount = planPrice*(1-amount);
        $('#discountPrice').text(locale.format(-discountAmount));
      }
    } else {
      $('#discountName').text("");
      $('#discountPrice').text("");
    }

    // Set prices n' stuff.
    totalPrice = planPrice - discountAmount;
    planPrice = locale.format(planPrice);
    planId = selectedPlanNumber+selectedPlanPeriod;
    $('#planName').text(selectedPlanName + " " + selectedBillingPeriod);
    $('#planPrice').text(planPrice);
    $('#totalPrice').text(locale.format(totalPrice));
    $('#modalTotalPrice').text("Monto a pagar: "+locale.format(totalPrice));
  }

  $('#couponForm').submit((e)=>{
    e.preventDefault();
    $.ajax({
      type: "GET",
      url: "https://api.aliachile.com/dev/coupon/checkValidity?couponCode=" + $('#couponCheck').val() + "&planId=" + planId,
      headers: {
        Authorization: 'Bearer ' + Cookies.get("token")
      },
      dataType: 'json',
      success: function (result, status, xhr) {

        if(result.result.valid === true){
          let couponData = result.result.couponData;
          discountMethod = couponData.discountMethod;
          amount = couponData.amount;
          name = couponData.name;
          $('#couponCheck').addClass("is-valid");
          $('#couponCheck').removeClass("is-invalid");
          recalc();
        } else {
          $('#couponCheck').addClass("is-invalid");
          $('#couponCheck').removeClass("is-valid");
          discountMethod = "";
          amount = 0;
          discountAmount = 0;
          name = "";
          recalc();
        }
        $('#couponCheckButton').addClass('d-none');
        $('#couponClearButton').removeClass('d-none');
      },
      error: function (xhr, status, error) {
        console.log(error);
      }
    });
  });

  $('#couponClearButton').click(()=>{
    discountMethod = "";
    amount = 0;
    discountAmount = 0;
    name = "";
    $('#couponCheck').removeClass("is-invalid");
    $('#couponCheck').removeClass("is-valid");
    $('#couponCheck').val("");
    $('#couponCheckButton').removeClass('d-none');
    $('#couponClearButton').addClass('d-none');
    recalc();
  });

  $('#couponCheck').keyup(()=>{
    $('#couponCheckButton').removeClass('d-none');
    $('#couponClearButton').addClass('d-none');
    $('#couponCheck').removeClass("is-invalid");
    $('#couponCheck').removeClass("is-valid");
    discountMethod = "";
    amount = 0;
    discountAmount = 0;
    name = "";
    recalc();
  });

  $('#paidButton').click(()=>{
    console.log("PAID!");
    var planId = "";
    var couponCode = "";
    // Get plan ID
    planId = $("input[name=plan]:checked").val();
    // Get plan period
    planId = planId + $("input[name=billingPeriod]:checked").val();
    console.log(planId);
    // Get coupon
    couponCode = $('#couponCheck').val();
    console.log(couponCode);
    // Send request to middleware
    $.ajax({
      type: "POST",
      url: "/billing/setPlan",
      data: {planId: planId, couponCode: couponCode},
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
});
