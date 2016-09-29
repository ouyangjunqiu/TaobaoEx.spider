var CPS = {};
CPS.request = {};
CPS.tabId = 0;
CPS.saveLoginRecord = function(obj){
    if(!window.localStorage){
        return false;
    }

    var data = window.localStorage.getItem("login.history.list");
    var list = [];
    if(data){
        list = JSON.parse(data);
        if(list && list.length >0){
            if(list.length >=5){
                list.shift();
            }
        }else{
            list = [];
        }
    }

    list.unshift(obj);
    window.localStorage.setItem("login.history.list",JSON.stringify(list));
};

CPS.saveTab = function(tabId){
    if(!window.localStorage){
        return false;
    }

    var data = window.localStorage.getItem("login.tab.ids");
    var list = [];
    if(data){
        list = JSON.parse(data);
        if(list && list.length >0){
            if(list.length >=5){
                list.shift();
            }
        }else{
            list = [];
        }
    }

    list.unshift(tabId);
    window.localStorage.setItem("login.tab.ids",JSON.stringify(list));
};

CPS.validateTab = function(tabId){
    if(tabId == CPS.tabId)
        return true;

    if(window.localStorage){
        var data = window.localStorage.getItem("login.tab.ids");
        if(data){
            var list = JSON.parse(data);
            if(list && list.length >0){
                for(var i in list){
                    if(list[i] == tabId)
                        return true;
                }
            }
        }
    }
    return false;
};

CPS.getLoginRecord = function(){
    if(CPS.request)
        return CPS.request;

    if(window.localStorage){
        var data = window.localStorage.getItem("login.history.list");
        if(data){
            var list = JSON.parse(data);
            if(list && list.length >0){
                return list[list.length-1];
            }
        }
    }
    return null;
};

CPS.tradeRequest = function(message,nick,type){
    return $.ajax({
        url:"http://yj.da-mai.com/index.php?r=api/trade",
        //url:"http://localhost/yj/index.php?r=api/trade",
        dataType: 'json',
        type: 'post',
        data: {trade: message,nick:nick,type:type}
    });
};


