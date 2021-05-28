$(document).ready(function () {
    var table = $('#dataTable').DataTable({
        "lengthMenu": [[5, 10, 25, 50, -1], [5, 10, 25, 50, "Todos"]],
        "responsive": true,
        "language": {
            "lengthMenu": "Mostrando _MENU_ por página",
            "zeroRecords": "No se encontró nada",
            "emptyTable": "No hay datos disponibles en esta tabla",
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "No hay registros disponibles",
            "infoFiltered": "(Filtrado de un total de _MAX_ registros)",
            "thousands": ".",
            "decimal": ",",
            "search": "Buscar:",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "aria": {
                "sortAscending":  ": activar para organizar columna de forma ascendiente",
                "sortDescending": ": activar para organizar columna de forma descendiente"
            }
        },
        "columnDefs": [
            { "type": "integer", "targets": 1 }
        ],
        "order": [[ 1, "desc" ]]
    });
    // FILTERING CARDS

    // State trackers, used to keep track of the button states (true means the button is selected)
    var emptyState = filledState = preparingState = takeoutState = shippingState = finishedState = false;

    // Event handlers
    // Note: I apologize beforehand for the extension of the code

    // Only the first card is commented since they all follow the exact same logic
    $('#emptyCard').on('click', function() { // Listen for click event
      if($('#empty').text() != '0' && $('#empty').text() != ''){ // If the total is zero or empty (it should never be empty, but you have to be sure)
        if(emptyState){ // if the card is currently selected
          table.search('').draw(); // clear the search
          emptyState = false; // set it to unselected
          $('#emptyCard').removeClass('card-selected'); // clear all styles
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        } else { // if the card is not currently selected
          table.search('Sin información de cliente').draw(); // search for the relevant filter
          emptyState = true; // set the card to "selected"
          filledState = preparingState = takeoutState = shippingState = finishedState = false; // set all other cards to unselected
          $('#emptyCard').addClass('card-selected'); // add the style
          $('#filledCard').removeClass('card-selected'); // remove all other styles
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        }
      }
    });

    $('#filledCard').on('click', function() {
      if($('#filled').text() != '0' && $('#filled').text() != ''){
        if(filledState){
          table.search('').draw();
          filledState = false;
          $('#filledCard').removeClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        } else {
          table.search('Datos de cliente rellenados').draw();
          filledState = true;
          emptyState = preparingState = takeoutState = shippingState = finishedState = false;
          $('#filledCard').addClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        }
      }
    });

    $('#preparingCard').on('click', function() {
      if($('#preparing').text() != '0' && $('#preparing').text() != ''){
        if(preparingState){
          table.search('').draw();
          preparingState = false;
          $('#preparingCard').removeClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        } else {
          table.search('En proceso de preparación').draw();
          preparingState = true;
          emptyState = filledState = takeoutState = shippingState = finishedState = false;
          $('#preparingCard').addClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        }
      }
    });

    $('#takeoutCard').on('click', function() {
      if($('#takeout').text() != '0' && $('#takeout').text() != ''){
        if(takeoutState){
          table.search('').draw();
          takeoutState = false;
          $('#takeoutCard').removeClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        } else {
          table.search('Listo para retirar').draw();
          takeoutState = true;
          emptyState = filledState = preparingState = shippingState = finishedState = false;
          $('#takeoutCard').addClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        }
      }
    });

    $('#shippingCard').on('click', function() {
      if($('#shipping').text() != '0' && $('#shipping').text() != ''){
        if(shippingState){
          table.search('').draw();
          shippingState = false;
          $('#shippingCard').removeClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        } else {
          table.search('En proceso de despacho').draw();
          shippingState = true;
          emptyState = filledState = preparingState = takeoutState = finishedState = false;
          $('#shippingCard').addClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
        }
      }
    });

    $('#finishedCard').on('click', function() {
      if($('#finished').text() != '0' && $('#finished').text() != ''){
        if(finishedState){
          table.search('').draw();
          finishedState = false;
          $('#finishedCard').removeClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
        } else {
          table.search('Pedido finalizado').draw();
          finishedState = true;
          emptyState = filledState = preparingState = takeoutState = shippingState = false;
          $('#finishedCard').addClass('card-selected');
          $('#emptyCard').removeClass('card-selected');
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
        }
      }
    });

    // Search bar clear button
    table.one('search', function() { // the method is 'one' since it should only ever do this once
      $('#dataTable_filter', ':only-child').append("<i id='clean_filter' class='fas fa-times-circle text-gray-500 ml-2 align-middle' style='font-size: 1.3em;'></i>");
    });

    table.on('search', function() {  // This runs whenever the search bar is updated
      if(emptyState || filledState || preparingState || takeoutState || shippingState || finishedState){ // Check if any cards are checked
          emptyState = filledState = preparingState = takeoutState = shippingState = finishedState = false; // Uncheck all of them
          $('#emptyCard').removeClass('card-selected'); // Remove the checked style
          $('#filledCard').removeClass('card-selected');
          $('#preparingCard').removeClass('card-selected');
          $('#takeoutCard').removeClass('card-selected');
          $('#shippingCard').removeClass('card-selected');
          $('#finishedCard').removeClass('card-selected');
      }
    });

    $(document).on('click', '#clean_filter', function(){ // When the 'X' button is clicked
      table.search('').draw(); // clear the search bar
      emptyState = filledState = preparingState = takeoutState = shippingState = finishedState = false; // uncheck all card states
      $('#emptyCard').removeClass('card-selected'); // Remove checked styles
      $('#filledCard').removeClass('card-selected');
      $('#preparingCard').removeClass('card-selected');
      $('#takeoutCard').removeClass('card-selected');
      $('#shippingCard').removeClass('card-selected');
      $('#finishedCard').removeClass('card-selected');
    });
});
