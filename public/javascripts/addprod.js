$(document).ready(function(){
    var count = 1;
    $('#clickAdd').click(function(e){
        e.preventDefault();
        $("#items[0]").after("<tr name='items[" + count + "]'>" +
        "<td><input class='form-control' type='text' value='" + $('#items[0][product]').val()  + "' name='items[" + count + "][product]' id='items[" + count + "][product]'></td>" +
        "<td><input class='form-control' type='number' style='width: 100px;' value='" + $('#items[0][price]').val() + "' name='items[" + count + "][price]' id='items[" + count + "][price]'></td>" +
        "<td><input class='form-control' type='number' style='width: 100px;' value='" + $('#items[0][quantity]').val() + "' name='items[" + count + "][quantity]' id='items[" + count + "][quantity]'></td>" +
        "<td>" + ($('#items[0][price]').val()*$('#items[0][quantity]').val()) + "</td></tr>");
        count++;
        console.log("foobar");
    });
});