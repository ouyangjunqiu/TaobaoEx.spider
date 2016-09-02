(function() {
    var CPS = {};
    CPS.sycm = {};

    CPS.sycm.getShopSummary = function(){
        setTimeout(function() {
            var m = CPS.sycm.micro;
            var token = m.token;
            var date = new Date();
            var startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 7);
            var endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 1);
            $.ajax({
                url: 'https://diy.sycm.taobao.com/execute/preview.json?date=' + startDate + "," + endDate + '&dateId=1006960&dateType=static&desc=&filter=[6,7]&id=null&itemId=null&name=&owner=user&show=[{%22id%22:1007113},{%22id%22:1016040},{%22id%22:1007117},{%22id%22:1006972},{%22id%22:1007572},{%22id%22:1006976},{%22id%22:1007122},{%22id%22:1016031},{%22id%22:1007126},{%22id%22:1006979},{%22id%22:1007581},{%22id%22:1006984}]&sycmToken='+token,
                dataType: 'json',
                type: 'get',
                success: function (resp) {
                    chrome.extension.sendMessage({resp: resp, nick:CPS.sycm.shopname , type: 'trade'});
                },
                error: function () {
                    alert("data error!!");
                }
            });
            $.ajax({
                url: 'https://bda.sycm.taobao.com/summary/getShopSummary.json?date  Range=' + endDate + "|" + endDate + '&dateType=day&dateType=day&sycmToken='+token,
                dataType: 'json',
                type: 'get',
                success: function (resp) {
                    // console.log(resp);
                    if(resp.content && resp.content.data && resp.content.data.payAmt &&  resp.content.data.payAmt.trend) {
                        chrome.extension.sendMessage({
                            payAmt: JSON.stringify(resp.content.data.payAmt.trend),
                            nick: CPS.sycm.shopname,
                            usernumid: m.userId,
                            type: 'PAYAMT'
                        });
                        chrome.extension.sendMessage({resp: resp, nick: CPS.sycm.shopname, type: 'totalTrade'});
                    }
                },
                error: function () {
                    alert("data error!!");
                }
            });
        },1000);
    };

    CPS.sycm.getShopSummary2 = function(){
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
                if(resp.content && resp.content.data && resp.content.data.payAmt) {
                    chrome.extension.sendMessage({
                        payAmt: JSON.stringify(resp.content.data.payAmt),
                        nick: m.runAsUserName,
                        usernumid: m.runAsUserId,
                        shopname: m.runAsShopTitle,
                        shopid: m.runAsShopId,
                        type: 'PAYAMT'
                    });
                    //chrome.extension.sendMessage({resp: resp, nick: m.runAsUserName, type: 'totalTrade'});
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
                    chrome.extension.sendMessage({
                        data: JSON.stringify(resp.content.data),
                        nick: m.runAsUserName,
                        usernumid: m.runAsUserId,
                        shopname: m.runAsShopTitle,
                        shopid: m.runAsShopId,
                        type: 'SHOP_RANKING'
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
        var d = $(".shop-info .shop-title");
        if(d){
            var name = d.text().trim();
            CPS.sycm.microdata();
            CPS.sycm.shopname = name;
            var m = CPS.sycm.micro;

            if(m && m.token) {
                CPS.sycm.run();
            }else if(m && m.legalityToken){
                CPS.sycm.run2();
            }
        }else {
            setTimeout(function() {CPS.sycm.init()},2000);
        }
    };

    CPS.sycm.run = function(){
        var m = CPS.sycm.micro;
        var shopcatname = $(".shop .cate-name").text().trim();

        chrome.extension.sendMessage({shopname: CPS.sycm.shopname,usernumid:m.userId,shopcatname:shopcatname,type: 'SHOP_CLOUD_UPDATE'}, function (resp) {});
        chrome.extension.sendMessage({nick: name, type: 'HAS_GET_PAY_AMT'}, function (resp) {
            console.log(resp);
            if (!resp.hasget)
                CPS.sycm.getShopSummary();
        });

    };


    CPS.sycm.run2 = function(){
        var m = CPS.sycm.micro;

        var shopcatname = $("[data-card-id='IndustryRank']").find(".SIndustryRankSIndustryRank__type").text().trim();
        console.log(shopcatname);
        chrome.extension.sendMessage({shopname: m.runAsShopTitle,shopid: m.runAsShopId,usernumid:m.runAsUserId,nick: m.runAsUserName,shopcatname:shopcatname,type: 'SHOP_CLOUD_UPDATE'}, function (resp) {});
        chrome.extension.sendMessage({nick: m.runAsShopTitle, type: 'HAS_GET_PAY_AMT'}, function (resp) {
            console.log(resp);
            if (!resp.hasget)
                CPS.sycm.getShopSummary2();
        });

        CPS.sycm.getShopRanking();
    };

    $(document).ready(function(){
        setTimeout(function() {
            CPS.sycm.init();

        },4000);
    });

})($);





