(function() {
    var CPS = {};
    CPS.sycm = {};

    CPS.sycm.getShopSummary = function(name,token){
        setTimeout(function() {

            var date = new Date();
            var startDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 7);
            var endDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate() - 1);
            $.ajax({
                url: 'https://diy.sycm.taobao.com/execute/preview.json?date=' + startDate + "," + endDate + '&dateId=1006960&dateType=static&desc=&filter=[6,7]&id=null&itemId=null&name=&owner=user&show=[{%22id%22:1007113},{%22id%22:1016040},{%22id%22:1007117},{%22id%22:1006972},{%22id%22:1007572},{%22id%22:1006976},{%22id%22:1007122},{%22id%22:1016031},{%22id%22:1007126},{%22id%22:1006979},{%22id%22:1007581},{%22id%22:1006984}]&sycmToken='+token,
                dataType: 'json',
                type: 'get',
                success: function (resp) {
                    chrome.extension.sendMessage({resp: resp, nick: name, type: 'trade'});
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
                            payAmt: resp.content.data.payAmt.trend,
                            nick: name,
                            type: 'PAYAMT'
                        });
                        chrome.extension.sendMessage({resp: resp, nick: name, type: 'totalTrade'});
                    }
                },
                error: function () {
                    alert("data error!!");
                }
            });
        },1000);
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
        return m;
    };

    CPS.sycm.init = function(){
        var d = $(".shop-info .shop-title");
        if(d){
            var name = d.text().trim();
            var shopcatname = $(".shop .cate-name").text().trim();

            var m = CPS.sycm.microdata();
            var token = m["token"];
            CPS.sycm.token = token;
            CPS.sycm.userId = m["userId"];
            console.log(m);
            if(name && token) {

                chrome.extension.sendMessage({shopname: name,usernumid:CPS.sycm.userId,shopcatname:shopcatname,type: 'SHOP_CLOUD_UPDATE'}, function (resp) {});
                chrome.extension.sendMessage({nick: name, type: 'HAS_GET_PAY_AMT'}, function (resp) {
                    console.log(resp);
                    if (!resp.hasget)
                        CPS.sycm.getShopSummary(name,token.trim());
                });
            }
        }else {
            setTimeout(function() {CPS.sycm.init()},2000);
        }
    };

    setTimeout(function() {
        CPS.sycm.init();

    },1000);


})($);





