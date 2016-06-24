$(document).ready(function(){
    chrome.extension.sendMessage({type: "VERSION"},function(response){
        $("head").append("<meta name='CPSTools' content='"+response.version+"'/>");
    });
});


/**
 * @author kevin
 */
$("body").delegate('.auto_login_subway','click',function(){
    var _this = $(this);
    var authNick = _this.parents('tr').find('.authNick').text();
    var authNickPassword = _this.parents('tr').find('.authNickPassword').text();
    var nick = _this.parents('tr').find('.nick').text();
    if(!authNick || !authNickPassword){
        var subAccount = _this.parents('tr').find('.subAccount').text();
        var subPassword = _this.parents('tr').find('.subPassword').text();
        if(!subAccount || !subPassword){
            alert("获取帐号信息失败,请录入相应的帐号信息!");
            return ;
        }else{
            chrome.extension.sendMessage({username: subAccount,password:subPassword,nick:nick,loginType:"subway",type:"LOGIN3"});

        }
    }else{
        chrome.extension.sendMessage({username: authNick,password:authNickPassword,nick:nick,loginType:"subway",type:"LOGIN3"});

    }
    return false;

});

$('body').delegate('.auto_login_sellerCenter','click',function(){
    var _this = $(this);
    var subAccount = _this.parents('tr').find('.subAccount').text();
    var subPassword = _this.parents('tr').find('.subPassword').text();
    var nick = _this.parents('tr').find('.nick').text();
    if(!subAccount || subAccount.length < 1)
    {
        alert('没有子账号，请联系相关人员');
        return ;
    }
    if(!subPassword || subPassword.length < 1)
    {
        alert('没有子密码，请联系相关人员');
        return ;
    }
    chrome.extension.sendMessage({username: subAccount,password:subPassword,nick:nick,loginType:"center",type:"LOGIN3"});

    return false;
});

$('body').delegate('.diamond','click',function(){
    var _this = $(this);
    var subAccount = _this.parents('tr').find('.subAccount').text();
    var subPassword = _this.parents('tr').find('.subPassword').text();
    var nick = _this.parents('tr').find('.nick').text();

    if(!subAccount || subAccount.length < 1)
    {
        alert('没有子账号，请联系相关人员');
        return ;
    }
    if(!subPassword || subPassword.length < 1)
    {
        alert('没有子密码，请联系相关人员');
        return ;
    }
    chrome.extension.sendMessage({username: subAccount,password:subPassword,nick:nick,loginType:"diamond",type:"LOGIN3"});

    return false;
});

