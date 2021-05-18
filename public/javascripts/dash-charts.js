Chart.defaults.global.defaultFontFamily = 'Nunito';

function chartEm(weekly, monthly){
  const latestMonth = monthly.slice(-1)[0];

  // Top sellers
  var productKeys = [];
  var productCounts = [];

  // Do at most 8 products
  var prodLoopMin;
  if(latestMonth.productQuantity.length < 8){
    prodLoopMin = latestMonth.productQuantity.length;
  } else {
    prodLoopMin = 8;
  }
  for(var i = 0; i < prodLoopMin; i++){
      productKeys.push(latestMonth.productQuantity[i].key);
      productCounts.push(latestMonth.productQuantity[i].value);
  }
  productCounts.push(0)

  const topSellersCtx = document.getElementById('topSellers').getContext('2d');
  const topSellers = new Chart(topSellersCtx, {
    type:"bar",
    data:{
      labels:productKeys,
      datasets:[{
        label:"Ventas Totales",
        fill:true,
        data:productCounts,
        backgroundColor:"#0861ff",
        borderWidth: 0
      }]
    },
    options:{
      maintainAspectRatio:false,
      legend:{
        display:false
      },
      title:{},
      scales:{
        xAxes:[{
          gridLines:{
            color:"rgb(234, 236, 244)",
            zeroLineColor:"rgb(234, 236, 244)",
            drawBorder:false,
            drawTicks:false,
            borderDash:["2"],
            zeroLineBorderDash:["2"],
            drawOnChartArea:false},
            ticks:{
              fontColor:"#858796",
              padding:20
            }
          }],
          yAxes:[{
            gridLines:{
              color:"rgb(234, 236, 244)",
              zeroLineColor:"rgb(234, 236, 244)",
              drawBorder:false,
              drawTicks:false,
              borderDash:["2"],
              zeroLineBorderDash:["2"]},
              ticks:{
                fontColor:"#858796",
                stepSize: 1,
                padding:20
              }
            }],
            y: {
              beginAtZero: true
            }
          }
        }
      });

  // Por comuna, donut
  const localityKeys = [];
  const localityCounts = [];
  for(var i = 0; i < latestMonth.localities.length; i++){
      localityKeys.push(latestMonth.localities[i].key);
      localityCounts.push(latestMonth.localities[i].doc_count);
  }

  const perLocalityCtx = document.getElementById('perLocality').getContext('2d');
  const perLocality = new Chart(perLocalityCtx, {
    type:"doughnut",
    data:{
      labels:localityKeys,
      datasets:[{
        label:"Channel",
        data:localityCounts,
        backgroundColor:["#0861ff","#0d87f0","#03f5f5"],
        borderColor: "#fff",
        borderWidth: 2,
        hoverBorderWidth: 0
      }]
    },
    options:{
      maintainAspectRatio:false,
      legend:{
        display:true
      }
    }
    });

  // Resumen mensual de pedidos
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthKeys = []        // Used for both monthly metrics
  const monthOrders = []      // Used in "ordersMonthly"
  const monthSaleValues = []  // Used in "salesMonthly"
  for(var i = 0; i < monthly.length; i++){
    monthKeys.push(monthNames[parseInt(monthly[i].month_year.split('/')[0]) - 1]) // Take the month/year, keep the month and map it to the list of month names
    monthOrders.push(monthly[i].ordersAmount)
    monthSaleValues.push(monthly[i].costOrders.value)
  }
  monthOrders.push(0);
  monthSaleValues.push(0);
  const ordersMonthlyCtx = document.getElementById('ordersMonthly').getContext('2d');
  const ordersMonthly = new Chart(ordersMonthlyCtx, {
    type:"line",
    data:{
      labels:monthKeys,
      datasets:[{
        label:"Número de Pedidos",
        fill:true,
        data:monthOrders,
        backgroundColor:"rgba(78, 115, 223, 0.05)",
        borderColor:"#0861ff"
      }]
    },
    options:{
      maintainAspectRatio:false,
      legend:{
        display:false
      },
      title:{},
      scales:{
        xAxes:[{
          gridLines:{
            color:"rgb(234, 236, 244)",
            zeroLineColor:"rgb(234, 236, 244)",
            drawBorder:false,
            drawTicks:false,
            borderDash:["2"],
            zeroLineBorderDash:["2"],
            drawOnChartArea:false},
            ticks:{
              fontColor:"#858796",
              stepSize: 1,
              padding:20
            }
          }],
          yAxes:[{
            gridLines:{
              color:"rgb(234, 236, 244)",
              zeroLineColor:"rgb(234, 236, 244)",
              drawBorder:false,
              drawTicks:false,
              borderDash:["2"],
              zeroLineBorderDash:["2"]},
              ticks:{
                fontColor:"#858796",
                stepSize: 1,
                padding:20
              },
              beginAtZero: true // This does not seem to be working, push a '0' at the end of the data array as a workaround
            }]
          },
          elements:{
            line:{
              tension: 0
            }
          }
        }
      });

  // Resumen mensual de ventas

  const salesMonthlyCtx = document.getElementById('salesMonthly').getContext('2d');
  const salesMonthly = new Chart(salesMonthlyCtx, {
    type:"line",
    data:{
      labels:monthKeys,
      datasets:[{
        label:"Ventas",
        fill:true,
        data:monthSaleValues,
        backgroundColor:"rgba(78, 115, 223, 0.05)",
        borderColor:"#0861ff"
      }]
    },
    options:{
      maintainAspectRatio:false,
      legend:{
        display:false
      },
      title:{},
      scales:{
        xAxes:[{
          gridLines:{
            color:"rgb(234, 236, 244)",
            zeroLineColor:"rgb(234, 236, 244)",
            drawBorder:false,
            drawTicks:false,
            borderDash:["2"],
            zeroLineBorderDash:["2"],
            drawOnChartArea:false},
            ticks:{
              fontColor:"#858796",
              stepSize: 1,
              padding:20
            }
          }],
          yAxes:[{
            gridLines:{
              color:"rgb(234, 236, 244)",
              zeroLineColor:"rgb(234, 236, 244)",
              drawBorder:false,
              drawTicks:false,
              borderDash:["2"],
              zeroLineBorderDash:["2"]},
              ticks:{
                fontColor:"#858796",
                padding:20,
                callback: function(value, index, values) {
                  return '$ ' + value;
                },
                beginAtZero: true
              }
            }]
          },
          elements:{
            line:{
              tension: 0
            }
          }
        }
      });

}
