$(document).ready(function () {
    $('#dataTable').DataTable({
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
});

$.fn.dataTable.moment( 'dd/mm/yyyy hh:mm', 'es' );
