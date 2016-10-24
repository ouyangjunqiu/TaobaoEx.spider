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
    });

    $("[data-role=sycmctl]").click(function(){
        var status = $(this).attr("data-status") && $(this).attr("data-status") == "on";
        if(status){
            $(this).html("关闭");
            $(this).attr("data-status","off");
            $(this).removeClass("on").addClass("off");
            window.localStorage.setItem("cps.setting.sycmctl","off");
        }else{
            $(this).html("开启");
            $(this).attr("data-status","on");
            $(this).removeClass("off").addClass("on");
            window.localStorage.setItem("cps.setting.sycmctl","on");
        }
    });

    var status = window.localStorage.getItem("cps.setting.sycmctl");
    status = !(status && status == "off");
    if(status){
        $("[data-role=sycmctl]").html("开启");
        $("[data-role=sycmctl]").attr("data-status","on");
        $("[data-role=sycmctl]").removeClass("off").addClass("on");

    }else{
        $("[data-role=sycmctl]").html("关闭");
        $("[data-role=sycmctl]").attr("data-status","off");
        $("[data-role=sycmctl]").removeClass("on").addClass("off");
    }
});