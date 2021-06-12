var execOnReady = [];

function setLoginStatus() {
  $(".link-btn").each((i, e) => {
    $(e).toggleClass("inactive");
  });
  $(".for-non-user").hide();
  $(".for-user").show();
}

function setNonLoginStatus() {
  $(".for-non-user").show();
  $(".for-user").hide();
}

function checkLogin(noParamCallback) {
  $.ajax({
    url: "/auth/check",
    method: "get",
    dataType: "json",
    success: function (data) {
      if (data.isLogin) {
        setLoginStatus();
        noParamCallback();
      } else {
        setNonLoginStatus();
      }
    },
  });
}

execOnReady.push(function () {
  $(".logout").click(function () {
    $.ajax({
      url: "/auth/logout",
      method: "delete",
    });
  });
});

$(document).ready(function () {
  for (var i in execOnReady) {
    if (typeof execOnReady[i] === "function") {
      execOnReady[i]();
    }
  }

  execOnReady.length = 0;
});
