/**
 * Created by ouyangjunqiu on 16/4/13.
 */

var loginTypeText = function(type){
    var text = "未知";
    switch(type){
        case 'zuanshi':
            return "钻石展位";
            break;
        case 'shenyicanmou':
            return "生意参谋";
            break;
        case 'zhitongche':
            return "直通车";
            break;
        case 'dmp':
            return "达摩盘";
            break;
        case 'branding':
            return "品销宝";
            break;

    }
    return text;
};

$(document).ready(function(){
    var history = window.localStorage.getItem("login.history.list");
    var histoyList = [];
    if(history) histoyList = JSON.parse(history);

    var li = [];
    $.each(histoyList,function(){
        var p = "<li data-json='"+JSON.stringify(this)+"'><p>"+this.nick+"</p>"+
            "<small>登入:"+loginTypeText(this.loginType)+"</small>"+
            "</li>";
        li.push(p);
    });

    $(".login_itemlist_wrap").html("<ul>"+li.join("")+"</ul>");

    $(".login_itemlist_wrap li").click(function(){
        var json = $(this).attr("data-json");
        var req = JSON.parse(json);
        chrome.extension.sendMessage(req);
    })
});