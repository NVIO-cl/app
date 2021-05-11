Chart.defaults.global.defaultFontFamily= 'Poppins'

const topSellersCtx = document.getElementById('topSellers').getContext('2d');
const topSellers = new Chart(topSellersCtx, {
  type: 'bar',
  data: {
      labels: ['Galletas Chocolate', 'Alfajores', 'Tortas', 'Chocolate Blanco', 'Mazapán'],
      datasets: [{
          label: '# of Sales',
          data: [12, 19, 3, 5, 2, 0],
          backgroundColor: 'rgba(8, 97, 255, 0.2)',
          borderWidth: 0,
          hoverBorderColor: 'rgb(8, 97, 255)',
          hoverBorderWidth: 1
      }]
  },
  options: {
      responsive: true,
      scales: {
        x: {
          color: 'rgba(0, 0, 0, 0)'
        },
        y: {
          beginAtZero: true
        },
        min: 0
      },
  }
});

const salesBreakdownCtx = document.getElementById('salesBreakdown').getContext('2d');
const salesBreakdown = new Chart(salesBreakdownCtx, {
  type: 'line',
  data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'Jun', 'Jul'],
      datasets: [{
          label: '# of Sales',
          data: [12, 19, 3, 5, 2, 18, 0],
          backgroundColor: 'rgba(8, 97, 255, 0.2)',
          borderWidth: 0,
          hoverBorderColor: 'rgb(8, 97, 255)',
          hoverBorderWidth: 1
      }]
  },
  options: {
      responsive: true,
      scales: {
        x: {
          color: 'rgba(0, 0, 0, 0)'
        },
        y: {
          beginAtZero: true
        },
        min: 0
      },
  }
});

const perLocalityCtx = document.getElementById('perLocality').getContext('2d');
const perLocality = new Chart(perLocalityCtx, {
  type: 'pie',
  data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
          label: '# of Sales',
          data: [7, 1, 3, 5, 2, 3],
          backgroundColor: 'rgba(8, 97, 255, 0.2)',
          borderColor: '#fff',
          borderWidth: 2,
          hoverBackgroundColor: 'rgb(8, 97, 255)',
          hoverBorderWidth: 0
      }]
  },
  options: {
      responsive: true,
      scales: {
        x: {
        },
        y: {
          beginAtZero: true
        },
        min: 0
      },
  }
});

const ordersBreakdownCtx = document.getElementById('ordersBreakdown').getContext('2d');
const ordersBreakdown = new Chart(ordersBreakdownCtx, {
  type: 'line',
  data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'Jun', 'Jul'],
      datasets: [{
          label: '# of Sales',
          data: [12, 19, 3, 5, 2, 18, 0],
          backgroundColor: 'rgba(8, 97, 255, 0.2)',
          borderWidth: 0,
          hoverBorderColor: 'rgb(8, 97, 255)',
          hoverBorderWidth: 1
      }]
  },
  options: {
      responsive: true,
      scales: {
        x: {
          color: 'rgba(0, 0, 0, 0)'
        },
        y: {
          beginAtZero: true
        },
        min: 0
      },
  }
});
