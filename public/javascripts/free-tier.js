document.getElementById('freePlan').onclick = callFree;

function callFree(e){ // Switch to free plan
  $.ajax({
    type: "GET",
    url: "https://api.aliachile.com/dev/subscription/cancel",
    headers: {
        Authorization: 'Bearer ' + Cookies.get("token")
    },
    dataType: 'json',
    success: function (result, status, xhr) {
      e.preventDefault();
      window.location.replace('/billing');
    },
    error: function (xhr, status, error) {
      console.log(error);
    }
  });
}
