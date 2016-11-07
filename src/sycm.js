(function() {
    var CPS = {};
    CPS.sycm = {};

    CPS.sycm.postdata = function(uri,data){
        chrome.extension.sendMessage({
            uri:uri,
            data:data,
            type: 'SYCMDATA'
        });
    };

    CPS.sycm.getShopTrade = function(){
        var m = CPS.sycm.micro;
        var date = new Date();
        var startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 7);
        var endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 1);
        $.ajax({
            url: 'https://sycm.taobao.com/bda/summary/getShopSummaryTrend.json',
            dataType: 'json',
            data:{dateRange:endDate + "|" + endDate,dateType:"day",device:0,indexCode:"payAmt"},
            type: 'get',
            success: function (resp) {
                console.log(resp);
                if(resp && resp.data && resp.data.payAmt) {
                    CPS.sycm.postdata("/zuanshi/trade/source",{
                        payAmt: JSON.stringify(resp.data.payAmt),
                        nick: CPS.sycm.nick,
                        usernumid: m.runAsUserId,
                        shopname: CPS.sycm.shopname,
                        shopid: m.runAsShopId
                    });
                }
            },
            error: function () {
                alert("data error!!");
            }
        });

    };

    CPS.sycm.getShopUv = function(){
        var m = CPS.sycm.micro;
        var date = new Date();
        var startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 7);
        var endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 1);
        $.ajax({
            url: 'https://sycm.taobao.com/bda/summary/getShopSummaryTrend.json',
            dataType: 'json',
            data:{dateRange:endDate + "|" + endDate,dateType:"day",device:0,indexCode:"uv"},
            type: 'get',
            success: function (resp) {
                console.log(resp);
                if(resp && resp.data && resp.data.uv) {
                    CPS.sycm.postdata("/sycm/uv/source",{
                        uv: JSON.stringify(resp.data.uv),
                        nick: CPS.sycm.nick,
                        usernumid: m.runAsUserId,
                        shopname: CPS.sycm.shopname,
                        shopid: m.runAsShopId
                    });
                }
            },
            error: function () {
                alert("data error!!");
            }
        });

    };

    CPS.sycm.getShopPaypct = function(){
        var m = CPS.sycm.micro;
        var date = new Date();
        var startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 7);
        var endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 1);
        $.ajax({
            url: 'https://sycm.taobao.com/bda/summary/getShopSummaryTrend.json',
            dataType: 'json',
            data:{dateRange:endDate + "|" + endDate,dateType:"day",device:0,indexCode:"payPct"},
            type: 'get',
            success: function (resp) {
                console.log(resp);
                if(resp && resp.data && resp.data.payPct) {
                    CPS.sycm.postdata("/sycm/paypct/source",{
                        pct: JSON.stringify(resp.data.payPct),
                        nick: CPS.sycm.nick,
                        usernumid: m.runAsUserId,
                        shopname: CPS.sycm.shopname,
                        shopid: m.runAsShopId
                    });
                }
            },
            error: function () {
                alert("data error!!");
            }
        });

    };

    CPS.sycm.getShopRanking = function(){
        var m = CPS.sycm.micro;
        $.ajax({
            url:'https://sycm.taobao.com/portal/rank/getShopRank.json',
            dataType:'json',
            type:'get',
            data:{_:(new Date()).getTime()},
            success: function (resp) {
                if(resp && !resp.hasError){
                    CPS.sycm.postdata("/sycm/ranking/source",{
                        data: JSON.stringify(resp.content.data),
                        nick: CPS.sycm.nick,
                        usernumid: m.runAsUserId,
                        shopname: CPS.sycm.shopname,
                        shopid: m.runAsShopId
                    });
                }
            }
        })
    };

    CPS.sycm.microdata = function(){
        var microdata = $("meta[name=microdata]").attr("content");
        var data = microdata.split(";");
        var m = {};
        $.each(data,function(){
            var r = this.split("=");
            if(r && r.length>=2){
                m[r[0]] = r[1];
            }
        });
        CPS.sycm.micro = m;
        return m;
    };

    CPS.sycm.init = function(){
        var n = $(".ebase-Frame__shopLogin .ebase-Frame__shopName>span")[1];

        if(n){
            CPS.sycm.nick = $(n).text().split(":")[0].trim();
            CPS.sycm.microdata();
            var m = CPS.sycm.micro;

            if(m && m.legalityToken){
                CPS.sycm.run();
            }
        }else {
            setTimeout(function() {CPS.sycm.init()},2000);
        }
    };

    CPS.sycm.run = function(){

        var shopcatname = $("[data-card-id='IndustryRank']").find(".SIndustryRankSIndustryRank__type").text().trim();
        var shopname = $("[data-card-id='IndustryRank']").find(".SIndustryRankSIndustryRank__rankTitle").text().trim();
        if(shopcatname && shopname){
            var m = CPS.sycm.micro;

            CPS.sycm.shopname = shopname;
            console.log(CPS.sycm.nick,CPS.sycm.shopname,shopcatname);
            chrome.extension.sendMessage({shopname: CPS.sycm.shopname,usernumid:m.mainUserId,nick:CPS.sycm.nick,shopcatname:shopcatname,type: 'SHOP_CLOUD_UPDATE'});

            chrome.extension.sendMessage({type: "SETTING_SYCMCTL"},function(resp){
                if(resp){
                    chrome.extension.sendMessage({nick: CPS.sycm.shopname, type: 'HAS_GET_PAY_AMT'}, function (resp) {
                        if (!resp.hasget) {
                            CPS.sycm.getShopTrade();
                            CPS.sycm.getShopUv();
                            CPS.sycm.getShopPaypct();
                            CPS.sycm.getShopRanking();
                        }
                    });
                }

            });
        }else {
            setTimeout(function() {CPS.sycm.run()},2000);
        }


    };

    $(document).ready(function(){

        setTimeout(function() {
            CPS.sycm.init();

        },4000);
    });

})($);





