document.getElementById('freePlan').onclick = callFree;

function callFree(e){ // Switch to free plan
  $.ajax({
    type: "POST",
    url: "https://api.aliachile.com/dev/subscription/cancel",
    headers: {
        Authorization: 'Bearer ' + Cookies.get("token")
    },
    dataType: 'json',
    success: function (result, status, xhr) {
      window.location.replace('/billing');
    },
    error: function (xhr, status, error) {
      console.log(error);
    }
  });
}
