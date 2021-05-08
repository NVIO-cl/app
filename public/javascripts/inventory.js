$(document).ready(function() {

    $( "#paginationAmount" ).change(function() {
        setUrl();
    });


    $("#searchProduct").on("change keyup paste", function(event){
        if (event.keyCode === 13){
            setUrl();
        }

    })

    $( "#nameFilter" ).click(function(event) {
        event.preventDefault();
        var filtro = $('#nameFilter').val()
        setUrl(1, filtro);
    });

    $( "#subproductsFilter" ).click(function(event) {
        event.preventDefault();
        var filtro = $('#subproductsFilter').val()
        setUrl(1, filtro);
    });

    $( "#stockFilter" ).click(function(event) {
        event.preventDefault();
        var filtro = $('#stockFilter').val()
        setUrl(1, filtro);
    });

    $( "#priceFilter" ).click(function(event) {
        event.preventDefault();
        var filtro = $('#priceFilter').val()
        setUrl(1, filtro);
    });

    $( "#availableFilter" ).click(function(event) {
        event.preventDefault();
        var filtro = $('#availableFilter').val()
        setUrl(1, filtro);
    });

});

function setUrl(page, filtro){
    var o = window.location.search
    var c = $('#paginationAmount').val()
    var s = $('#searchProduct').val()
    var p = page
    var newUrl = "c=" + c
    var params_list = o.split("&");
    var f = filtro

    if (p === undefined){
        for (var i in params_list){
            if(params_list[i].includes("p=")){
                p = params_list[i].replace("p=","")
                p = p.replace("?","")
            }
        }
        if (p === undefined){
            p=1
        }
    }

    for (var i in params_list){
        if(params_list[i].includes("c=")){
            var new_c = params_list[i].replace("c=","")
            new_c = new_c.replace("?","")
            if (c != new_c){
                p = 1
            }
        }
    }

    newUrl = newUrl + "&p=" + p

    if (s == ""){
        for (var i in params_list){
            if(params_list[i].includes("s=")){
                var new_s = params_list[i].replace("s=","")
                new_s = new_s.replace("?","")
                newUrl = newUrl + "&s=" + new_s
            }
        }
    } else {
        newUrl = newUrl + "&s=" + s
    }

    if (f == ''){
        f = undefined
    }

    if (f === undefined){
        for (var i in params_list){
            if(params_list[i].includes("f=")){
                var new_f = params_list[i].replace("f=","")
                new_f = new_f.replace("?","")
                if (new_f == 'price_asc' || new_f == 'stock_asc' || new_f == 'productType.keyword_desc' || new_f == 'productName.keyword_desc' || new_f == 'available_desc'){
                    new_f = ''
                } else{
                    newUrl = newUrl + "&f=" + new_f
                }
            }
        }
    } else {
        newUrl = newUrl + '&f=' + f
    }
    location.search = newUrl
}