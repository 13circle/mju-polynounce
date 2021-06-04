var execOnReady = [];

$(document).ready(function () {
  for (var i in execOnReady) {
    if (typeof execOnReady[i] === "function") {
      execOnReady[i]();
    }
  }

  execOnReady.length = 0;
});
