/**
 * @author james
 */
$("body").delegate('.zhitongche', 'click', function () {
    var _this = $(this);
    var nick = _this.attr("data-nick");
    var url = _this.attr("data-url");
    var version  = _this.attr("data-version");
    if(version == 5 ){
        subwayRg(url,nick);
    }else{
        subwayRj(url,nick);
    }

    /* $.ajax({
     url: url,
     dataType: 'json',
     type: 'post',
     data: {nick: nick},
     success: function (resp) {
     chrome.extension.sendMessage({username: resp.data.authNick, password: resp.data.authPassword, nick: nick, type: "subway"});
     },
     error: function () {
     alert('网络错误，请联系开发人员');
     }
     });*/
    return false;
});

$("body").delegate('.shenyicanmou', 'click', function () {
    var _this = $(this);
    var nick = _this.attr("data-nick");
    var url = _this.attr("data-url");
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        data: {nick: nick},
        success: function (resp) {
            chrome.extension.sendMessage({username: resp.data.mainAccount, password: resp.data.mainPassword, nick: nick, loginType: "sycm",type:"LOGIN2"});
        },
        error: function () {
            alert('网络错误，请联系开发人员');
        }
    });
    return false;
});

/*$("body").delegate('.semtaobao', 'click', function () {
 var _this = $(this);
 var nick = _this.attr("data-nick");
 var url = _this.attr("data-url");
 $.ajax({
 url: url,
 dataType: 'json',
 type: 'post',
 data: {nick: nick},
 success: function (resp) {
 chrome.extension.sendMessage({username: resp.data.semAccount, password: resp.data.semPassword, nick: nick, type: "semtaobao"});
 },
 error: function () {
 alert('网络错误，请联系开发人员');
 }
 });
 return false;
 });*/



function subwayRj(url,nick){
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        data: {nick: nick},
        success: function (resp) {
            chrome.extension.sendMessage({username: resp.data.authNick, password: resp.data.authPassword, nick: nick, loginType: "subway",type:"LOGIN2"});
        },
        error: function () {
            alert('网络错误，请联系开发人员');
        }
    });
}


function subwayRg(url,nick){
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        data: {nick: nick},
        success: function (resp) {
            chrome.extension.sendMessage({username: resp.data.semAccount, password: resp.data.semPassword, nick: nick, loginType: "semtaobao",type:"LOGIN2"});
        },
        error: function () {
            alert('网络错误，请联系开发人员');
        }
    });
}





