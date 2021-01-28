$(document).ready(function(){
    var orderid = $("#orderid").html().substring(7, 13)
    $("#comprobante").click(function (e){
        e.preventDefault()
        var posting = $.get("comprobante/" + orderid)

        posting.done(function (data){
            window.location.href = data;
        })
    });

    $("#comentar").click(function (e){
        $("#comentario").removeClass('is-invalid').next("div.invalid-feedback").remove()
        e.preventDefault()
        var comentario = $("#comentario").val()
        if (comentario === ""){
            $("#comentario").after('<div class="invalid-feedback">El comentario no puede estar vacío</div>')
            $("#comentario").toggleClass('is-invalid')
        } else {
            var posting = $.post("comentar", {orderid: orderid, comentario: comentario})
            posting.done(function (data){
                location.reload()
            })
        }
    });

    $("#editStatus").click(function (e){
      $("#editStatus").removeClass('is-invalid').next("div.invalid-feedback").remove()
      e.preventDefault()
      var status = $("#selectStatus").val()
      console.log(status);
      var posting = $.post("orderStatus", {orderid: orderid, status: status})
      posting.done(function (data){
        location.reload()
      })
    });

    $("#validarPago").click(function (e){
      $("#validarPago").removeClass('is-invalid').next("div.invalid-feedback").remove()
      e.preventDefault()
      var posting = $.post("validatePayment", {orderid: orderid})
      posting.done(function (data){
        location.reload()
      })
    });
});