chrome.webNavigation.onDOMContentLoaded.addListener(function(details){

    var info = CPS.getLoginRecord();
    if(info && CPS.validateTab(details.tabId)){
        var re = /^http:\/\/sem.taobao.com\/index.do#!\/customers\/exists\/list\/*/ig;
        if(details.url == "https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://subway.simba.taobao.com:80/entry/login.htm"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://sycm.taobao.com"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "http://subway.simba.taobao.com/#!/login?target=member&code=200"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "https://login.taobao.com/?enup=false"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "https://login.taobao.com/member/login.jhtml?redirectURL=http%3A%2F%2Fsubway.simba.taobao.com%3A80%2Fentry%2Flogin.htm"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "https://login.taobao.com/member/login.jhtml"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == "https://unit.login.taobao.com/member/login.jhtml?redirectURL=http%3A%2F%2Fsubway.simba.taobao.com%3A80%2Fentry%2Flogin.htm"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url=="https://login.taobao.com/member/login.jhtml?redirectURL=http%3A%2F%2Fsycm.taobao.com"){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url.indexOf("//login.taobao.com/member/login.jhtml")){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url.indexOf("//www.alimama.com/member/login.htm")){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url.indexOf("mai.taobao.com")){
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(details.url == 'http://sem.taobao.com/index.do') {
            chrome.tabs.sendMessage(details.tabId,info);
        }else if(re.test(details.url)){
            chrome.tabs.sendMessage(details.tabId,info);
        }
    }

});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type){
        case 'VERSION':
            sendResponse(chrome.app.getDetails());
            break;
        case 'LOGIN':

            switch (request.loginType){
                case 'zuanshi':
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml?sub=true&slideCodeShow=false&from=subway&full_redirect=false&tpl_redirect_url=http://zuanshi.taobao.com/indexbp.html",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                case 'shenyicanmou':
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://sycm.taobao.com",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                case 'zhitongche':
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://subway.simba.taobao.com:80/entry/login.htm",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                case 'dmp':
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://dmp.taobao.com/index.html#!/data/shop",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                case 'branding':
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml?sub=true&from=subway&enup=false&full_redirect=false&tpl_redirect_url=http://branding.taobao.com/#!/home",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                case 'tbk':
                    chrome.tabs.create({
                        url:"http://www.alimama.com/member/login.htm?forward=http%3A%2F%2Fad.alimama.com%2Fmyunion.htm",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
                    break;
                default :
                    chrome.tabs.create({
                        url:"https://login.taobao.com/member/login.jhtml",
                        active:true
                    },function(tab){
                        CPS.tabId = tab.id;
                        CPS.saveTab(tab.id);
                    });
            }
            CPS.request = request;
            CPS.saveLoginRecord(request);
            break;
        case 'LOGIN2':
            if(request.loginType == 'subway'){
                chrome.tabs.create({
                    url:"https://login.taobao.com/member/login.jhtml?sub=true&style=miniall&from=subway&full_redirect=false&tpl_redirect_url=http://subway.simba.taobao.com:80/entry/login.htm",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });
            }else if(request.loginType == 'sycm'){
                chrome.tabs.create({
                    url:"https://login.taobao.com/member/login.jhtml?sub=true&style=miniall&from=subway&full_redirect=false&tpl_redirect_url=http://sycm.taobao.com",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });

            }else if(request.loginType == 'semtaobao'){
                chrome.tabs.create({
                    //url:"https://sem.taobao.com/login.html",
                    url:"https://login.taobao.com/member/login.jhtml?style=miniall&sub=true&from=subway&tpl_redirect_url=http%3A%2F%2Fsem.taobao.com%2Findex.do",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });
            }

            CPS.request = {username:request.username,password:request.password,nick:request.nick};
            CPS.saveLoginRecord(CPS.request);

            break;
        case 'LOGIN3':
            if(request.loginType == 'subway'){
                chrome.tabs.create({
                    url:"https://login.taobao.com/member/login.jhtml?sub=true&style=miniall&from=subway&full_redirect=false&tpl_redirect_url=http://subway.simba.taobao.com:80/entry/login.htm",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });
            }else if(request.loginType == 'center'){
                chrome.tabs.create({
                    url:"https://login.taobao.com/",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });
            }else if(request.loginType == 'diamond'){
                chrome.tabs.create({
                    url:"https://login.taobao.com/member/login.jhtml?sub=true&enup=false&full_redirect=false&tpl_redirect_url=http://zuanshi.taobao.com/indexbp.html",
                    active:true
                },function(tab){
                    CPS.tabId = tab.id;
                    CPS.saveTab(tab.id);
                });
            }
            CPS.request = {username:request.username,password:request.password,nick:request.nick};
            CPS.saveLoginRecord(CPS.request);
            break;
        case 'CLEAR':
            CPS.request = {};
            break;
        case 'SHOPS':
            $.ajax({
                url:"http://cps.da-mai.com/zuanshi/vie/add.html",
                type:"post",
                dataType:"json",
                async:false,
                data:{nick:request.nick,keyword:request.keyword,shops:JSON.stringify(request.shops)}
            });
            sendResponse("OK");
            break;
        case 'SHOP_BID':
            $.ajax({
                url:"http://cps.da-mai.com/zuanshi/vie/set.html",
                type:"post",
                dataType:"json",
                async:false,
                data:{nick:request.nick,keyword:request.keyword,shops:JSON.stringify(request.shops)}
            });
            sendResponse("OK");
            break;
        case 'PAYAMT':
            $.ajax({
                url:"http://cps.da-mai.com/zuanshi/trade/source.html",
                type:"post",
                dataType:"json",
                async:false,
                data:request
            });
            sendResponse("OK");
            break;
        case 'SYCM_UV':
            $.ajax({
                url:"http://cps.da-mai.com/sycm/uv/source.html",
                type:"post",
                dataType:"json",
                async:false,
                data:request
            });
            sendResponse("OK");
            break;
        case 'SYCM_PAYPCT':
            $.ajax({
                url:"http://cps.da-mai.com/sycm/paypct/source.html",
                type:"post",
                dataType:"json",
                async:false,
                data:request
            });
            sendResponse("OK");
            break;

        case 'SHOP_RANKING':
            $.ajax({
                url:"http://cps.da-mai.com/sycm/ranking/source.html",
                type:"post",
                dataType:"json",
                async:false,
                data:request
            });
            sendResponse("OK");
            break;
        case 'HAS_GET_PAY_AMT':
            $.ajax({
                url:"http://cps.da-mai.com/zuanshi/trade/hasget.html",
                type:"post",
                dataType:"json",
                async:false,
                data:{nick:request.nick},
                success:function(data){
                    sendResponse(data);
                }
            });

            break;
        case 'SHOP_CLOUD_UPDATE':
            $.ajax({
                url:"http://cps.da-mai.com/main/shop/cloudupdate.html",
                type:"post",
                dataType:"json",
                data:request
            });
            break;
        case 'trade':
        case 'totalTrade':
            CPS.tradeRequest(request.resp,request.nick,request.type);
            break;
        case 'alertMessage':
            var opt = {
                type: "list",
                title: "消息提醒",
                message: "msg",
                iconUrl: "icon.png",
                items: [
                    { title: request.title, message: request.message }
                ]
            };
            chrome.notifications.create('',opt,function(id){
            });
            break;
        case 'SETTING_SYCMCTL':
            var status = window.localStorage.getItem("cps.setting.sycmctl");
            status = status && status == "on";
            sendResponse(status);
            break;
    }

});
