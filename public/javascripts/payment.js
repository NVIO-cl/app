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
    console.log("CORRE IS CHECKED");
    selectedPlanName = "Plan Corre";
    selectedPlanNumber = "1";

    selectedPlanPrice = correPrice;
    planPrice = selectedPlanPrice * selectedPeriodMult;

  } else if ($('#despega').prop("checked") == true){
    console.log("DESPEGA IS CHECKED");
    selectedPlanName = "Plan Despega";
    selectedPlanNumber = "2";

    selectedPlanPrice = despegarPrice;
    planPrice = despegaPrice* selectedPeriodMult;

  } else if ($('#vuela').prop("checked") == true){
    console.log("VUELA IS CHECKED");
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
    $('#vuela-price').text('$25.000 / mes');
    recalc();
  });

  $('#anual').click(()=>{
    selectedPeriodMult = 12*0.8;
    selectedBillingPeriod = "Anual";
    selectedPlanPeriod = "Y";
    $('#corre-price').text('$4.000 / mes');
    $('#despega-price').text('$12.000 / mes');
    $('#vuela-price').text('$20.000 / mes');
    recalc();
  });

  $('#corre').click(()=>{
    console.log("CHANGED TO CORRE");
    selectedPlanPrice = correPrice;
    selectedPlanName="Plan Corre";
    selectedPlanNumber = "1";
    recalc();
  });

  $('#despega').click(()=>{
    console.log("CHANGED TO DESPEGA");
    selectedPlanPrice = despegaPrice;
    selectedPlanName="Plan Despega";
    selectedPlanNumber = "2";
    recalc();
  });

  $('#vuela').click(()=>{
    console.log("CHANGED TO VUELA");
    selectedPlanPrice = vuelaPrice;
    selectedPlanName="Plan Vuela";
    selectedPlanNumber = "3";
    recalc();
  });

  function recalc(){
    // First get the plan price
    planPrice = selectedPlanPrice * selectedPeriodMult;
    console.log("PLAN PRICE IS: " + planPrice);

    // Check if there's a discount applied
    if (discountMethod) {
      $('#discountName').text("Descuento: "+name);
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
    console.log("TOTAL PRICE IS: " + totalPrice);
    planPrice = locale.format(planPrice);
    planId = selectedPlanNumber+selectedPlanPeriod;
    $('#planName').text(selectedPlanName + " " + selectedBillingPeriod);
    $('#planPrice').text(planPrice);
    $('#totalPrice').text(locale.format(totalPrice));
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
    $('#couponCheck').val("")
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
});
