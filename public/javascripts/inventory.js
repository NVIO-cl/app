$(document).ready(function() {

    $( "#paginationAmount" ).change(function() {
        setUrl();
    });


    $("#searchProduct").on("change keyup paste", function(event){
        if (event.keyCode === 13){
            setUrl();
        }

    })

});

function setUrl(page){
    console.log(page)
    var o = window.location.search
    var c = $('#paginationAmount').val()
    var s = $('#searchProduct').val()
    var p = page
    var newUrl = "c=" + c
    var params_list = o.split("&");
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


    location.search = newUrl
}