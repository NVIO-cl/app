Chart.defaults.global.defaultFontFamily= 'Nunito'

const perLocalityCtx = document.getElementById('perLocality').getContext('2d');
const perLocality = new Chart(perLocalityCtx, {
  type:"doughnut",
  data:{
    labels:["Direct","Social","Referral"],
    datasets:[{
      label:"Channel",
      data:["5","30","15"],
      backgroundColor:["#0861ff","#0d87f0","#03f5f5"],
      borderColor: "#fff",
      borderWidth: 3,
      hoverBorderWidth: 0
    }]
  },
  options:{
    maintainAspectRatio:false,
    legend:{
      display:false
    }
  }
  });

const perPeriodCtx = document.getElementById('perPeriod').getContext('2d');
const perPeriod = new Chart(perPeriodCtx, {
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
        }
      }
    });

const topSellersCtx = document.getElementById('topSellers').getContext('2d');
const topSellers = new Chart(topSellersCtx, {
  type:"bar",
  data:{
    labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
    datasets:[{
      label:"Earnings",
      fill:true,
      data:["37000","10000","8000","4000","7600","2050","7000","2000"],
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
          }]
        }
      }
    });

    const trackMonthCtx = document.getElementById('trackMonth').getContext('2d');
    const trackMonth = new Chart(trackMonthCtx, {
      type:"line",
      data:{
        labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
        datasets:[{
          label:"Earnings",
          fill:true,
          data:["3700","100","8000","4000","7600","2050","7000","2000"],
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
            }
          }
        });
