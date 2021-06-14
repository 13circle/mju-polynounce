function renderMJUHomeAnncmnts(parentSelector) {
  var $table = $("<table>");
  var $thead = $("<thead>");
  var $tbody = $("<tbody>");

  $table.addClass("anncmnts");
  $table.addClass("for-user");
  $table.attr("id", "mju-home");
  $table.css("margin", "1em");

  $table.append($thead);
  $table.append($tbody);

  var $trHead1 = $("<tr>");
  var $trHead2 = $("<tr>");
  var $thHead1 = $("<th>");
  var $thHeads = [];

  $thead.append($trHead1);
  $thead.append($trHead2);

  $trHead1.append($thHead1);
  for (var i = 0; i < 3; i++) {
    $thHeads.push($("<th>"));
    $trHead2.append($thHeads[i]);
  }

  $thHead1.text("명지대학교 홈페이지 공지사항");
  $thHead1.attr("colspan", "3");
  $thHeads[0].text("번호");
  $thHeads[1].text("제목");
  $thHeads[2].text("게시일");

  $.ajax({
    url: "/anncmnt/mju-home",
    method: "get",
    success: function (data) {
      var generalAnncmnts = data.General;

      for (var i in generalAnncmnts) {
        var $tr = $("<tr>");
        $tbody.append($tr);
        $tr.append($td1);
        $tr.append($td2);
        $tr.append($td3);
        var $td1 = $("<td>");
        var $td2 = $("<td>");
        var $td3 = $("<td>");
        var $a = $("<a>");
        var n = i;
        $td1.text(++n);
        $td2.append($a);
        $a.attr(
          "href",
          "https://mju.ac.kr" + generalAnncmnts[i].GeneralAnncmnt.Post.boardUri
        );
        $a.attr("target", "blank");
        $a.text(generalAnncmnts[i].GeneralAnncmnt.Post.title);
        $td3.text(
          new Date(
            generalAnncmnts[i].GeneralAnncmnt.Post.uploadedAt
          ).toLocaleDateString("ko")
        );
      }

      $table.appendTo(parentSelector);
    },
  });
}
