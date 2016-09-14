/**
 * @author oShine
 */
var CPS = {};
CPS.app = {};
CPS.app.versionId = function(vStr){
    var a = vStr.split(".");
    if(a.length>=4){
        return a[0]*10000+a[1]*1000+a[2]*100+a[3]*10;
    }else if(a.length>=3){
        return a[0]*10000+a[1]*1000+a[2]*100;
    }else if(a.length>=2){
        return a[0]*10000+a[1]*1000;
    }
    return  a[0]*10000;
};

CPS.app.initVersion = function(response){
    var pluginElem = $(".plugin-version");

    if(pluginElem && pluginElem.size()>0){
        var needVersion = CPS.app.versionId($(".plugin-version").attr("data-version"));
        var installVersion = CPS.app.versionId(response.version);

        $(".plugin-version .label").html(response.version);
        if(needVersion > installVersion) {
            $(".plugin-version .label").removeClass("label-success").addClass("label-danger");
            window.postMessage({type:'CPSTOOLS_EXTENSION_INSTALL',upgrade:true,version:response.version},'*');
        }else {
            $(".plugin-version .label").removeClass("label-danger").addClass("label-success");
            window.postMessage({type:'CPSTOOLS_EXTENSION_INSTALL',upgrade:false,version:response.version},'*');
        }

    }

};

window.addEventListener('message',function(event){
    if(event && event.data && event.data.type) {
        switch (event.data.type) {
            case "alertMessage":
                chrome.extension.sendMessage({type: "alertMessage",title:event.data.title,message:event.data.message});
                break;
        }
    }
});

$(document).ready(function(){

    chrome.extension.sendMessage({type: "VERSION"},function(response){

        CPS.app.initVersion(response);

        $("head").append("<meta name='CPSTools' content='"+response.version+"'/>");

        $("body").find(".quick_login_btn").attr("extension", response.version);

        $("body").delegate('.quick_login_btn', 'click', function () {
            var loginname = $(".user").find("span").text().trim();
            var _this = $(this);
            var nick = _this.attr("data-nick");
            var username = _this.attr("data-username");
            var password = _this.attr("data-password");
            chrome.extension.sendMessage({username: username, password: password, nick: nick, type: "LOGIN",loginType:_this.attr("login-type")});

            $.ajax({
                url:"http://cps.da-mai.com/user/loginshop/source.html",
                dataType:"json",
                type:"post",
                data:{nick:nick,login_type:_this.attr("login-type"),username:loginname}
            });
            return false;
        });

    });



});






