Chart.defaults.global.defaultFontFamily = 'Nunito';

function chartEm(weekly, monthly){
  const latestMonth = monthly.slice(-1)[0];

  // Top sellers
  console.log(latestMonth.productQuantity.length)
  var productKeys = [];
  var productCounts = [];

  for(var i = 0; i < latestMonth.productQuantity.length; i++){
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
  const ordersMonthlyCtx = document.getElementById('ordersMonthly').getContext('2d');
  const ordersMonthly = new Chart(ordersMonthlyCtx, {
    type:"line",
    data:{
      labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
      datasets:[{
        label:"Earnings",
        fill:true,
        data:["37000","10000","8000","4000","7600","2050","7000","2000"],
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
                padding:20
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

  // Resumen mensual de ventas
  const salesMonthlyCtx = document.getElementById('salesMonthly').getContext('2d');
  const salesMonthly = new Chart(salesMonthlyCtx, {
    type:"line",
    data:{
      labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
      datasets:[{
        label:"Earnings",
        fill:true,
        data:["37000","10000","8000","4000","7600","2050","7000","2000"],
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
                padding:20
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
