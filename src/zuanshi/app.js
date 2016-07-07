(function() {
    var CPS = {};
    CPS.app = {};
    CPS.board = {};
    CPS.campaign = {};
    CPS.utils = {};
    CPS.layout = {};
    CPS.time = {};
    CPS.dmp = {};
    CPS.adgroup = {};
    CPS.adzone = {};
    CPS.rpt = {};
    CPS.storage = {};
    CPS.mutex = {};

    /**
     * 存储数据
     * @param k
     * @param v
     * @version 3.1.2
     */
    CPS.storage.set = function(k,v){
        var w = new WebStorageCache();
        w.set(k,v,{exp:8*3600});
    };

    /**
     *
     * @param k
     * @returns {*}
     * @version 3.1.2
     */
    CPS.storage.get = function(k){
        var w = new WebStorageCache();
        return w.get(k);
    };

    /**
     * 检测是否锁定
     * @param i
     * @returns {boolean}
     */
    CPS.mutex.is = function(i){
        var f = new DateFormat();
        var k = "zuanshi.mutex.has."+ CPS.app.shopId+"."+i;
        var d = CPS.storage.get(k);
        var now = f.formatCurrentDate("yyyy-MM-dd");

        return !!(d && (d["d"] == now));
    };
    /**
     * 加锁
     * @param i
     */
    CPS.mutex.lock = function(i){
        var f = new DateFormat();
        var k = "zuanshi.mutex.has."+ CPS.app.shopId+"."+i;
        var c = {d: f.formatCurrentDate("yyyy-MM-dd")};
        CPS.storage.set(k,c);
    };


    CPS.app.start = function () {
        var w = new WebStorageCache();
        w.deleteAllExpires();
        CPS.app.init();
    };

    /**
     * 获取钻展登录帐号名称
     * @version 2.9.6
     */
    CPS.app.init = function () {
        var fn = function () {
            var nick = $("#nickDrop").text();
            console.log(nick);
            if (nick) {
                CPS.app.nick = nick.trim();
                CPS.app.user();
            }else{
                setTimeout(fn,4000);
            }
        };
        fn();
    };


    /**
     * 获取登录用户token信息
     * @version 2.9.6
     */
    CPS.app.user = function () {
        setTimeout(function () {
            $.ajax({
                url: 'http://zuanshi.taobao.com/loginUser/info.json',
                type: 'GET',
                dataType: 'jsonp',
                success: function (data) {
                    CPS.app.csrfID = data.data.csrfID;
                    CPS.app.info = data.data;
                    CPS.app.loginUser = data.data.loginUser;
                    CPS.app.shopId = data.data.loginUser.shopId;
                    CPS.app.postUser();

                    CPS.layout.window();

                    var dateFormat = new DateFormat();
                    var hour = dateFormat.formatCurrentDate("HH");

                    hour = parseInt(hour);
                    if(hour>=8 && hour<=23){
                        CPS.app.getAdvertiserHour();
                        CPS.app.campaignRptnToday();

                        CPS.app.run();
                    }


                    CPS.campaign.alert();
                    CPS.board.alert();

                    CPS.dmp.get();
                }
            });
        }, 1000);
    };

    CPS.dmp.get = function(){
        $.ajax({
            url:"http://zuanshi.taobao.com/dmpcrowdTarget/list.json",
            type:"post",
            dataType:"json",
            data:{csrfID:CPS.app.csrfID},
            success:function(resp){
                if(resp.info && resp.info.ok){
                    CPS.dmp.post(resp.data);
                }
            }
        })
    };

    CPS.dmp.post = function(data){
        $.ajax({
            url:"http://cps.da-mai.com/zuanshi/dmp/source.html",
            type:"post",
            dataType:"json",
            data:{nick:CPS.app.nick,data:JSON.stringify(data)},
            success:function(resp){

            }
        })
    };

    /**
     * 计划过期提醒功能
     * @version 3.0.7
     */
    CPS.campaign.alert = function(){
        var dateFormat = new DateFormat();
        var alertDate = 0;
        var alertDateStr = window.localStorage.getItem("campaign.alert."+CPS.app.shopId);
        if(alertDateStr) {
            alertDate = (dateFormat.parseDate(alertDateStr)).getTime();
        }

        if((new Date()).getTime()>alertDate) {


            CPS.app.findCampaignList(function (data) {
                var campaigns = CPS.app.campaignExpiredDetection(data);
                if (campaigns.length > 0) {
                    var html = CPS.app.campaignAlertBox(campaigns);
                    $("body").append(html);

                    $("#btn-w1").click(function () {
                        $("#CPS_campaign_alert").hide();

                    });

                    $("#btn-w2").click(function () {
                        $("#CPS_campaign_alert").hide();

                        var dateFormat = new DateFormat();
                        var nextDate = dateFormat.addDays(new Date(), 1);
                        window.localStorage.setItem("campaign.alert." + CPS.app.shopId, nextDate);

                    });
                }
            })
        }
    };

    /**
     * 提交用户基本信息
     * @version 2.9.6
     */
    CPS.app.postUser = function(){
        $.ajax({
            url: 'http://cps.da-mai.com/main/shop/cloudupdate.html',
            dataType: 'json',
            data: {nick:  CPS.app.nick,userid:CPS.app.loginUser.userId,shopid:CPS.app.loginUser.shopId,usernumid:CPS.app.loginUser.userNumId},
            type: 'post'
        });
    };

    /**
     * 运行
     * @version 3.1.2
     */
    CPS.app.run = function () {

        CPS.app.accountRpt();
        CPS.app.accountRpt2();

        setTimeout(function(){
            CPS.app.rptnAdboardAll2();
            CPS.app.rptnDestAll2();
            CPS.app.rptnAdzoneAll2();
            CPS.app.rptnDestAdzoneAll2();
            setTimeout(function(){
                CPS.app.rptnAdboardAll();
                CPS.app.rptnDestAll();
                CPS.app.rptnAdzoneAll();
            },4000);
        },1000);
        setTimeout(function(){
            CPS.app.rptnAdboardAll3();
            CPS.app.rptnDestAll3();
            CPS.app.rptnAdzoneAll3();
            CPS.app.rptnDestAdzoneAll3();
            setTimeout(function(){
                CPS.app.rptnAdboardAll4();
                CPS.app.rptnDestAll4();
                CPS.app.rptnAdzoneAll4();
                CPS.app.rptnDestAdzoneAll4();
            },4000);

        },8000);

    };

    /**
     *  获取展示网络报表
     *  @version 3.1.2
     */
    CPS.app.accountRpt = function () {
        if(CPS.mutex.is("rpt1")) return false;

        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            var f = new DateFormat();
            var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
            var b = f.addDays(new Date(), -16, "yyyy-MM-dd");
            $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/advertiserCmDay/all.json',
                dataType: 'json',
                data: {csrfID:  CPS.app.csrfID, startTime: b, endTime: e, campaignModel: 1},
                type: 'get',
                success: function (data) {
                    CPS.app.postAccountRpt(data);
                }
            });

        }, t);
    };

    /**
     * 提交展示网络报表到平台
     * @version 3.1.2
     */
    CPS.app.postAccountRpt = function (rpts) {
        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            $.ajax({
                url: 'http://cps.da-mai.com/zuanshi/rpt/source.html',
                dataType: 'json',
                data: {userinfo: CPS.app.csrfID, rpts: JSON.stringify(rpts), nick: CPS.app.nick},
                type: 'post',
                success: function (data) {
                    CPS.mutex.lock("rpt1")
                }
            });

        }, t);
    };

    /**
     *  获取明星店铺报表
     *  @version 2.9.6
     */
    CPS.app.accountRpt2 = function () {
        if(CPS.mutex.is("rpt2")) return false;
        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            var f = new DateFormat();
            var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
            var b = f.addDays(new Date(), -16, "yyyy-MM-dd");
            $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/advertiserCmDay/all.json',
                dataType: 'json',
                data: {csrfID:  CPS.app.csrfID, startTime: b, endTime: e, campaignModel: 2},
                type: 'get',
                success: function (data) {
                    CPS.app.postAccountRpt2(data);
                }
            });

        }, t);
    };

    /**
     * 提交明星店铺报表到平台
     * @version 2.9.6
     */
    CPS.app.postAccountRpt2 = function (rpts) {
        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            $.ajax({
                url: 'http://cps.da-mai.com/zuanshi/rpt/source2.html',
                dataType: 'json',
                data: {userinfo: CPS.app.csrfID, rpts: JSON.stringify(rpts), nick: CPS.app.nick},
                type: 'post',
                success: function (data) {
                    CPS.mutex.lock("rpt2")
                }
            });

        }, t);
    };

    /**
     * 获取实时数据
     * @version 2.9.6
     */
    CPS.app.getAdvertiserHour = function(){
        var t = parseInt(Math.random()*2000+500);
        setTimeout(function () {
            var dateFormat = new DateFormat();
            var logDateStr = dateFormat.addDays(new Date(), -1, "yyyy-MM-dd");
            $.when(
                $.ajax({
                    url: 'http://zuanshi.taobao.com/index/account.json',
                    dataType: 'json',
                    data: {csrfID: CPS.app.csrfID},
                    type: 'get'
                }),
                $.ajax({
                    url: 'http://zuanshi.taobao.com/rptn/advertiserHour/listSds.json',
                    dataType: 'json',
                    data: {csrfID: CPS.app.csrfID,logDate:logDateStr},
                    type: 'get'
                }),
                $.ajax({
                    url: 'http://zuanshi.taobao.com/rptn/advertiserHour/list.json',
                    dataType: 'json',
                    data: {csrfID: CPS.app.csrfID},
                    type: 'get'
                })
            ).then(function(a,b,c){
                if(a && b && c && a[0] && b[0] && c[0]){
                    if(a[0].data && b[0].data && c[0].data){
                        $.ajax({
                            url: 'http://cps.da-mai.com/zuanshi/advertiser/source.html',
                            dataType: 'json',
                            data: {
                                nick: CPS.app.nick,
                                accountdata: JSON.stringify(a[0].data),
                                yesterdaydata: JSON.stringify(b[0].data),
                                todaydata: JSON.stringify(c[0].data)
                            },
                            type: 'post'
                        })
                    }
                }
            })
        },t);
    };


    /**
     * 获取创意统计报表
     * @version 2.9.7
     *
     */
    CPS.app.rptnAdboardDayList = function(b,e,offset,fn){
        var k = "adboard."+b+"."+e+"."+offset;
        var _k = CPS.app.shopId+"."+k+".data";
        if(offset>0 && CPS.mutex.is(k)){
            return false;
        }else if(offset<=0 && CPS.mutex.is(k)){
            var d = CPS.storage.get(_k);
            fn(d,offset);
            return true;
        }
        var t = parseInt(Math.random()*1000+offset*10);
        var r = function() {

            return $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/adboardDay/list.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    startTime: b,
                    endTime: e,
                    pageSize: 100,
                    offset: offset,
                    campaignModel: 1,
                    campaignName: "",
                    transName: "",
                    adboardName: "",
                    sortField: "charge",
                    sortRule: "desc"
                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data, offset);
                        if(offset<=0){
                            CPS.storage.set(_k,resp.data);
                        }
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取所有的创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdboardAll = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -7, "yyyy-MM-dd");

        CPS.app.rptnAdboardDayList(b,e,0,function(data){

            CPS.app.postRptnAboard(data,0);

            for(var offset = 100;offset < data.count;offset+=100){

                CPS.app.rptnAdboardDayList(b,e,offset,function(rpt,i){

                    CPS.app.postRptnAboard(rpt,i);
                });

            }

        });
    };
    /**
     * 提交创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnAboard = function(data,offset){
        $.ajax({
            url:"http://cps.da-mai.com/zuanshi/adboard/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 获取所有的创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdboardAll2 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -16, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -16, "yyyy-MM-dd");

        CPS.app.rptnAdboardDayList(b,e,0,function(data){

            CPS.app.postRptnAboard2(data,e,0);

            for(var offset = 100;offset < data.count;offset+=100){

                CPS.app.rptnAdboardDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAboard2(rpt,b,i);

                });

            }

        });
    };

    /**
     * 获取所有的创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdboardAll3 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -15, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -15, "yyyy-MM-dd");

        CPS.app.rptnAdboardDayList(b,e,0,function(data){

            CPS.app.postRptnAboard2(data,e,0);

            for(var offset = 100;offset < data.count;offset+=100){

                CPS.app.rptnAdboardDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAboard2(rpt,b,i);

                });

            }

        });
    };

    /**
     * 获取所有的创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdboardAll4 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -17, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -17, "yyyy-MM-dd");

        CPS.app.rptnAdboardDayList(b,e,0,function(data){

            CPS.app.postRptnAboard2(data,e,0);

            for(var offset = 100;offset < data.count;offset+=100){

                CPS.app.rptnAdboardDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAboard2(rpt,b,i);

                });

            }

        });
    };
    /**
     * 提交创意统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnAboard2 = function(data,logdate,offset){
        $.ajax({
            url:"http://cps.da-mai.com/bigdata/adboard/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,logdate:logdate,offset:offset
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 获取定向统计报表
     * @version 2.9.7
     *
     */
    CPS.app.rptnDestDayList = function(b,e,offset,fn){
        var k = "dest."+b+"."+e+"."+offset;
        var _k = CPS.app.shopId+"."+k+".data";
        if(offset>0 && CPS.mutex.is(k)){
            return false;
        }else if(offset<=0 && CPS.mutex.is(k)){
            var d = CPS.storage.get(_k);
            fn(d,offset);
            return true;
        }
        var t = parseInt(Math.random()*1000+offset*10);
        var r = function() {

            return $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/destDay/list.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    startTime: b,
                    endTime: e,
                    pageSize: 200,
                    offset: offset,
                    campaignModel: 1,
                    campaignName: "",
                    transName: "",
                    adboardName: "",
                    sortField: "charge",
                    sortRule: "desc"
                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data, offset);
                        if(offset<=0){
                            CPS.storage.set(_k,resp.data);
                        }
                    }
                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取所有的创意统计报表
     * @version 2.9.7
     *
     */
    CPS.app.rptnDestAll = function(){

        var f = new DateFormat();
        var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -7, "yyyy-MM-dd");

        CPS.app.rptnDestDayList(b,e,0,function(data){

            CPS.app.postRptnDest(data,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDest(rpt,i);
                });

            }

        });
    };

    /**
     * 提交定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnDest = function(data,offset){
        $.ajax({
            url:"http://cps.da-mai.com/zuanshi/dest/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset
            },
            dataType:"json",
            success:function(){
            }
        })
    };


    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAll2 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -16, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -16, "yyyy-MM-dd");
        CPS.app.rptnDestDayList(b,e,0,function(data){

            CPS.app.postRptnDest2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDest2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAll3 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -15, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -15, "yyyy-MM-dd");
        CPS.app.rptnDestDayList(b,e,0,function(data){

            CPS.app.postRptnDest2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDest2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAll4 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -17, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -17, "yyyy-MM-dd");
        CPS.app.rptnDestDayList(b,e,0,function(data){

            CPS.app.postRptnDest2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDest2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 提交定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnDest2 = function(data,logdate,offset){
        $.ajax({
            url:"http://cps.da-mai.com/bigdata/dest/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset,logdate:logdate
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 获取定向统计报表
     * @version 2.9.7
     *
     */
    CPS.app.rptnDestAdzoneDayList = function(b,e,offset,fn){
        var k = "destadzone."+b+"."+e+"."+offset;
        var _k = CPS.app.shopId+"."+k+".data";
        if(offset>0 && CPS.mutex.is(k)){
            return false;
        }else if(offset<=0 && CPS.mutex.is(k)){
            var d = CPS.storage.get(_k);
            fn(d,offset);
            return true;
        }

        var t = parseInt(Math.random()*1000+offset*10);
        var r = function() {

            return $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/destAdzoneDay/list.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    startTime: b,
                    endTime: e,
                    pageSize: 200,
                    offset: offset,
                    campaignModel: 1,
                    campaignName: "",
                    transName: "",
                    sortField: "charge",
                    sortRule: "desc"
                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data, offset);
                        if(offset<=0){
                            CPS.storage.set(_k,resp.data);
                        }
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAdzoneAll2 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -16, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -16, "yyyy-MM-dd");
        CPS.app.rptnDestAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnDestAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDestAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAdzoneAll3 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -15, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -15, "yyyy-MM-dd");
        CPS.app.rptnDestAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnDestAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDestAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnDestAdzoneAll4 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -17, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -17, "yyyy-MM-dd");
        CPS.app.rptnDestAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnDestAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnDestAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnDestAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 提交定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnDestAdzone2 = function(data,logdate,offset){
        $.ajax({
            url:"http://cps.da-mai.com/bigdata/destadzone/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset,logdate:logdate
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 获取资源位统计报表,新增缓存机制
     * @version 3.1.2
     *
     */
    CPS.app.rptnAdzoneDayList = function(b,e,offset,fn){
        var k = "adzone."+b+"."+e+"."+offset;
        var _k = CPS.app.shopId+"."+k+".data";
        if(offset>0 && CPS.mutex.is(k)){
            return false;
        }else if(offset<=0 && CPS.mutex.is(k)){
            var d = CPS.storage.get(_k);
            fn(d,offset);
            return true;
        }

        var t = parseInt(Math.random()*1000+offset*10);
        var r = function() {

            return $.ajax({
                url: 'http://zuanshi.taobao.com/rptn/adzoneDay/list.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    startTime: b,
                    endTime: e,
                    pageSize: 200,
                    offset: offset,
                    campaignModel: 1,
                    campaignName: "",
                    transName: "",
                    adboardName: "",
                    sortField: "charge",
                    sortRule: "desc"
                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data, offset);
                        if(offset<=0){
                            CPS.storage.set(_k,resp.data);
                        }
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    CPS.app.rptnAdzoneAll = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -7, "yyyy-MM-dd");

        CPS.app.rptnAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnAdzone(data,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAdzone(rpt,i);
                });

            }

        });
    };
    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdzoneAll2 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -16, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -16, "yyyy-MM-dd");
        CPS.app.rptnAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdzoneAll3 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -15, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -15, "yyyy-MM-dd");
        CPS.app.rptnAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 获取所有的定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.rptnAdzoneAll4 = function(){
        var f = new DateFormat();
        var e = f.addDays(new Date(), -17, "yyyy-MM-dd");
        var b = f.addDays(new Date(), -17, "yyyy-MM-dd");
        CPS.app.rptnAdzoneDayList(b,e,0,function(data){

            CPS.app.postRptnAdzone2(data,b,0);

            for(var offset = 200;offset < data.count;offset+=200){

                CPS.app.rptnAdzoneDayList(b,e,offset,function(rpt,i){
                    CPS.app.postRptnAdzone2(rpt,b,i);
                });

            }

        });
    };

    /**
     * 提交定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnAdzone = function(data,offset){
        $.ajax({
            url:"http://cps.da-mai.com/zuanshi/adzonerpt/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 提交定向统计报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnAdzone2 = function(data,logdate,offset){
        $.ajax({
            url:"http://cps.da-mai.com/bigdata/adzone/source.html",
            type:"post",
            data:{
                rpt:JSON.stringify(data),nick:CPS.app.nick,offset:offset,logdate:logdate
            },
            dataType:"json",
            success:function(){
            }
        })
    };

    /**
     * 获取有效的推广计划列表
     * @version 2.9.8
     */
    CPS.app.findCampaignList = function(fn){
        $.ajax({
            url:"http://zuanshi.taobao.com/mooncampaign/findCampaignList.json",
            type:"post",
            data:{
                csrfID: CPS.app.csrfID,
                tab:"list",
                status:5,
                campaignModel:1,
                pageSize:40
            },
            dataType:"json",
            success:function(resp){
                if(resp && resp.data){
                    fn(resp.data);
                }

            }
        })
    };

    CPS.app.campaignRptnToday = function(){
        CPS.app.findCampaignList(function(data){
            if(data && data.list) {
                var list = data.list;
                var campaignids = [];
                for (var i in list) {
                    var campaign = list[i];
                    campaignids.push({"campaignId":campaign.campaignId});
                }
                var format = new DateFormat();
                var curDate = format.formatCurrentDate("yyyy-MM-dd");

                $.ajax({
                    url:"http://zuanshi.taobao.com/rptn/campaign/list.json",
                    type:"post",
                    dataType:"json",
                    data: {
                        csrfID: CPS.app.csrfID,
                        startTime:curDate,
                        endTime:curDate,
                        idList:campaignids
                    },
                    success:function(resp){
                        if(resp && resp.data && resp.data.list){
                            $.ajax({
                                url: "http://cps.da-mai.com/zuanshi/campaign/source.html",
                                type: "post",
                                dataType: "json",
                                data: {
                                    nick: CPS.app.nick,
                                    data: JSON.stringify(list),
                                    rptdata: JSON.stringify(resp.data.list)
                                }
                            });
                        }

                    }

                })
            }
        });
    };

    /**
     * 推广计划过期检测
     * @version 2.9.8
     */
    CPS.app.campaignExpiredDetection = function(data){
        var campaigns = [];
        if(data && data.list){
            var list = data.list;
            for(var i in list){
                var campaign = list[i];
                var format = new DateFormat();

                var result = format.compareTo(format.parseDate(campaign.endTime));
                if(result<=7*24*60*60*1000){
                    campaigns.push(campaign);
                }

            }
        }
        return campaigns;
    };

    /**
     * 推广计划过期弹窗
     * @version 2.9.8
     */
    CPS.app.campaignAlertBox = function(campaigns){
        var html = "<div id='CPS_campaign_alert'><div class='h'>计划过期提醒</div>";
        var content = "<div class='c'>";
        var items = [];
        for(var i in campaigns){
            var campaign = campaigns[i];
            var format = new DateFormat();
            var result = format.compareTo(format.parseDate(campaign.endTime));
            var days = parseInt(Math.ceil(result/(24*60*60*1000)));
            items.push("<p><strong>"+campaign.campaignName+"</strong>将在<em>"+days+"</em>天后过期</p>");
        }
        content = content + items.join("")+"</div>";
        var footer = "<div class='f'><div class='btns'><button id='btn-w1'>稍后提醒</button><button id='btn-w2'>24小时后提醒</button></div></div>";
        return html+content+footer+"</div>";
    };
    /**
     * 创建推广单元
     * @param shop
     * @version 2.9.1
     */
    CPS.app.createTrans = function(shop){
        setTimeout(function () {
            var trans = {};
            trans.campaignId = CPS.app.campaignid;
            trans.transName = shop.nickname+"_"+shop.shopId+"_"+shop.cnt;
            trans.transAdzoneBinds = [];
            for(var i in CPS.app.adzone){
                var a = CPS.app.adzone[i];
                trans.transAdzoneBinds.push({"adzoneId":a.adzoneId,"adzoneType":a.type});
            }

            var matrixPrices = [];
            for(var j in CPS.app.adzone){
                var b = CPS.app.adzone[j];
                matrixPrices.push({"adzoneId":b.adzoneId,"bidPrice":b.bidPrice});
            }
            trans.crowdVOList = [{
                "targetValue":1,
                "targetType":16,
                "targetName":"自主店铺",
                "matrixPriceBatchVOList":matrixPrices,
                "subCrowdVOList":[{"subCrowdName":shop.nickname,"subCrowdValue":shop.shopId}]
            }];

            $.ajax({
                url: 'http://zuanshi.taobao.com/adgroup/createAdgroup.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,trans:JSON.stringify(trans)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok && resp.data && resp.data.transId) {
                        CPS.app.bindAdboard(resp.data.transId, CPS.app.creatives, function () {
                                CPS.time.success()
                        }, function () {
                            CPS.time.fail();
                        })
                    }else{
                        CPS.time.fail();
                    }

                },
                error:function(){
                    CPS.time.fail();
                }
            })

        }, 1000);
    };

    CPS.adgroup.createByDmp = function(dmp){
        setTimeout(function () {
            var format = new DateFormat();
            var dateStr = format.formatCurrentDate("yyyyMMdd");
            var trans = {};
            trans.campaignId = CPS.app.campaignid;
            trans.transName = dmp.targetName+"_"+dateStr;
            trans.transAdzoneBinds = [];
            for(var i in CPS.app.adzone){
                var a = CPS.app.adzone[i];
                trans.transAdzoneBinds.push({"adzoneId":a.adzoneId,"adzoneType":a.type});
            }

            var matrixPrices = [];
            for(var j in CPS.app.adzone){
                var b = CPS.app.adzone[j];
                matrixPrices.push({"adzoneId":b.adzoneId,"bidPrice":b.bidPrice});
            }
            trans.crowdVOList = [{
                "targetValue":dmp.targetValue,
                "targetType":128,
                "targetName":dmp.targetName,
                "matrixPriceBatchVOList":matrixPrices,
                "subCrowdVOList":[{"subCrowdName":dmp.targetName,"subCrowdValue":dmp.targetValue}]
            }];

            $.ajax({
                url: 'http://zuanshi.taobao.com/adgroup/createAdgroup.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,trans:JSON.stringify(trans)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok && resp.data && resp.data.transId) {
                        CPS.app.bindAdboard(resp.data.transId, CPS.app.creatives, function () {
                            CPS.time.success()
                        }, function () {
                            CPS.time.fail();
                        })
                    }else{
                        CPS.time.fail();
                    }

                },
                error:function(){
                    CPS.time.fail();
                }
            })

        }, 1000);
    };


    /**
     * 批量增加资源位
     * @param crowd
     * @param adzoneId
     * @param adzoneType
     * @param bidPrice
     * @param fn
     * @param err
     * @version 2.9.1
     */
    CPS.app.targetAddAdzones = function(crowd,adzoneId,adzoneType,bidPrice,fn,err){
        var adgroupBindAdzoneVOList = [];

        adgroupBindAdzoneVOList.push({
            "campaignId":crowd.campaignId,
            "adzoneId":adzoneId,
            "adzoneType":adzoneType,
            "transId":crowd.transId,
            "matrixPriceBatchVOList":[{"targetId":crowd.targetId,"targetType":crowd.targetType,"bidPrice":bidPrice}]
        });

        CPS.app.getTransXTargetXAdzoneByCrowd(crowd,function(data){
            $.each(data.list,function(){
                adgroupBindAdzoneVOList.push({
                    "campaignId":this.campaignId,
                    "adzoneId":this.adzoneId,
                    "adzoneType":CPS.utils.formatAdzoneType(this.adzoneId),
                    "transId":this.transId,
                    "matrixPriceBatchVOList":[{"targetId":this.targetId,"targetType":this.targetType,"bidPrice":this.bidPrice}]
                });

            });


            $.ajax({
                url: 'http://zuanshi.taobao.com/adgroup/bind/updateAllAdzoneBind.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    adgroupBindAdzoneVOList:JSON.stringify(adgroupBindAdzoneVOList)
                },
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok){
                        fn(resp.data);
                    }else{
                        err();
                    }

                },
                error:function(){
                    err();
                }
            });

        },function(){
            err();
        });

    };

    /**
     * 根据定向获取推广的资源位
     * @param crowd
     * @param fn
     * @param err
     * @version 2.9.1
     */
    CPS.app.getTransXTargetXAdzoneByCrowd = function(crowd,fn,err){
        var transId = crowd.transId,targetId = crowd.targetId,targetType = crowd.targetType;

        $.ajax({
            url: 'http://zuanshi.taobao.com/matrixprice/getTransXTargetXAdzoneByCrowd.json',
            dataType: 'json',
            data: {
                csrfID: CPS.app.csrfID,
                transId:transId,
                targetId:targetId,
                targetType:targetType,
                campaignType:2
                //trans:JSON.stringify(newTrans)
            },
            type: 'post',
            success: function (resp) {
                if(resp.info && resp.info.ok) {
                    fn(resp.data);
                }else{
                    err();
                }
            },
            error:function(){
                err();
            }
        });
    };

    /**
     *
     * @param a
     * @param fn
     * @param err
     */
    CPS.app.getTransXTargetXAdzoneByAdzone = function(a,fn,err){
        $.ajax({
            url: 'http://zuanshi.taobao.com/matrixprice/getTransXTargetXAdzoneByCrowd.json',
            dataType: 'json',
            data: {
                csrfID: CPS.app.csrfID,
                transId: a.transId,
                adzoneId: a.adzoneId,
                campaignType: a.campaignType
            },
            type: 'post',
            success: function (resp) {
                if(resp.info && resp.info.ok) {
                    fn(resp.data);
                }else{
                    err();
                }
            },
            error:function(){
                err();
            }
        });
    };

    /**
     * 移除资源位
     * @param adgroupBindAdzoneVOList
     * @param fn
     * @param err
     * @version 2.9.1
     */
    CPS.app.unbindAdzones = function(adgroupBindAdzoneVOList,fn,err){
        $.ajax({
            url: 'http://zuanshi.taobao.com/adgroup/bind/unbindAdzones.json',
            dataType: 'json',
            data: {csrfID: CPS.app.csrfID,adgroupBindAdzoneVOList:JSON.stringify(adgroupBindAdzoneVOList)},
            type: 'post',
            success: function (resp) {
                if(resp.info && resp.info.ok){
                    fn(resp.data);
                }else{
                    err();
                }

            },
            error:function(){
                err();
            }
        });
    };

    /**
     * 绑定推广的创意
     * @param transId
     * @param adboardIds
     * @param fn
     * @param err
     * @version 2.9.1
     */
    CPS.app.bindAdboard = function(transId,adboardIds,fn,err){
        var t = parseInt(Math.random()*1000+200);
        setTimeout(function () {
            $.ajax({
                url: 'http://zuanshi.taobao.com/adgroup/bind/bindAdboard.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,transId:transId,adboardIdList:adboardIds},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok) {
                        fn(resp.data);
                    }else {
                        err();
                    }
                },
                error:function(){
                    err();
                }
            });

        }, t);
    };

    /**
     * 修改出价
     * @param matrixPriceBatchVOList [{"campaignId":campaignId,"transId":transId,"targetId":targetId,"targetType":targetType,"bidPrice":bidPrice,"adzoneId":adzoneId}]
     * @version 2.9.1
     */
    CPS.app.batchModifyMatrixPrice = function(matrixPriceBatchVOList){
        setTimeout(function () {
            $.ajax({
                url: 'http://zuanshi.taobao.com/matrixprice/batchModifyMatrixPrice.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    matrixPriceBatchVOList: JSON.stringify(matrixPriceBatchVOList)
                },
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok){
                        CPS.time.success();
                    }else{
                        CPS.time.fail();
                    }
                },
                error:function(){
                    CPS.time.fail();
                }
            });
        },1000);
    };

    /**
     * 获取店铺信息，用于新增推广单元设置
     * @param nicknames
     * @param fn
     */
    CPS.app.shopInfo2 = function(nicknames,fn){
        setTimeout(function () {
            $.ajax({
                url: 'http://zuanshi.taobao.com/trans/isHavingShop.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID, nicknames: nicknames},
                type: 'post',
                success: function (data) {
                    if(data.data.shops) {
                        fn(data.data.shops);
                    }
                }
            });

        }, 1000);
    };

    /**
     * 获取低价推广设置
     * @param fn
     * @param err
     */
    CPS.app.getSetting = function(fn,err){

            $.ajax({
                url: 'http://cps.da-mai.com/zuanshi/setting/get.html',
                dataType: 'json',
                data: {nick:  CPS.app.nick},
                type: 'post',
                success: function (data) {
                    if(data.isSuccess && data.data){
                        fn(data.data);
                    }
                },error:function(){
                   err();
                }
            });
    };



    /**
     * 获取推广组列表
     * @param campaignId
     * @param page
     * @returns {*|{requires}}
     * @version 2.9.1
     */
    CPS.app.findAdgroupList = function(campaignId,page){
        var offset = (page-1)*40;
        return $.ajax({
            url: 'http://zuanshi.taobao.com/adgroup/findAdgroupList.json',
            dataType: 'json',
            data: {csrfID: CPS.app.csrfID, campaignId: campaignId,tab:"detail",campaignModel:1,status:25,page:page,offset:offset,pageSize:40},
            type: 'post'
        });
    };


    /**
     * 获取该计划下的定向列表
     * @param campaignId
     * @param page
     * @returns {*|{requires}}
     * @version 2.9.1
     */
    CPS.app.findCrowdList = function(campaignId,page){

        var offset = (page-1)*40;
        return $.ajax({
            url: 'http://zuanshi.taobao.com/horizontalManage/findCrowdList.json',
            dataType: 'json',
            data: {csrfID: CPS.app.csrfID, campaignId: campaignId,campaignModel:1,tab:"unit_detail_target_list",page:page,offset:offset,pageSize:40},
            type: 'post'
        });
    };

    /**
     * 获取该计划下的资源位列表
     * @param campaignId
     * @param page
     * @param fn
     * @param err
     * @returns {*|{requires}}
     * @version 2.9.1
     */
    CPS.app.findAdzoneList = function(campaignId,page,fn,err){

        var offset = (page-1)*40;
        var t = parseInt(Math.random()*1000+offset*10);
        setTimeout(function(){
            $.ajax({
                url: 'http://zuanshi.taobao.com/horizontalManage/findAdzoneList.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    campaignId: campaignId,
                    campaignModel:1,
                    tab:"unit_detail_resource_list",
                    index:page,
                    offset:offset,
                    pageSize:40
                },
                type: 'post',
                success:function(resp){
                    if(resp.info && resp.info.ok && resp.data.list) {
                        fn(resp.data,page);
                    }else{
                        err();
                    }
                },
                error:function(){
                    err();
                }
            });
        },t);

    };


    /**
     * 获取推广组的创意列表
     * @param campaignId
     * @param transId
     * @param fn
     * @param err
     * @version 2.9.1
     */
    CPS.app.findAdboardList = function(campaignId,transId,fn,err){
        $.ajax({
            url: ' http://zuanshi.taobao.com/horizontalManage/findAdboardList.json',
            dataType: 'json',
            data: {csrfID: CPS.app.csrfID, campaignId:campaignId,transId: transId,tab:"unit_detail_creative_list",campaignModel:1,offset:0,pageSize:40,index:1},
            type: 'post',
            success: function (resp) {

                if(resp.info && resp.info.ok && resp.data.list) {
                    var ids = [];
                    $.each(resp.data.list,function(){
                        ids.push(this.adboardId);
                    });
                    fn(ids);
                }else{
                    err();
                }
            },
            error:function(){
                err();
            }
        });
    };

    /**
     * 按比率调整出价
     * @param campaignId
     * @param rate
     * @param page
     * @version 3.1.4
     */
    CPS.app.modifyPriceByRate = function(campaignId,rate,page){
        var fn = function(d1, p){
            for(var i in d1.list){
                var a = d1.list[i];
                CPS.app.getTransXTargetXAdzoneByAdzone(a,function(d2){
                    for(var j in d2.list){
                        var b = d2.list[j];
                        var np = parseFloat((rate + 1)*b.bidPrice);

                        CPS.app.batchModifyMatrixPrice([{"campaignId": b.campaignId,"transId": b.transId,"targetId": b.targetId,"targetType": b.targetType,"bidPrice":np.toFixed(2),"adzoneId": b.adzoneId}]);
                    }

                },function(){CPS.time.fail()});
            }
        };
        var err = function(){
            CPS.app.findAdzoneList(campaignId,page,fn,err);
        };

        CPS.app.findAdzoneList(campaignId,page,fn,err);
    };

    /**
     * 按固定值调整出价
     * @param campaignId
     * @param val
     * @param page
     * @version 3.1.4
     */
    CPS.app.modifyPriceByValue = function(campaignId,val,page){
        var fn = function(d1, p){
            for(var i in d1.list){
                var a = d1.list[i];
                CPS.app.getTransXTargetXAdzoneByAdzone(a,function(d2){
                    for(var j in d2.list){
                        var b = d2.list[j];
                        var np = parseFloat(val);

                        CPS.app.batchModifyMatrixPrice([{"campaignId": b.campaignId,"transId": b.transId,"targetId": b.targetId,"targetType": b.targetType,"bidPrice":np.toFixed(2),"adzoneId": b.adzoneId}]);
                    }

                },function(){CPS.time.fail()});
            }
        };
        var err = function(){
            CPS.app.findAdzoneList(campaignId,page,fn,err);
        };

        CPS.app.findAdzoneList(campaignId,page,fn,err);
    };

    /**
     * 批量替换创意
     * @param campaignId
     * @param transId
     * @param searchId
     * @param replaceId
     * @version 2.9.1
     */
    CPS.app.replaceAdboard = function(campaignId,transId,searchId,replaceId){
        CPS.app.findAdboardList(campaignId,transId,function(adboardList){

            var index = $.inArray(searchId, adboardList);

            var adboards = adboardList;
            if(index>=0){
                adboards.splice(index,1);
                if($.inArray(replaceId,adboards)<0){
                    adboards.push(replaceId);
                }

               CPS.app.bindAdboard(transId, $.unique(adboards).join(","),function(){
                   CPS.time.success();
               },function(){
                   CPS.time.fail();
               });
            }else{
                CPS.time.success();
            }

        },function(){
            CPS.time.fail();
        });
    };

    /**
     * 批量添加创意
     * @param campaignId
     * @param transId
     * @param needAddAdboardId
     * @version 2.9.1
     */
    CPS.app.addAdboard2 = function(campaignId,transId,needAddAdboardId){
        CPS.app.findAdboardList(campaignId,transId,function(a){
            a.push(needAddAdboardId);
            var ids = $.unique(a).join(",");
            CPS.app.bindAdboard(transId,ids,function(){CPS.time.success()},function(){CPS.time.fail()});
        },function(){
            CPS.time.fail()
        });
    };

    /**
     * 移除创意
     * @param transId
     * @param adboardId
     * @version 2.9.1
     */
    CPS.app.unbindAdboard = function(transId,adboardId){
        var aboard = [{"adboardId":adboardId,"transId":transId}];
        setTimeout(function () {
            $.ajax({
                url: 'http://zuanshi.taobao.com/horizontalManage/unbindAdboard.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,adboardList:JSON.stringify(aboard)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok){
                        CPS.time.success();
                    }else{
                        CPS.time.fail();
                    }
                },
                error:function(){
                    CPS.time.fail();
                }
            });

        }, 1000);
    };

    /**
     * 批量移除创意
     * @param campaignId
     * @param transId
     * @param needDelAdboardId
     * @version 2.9.1
     */
    CPS.app.delAdboard2 = function(campaignId,transId,needDelAdboardId){
        CPS.app.findAdboardList(campaignId,transId,function(adboardList){

            var index = $.inArray(needDelAdboardId,adboardList);

            if(index>=0){
                CPS.app.unbindAdboard(transId,needDelAdboardId);
            }else{
                CPS.time.success();
            }

        },function(){
            CPS.time.fail();
        });
    };

    CPS.app.getAdzoneList = function(page){
        var pager = {};
        pager.pageSize = 40;
        pager.index = page;
        pager.offset = (pager.index-1)* pager.pageSize;
        setTimeout(function () {
            $.ajax({
                url: ' http://zuanshi.taobao.com/adzone/findAdzoneList.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,queryAdzoneParamStr:JSON.stringify(pager)},
                type: 'post',
                success: function (data) {
                    if(data.data && data.data.list){
                        for(var i in data.data.list){
                            CPS.app.updateAdzone(data.data.list[i]);
                        }

                    }
                }
            });
        }, 1000);
    };

    CPS.app.updateAdzone = function(adzone){

        $.ajax({
            url: 'http://cps.da-mai.com/zuanshi/adzone/update.html',
            dataType: 'json',
            data: {adzone: JSON.stringify(adzone)},
            type: 'post',
            success: function (data) {
               console.log(data);
            }
        });
    };

    CPS.adzone.get = function(){
        var d = CPS.storage.get("adzone.list.data");
        if(d){
            return d;
        }

        $.ajax({
            url: ' http://cps.da-mai.com/zuanshi/adzone/list.html',
            dataType: 'json',
            async:false,
            type: 'get',
            success: function (resp) {

                CPS.storage.set("adzone.list.data",resp.data);
                return resp.data;
            }
        });
    };



    /**
     * 构建小工具的资源位选择器
     * @version 2.9.5
     * @bug 修正界面展示错位问题
     */
    CPS.app.adzoneSelectHtml = function(){

        var data = CPS.adzone.get();
        var t = {},s = [];
        $.each(data,function(){
            t[this.adzoneId] = this.type;
            s.push({"id":this.adzoneId+","+this.type,"text":this.adzoneName+"("+this.adzoneId+")"});
        });
        $("#CPS_tools_container .adzone_input select").select2({data:s});

        $("#adzone_data_json").html(JSON.stringify(t));
        $("#CPS_tools_container").show();

    };

    CPS.utils.formatAdzoneType = function(o){
        var t = $("#adzone_data_json").html();
        var data = eval("("+t+")");
        return data[o];
    };


    CPS.board.findAdboardList = function(offset){
        return $.ajax({
            url:"http://zuanshi.taobao.com/board/findAdboardList.json",
            dataType: 'json',
            data: {
                csrfID: CPS.app.csrfID,
                adzoneIdList:"",
                offset:offset,
                pageSize:40,
                status:"P",
                adboardSize:"",
                adboardLevel:"",
                format:2,
                multiMaterial:"",
                adboardName:"",
                archiveStatus:0
            },
            type: 'post'
        })
    };

    CPS.board.findAdboardAll = function(fn){
        $.when(CPS.board.findAdboardList(0)).then(function(a){
            if(a.data && a.data.list){
                var p = Math.ceil(a.data.count/40);
                if(p>3){
                    $.when(CPS.board.findAdboardList((p-1)*40),CPS.board.findAdboardList((p-2)*40),CPS.board.findAdboardList((p-3)*40)).then(function(b,c,d){
                        var list = [];
                        if(a.data && a.data.list){
                            list = list.concat(a.data.list);
                        }
                        if(b[0].data && b[0].data.list){
                            list = list.concat(b[0].data.list);
                        }
                        if(c[0].data && c[0].data.list){
                            list = list.concat(c[0].data.list);
                        }
                        if(d[0].data && d[0].data.list){
                            list = list.concat(d[0].data.list);
                        }
                        fn(list);
                    });
                }else{
                    $.when(CPS.board.findAdboardList(40),CPS.board.findAdboardList(80)).then(function(b,c){
                        var list = [];
                        if(a.data && a.data.list){
                            list = list.concat(a.data.list);
                        }
                        if(b[0].data && b[0].data.list){
                            list = list.concat(b[0].data.list);
                        }
                        if(c[0].data && c[0].data.list){
                            list = list.concat(c[0].data.list);
                        }
                        fn(list);
                    });
                }
            }

        });


    };

    CPS.board.expire = function(fn){
        CPS.board.findAdboardAll(function(list){
            var adboards = [];
            for(var i in list){
                var adboard = list[i];
                var format = new DateFormat();

                var result = format.compareTo(format.parseDate(adboard.outOfServiceTime));
                if(result<=7*24*60*60*1000){
                    adboards.push(adboard);
                }

            }

            fn(adboards);
        })
    };

    /**
     * 推广计划过期弹窗
     * @version 2.9.8
     */
    CPS.board.alertbox = function(adboards){
        var html = "<div id='CPS_adboard_alert'><div class='h'>创意过期提醒</div>";
        var content = "<div class='c'>";
        var items = [];
        for(var i in adboards){
            var adboard = adboards[i];
            var format = new DateFormat();
            var result = format.compareTo(format.parseDate(adboard.outOfServiceTime));
            var days = parseInt(Math.ceil(result/(24*60*60*1000)));
            items.push("<p><strong>"+adboard.adboardName+"</strong>将在<em>"+days+"</em>天后过期</p>");
        }
        content = content + items.join("")+"</div>";
        var footer = "<div class='f'><div class='btns'><button id='btn-adboard-w1'>稍后提醒</button><button id='btn-adboard-w2'>24小时后提醒</button></div></div>";
        return html+content+footer+"</div>";
    };

    /**
     * 计划过期提醒功能
     * @version 3.0.7
     */
    CPS.board.alert = function(){
        var dateFormat = new DateFormat();
        var alertDate = 0;
        var alertDateStr = window.localStorage.getItem("board.alert."+CPS.app.shopId);
        if(alertDateStr) {
            alertDate = (dateFormat.parseDate(alertDateStr)).getTime();
        }

        if((new Date()).getTime()>alertDate) {

            CPS.board.expire(function(list){
                if(list.length > 0){
                    var html = CPS.board.alertbox(list);
                    $("body").append(html);

                    $("#btn-adboard-w1").click(function () {
                        $("#CPS_adboard_alert").hide();

                    });

                    $("#btn-adboard-w2").click(function () {
                        $("#CPS_adboard_alert").hide();

                        var dateFormat = new DateFormat();
                        var nextDate = dateFormat.addDays(new Date(), 1);
                        window.localStorage.setItem("board.alert." + CPS.app.shopId, nextDate);

                    });
                }
            });


        }
    };

    CPS.time.start = function(c){
        $("#CPS_exector_msg").html("正在处理...");
        CPS.time.i = 0;
        CPS.time.s = 0;
        CPS.time.e = 0;
        CPS.time.c = c;
        var fn = function(){
            $("#CPS_exector_msg").html("正在处理("+ CPS.time.i+"/"+ CPS.time.c+")，成功("+CPS.time.s+"),失败("+CPS.time.e+"),请稍等...");
            if(CPS.time.i>=CPS.time.c){
                $("#CPS_exector_msg").html("处理完成,1秒后窗口关闭");
                setTimeout(function(){
                    $("#CPS_tools_container").hide();
                },1000);
            }else{
                setTimeout(fn,1000);
            }
        };
        fn();
    };
    CPS.time.incre = function(){
        CPS.time.i++;
    };
    CPS.time.success = function(){
        CPS.time.incre();
        CPS.time.s++;

    };
    CPS.time.fail = function(){
        CPS.time.incre();
        CPS.time.e++;
    };

    CPS.layout.window = function(){
        var header = "<div class='hd'><p>精准投放平台小助手</p><a href='javascript:void(0)' id='cls-btn'>关闭</a></div>";
        var footer = "<p id='CPS_exector_msg'></p>";

        var other = "<textarea id='adzone_data_json'></textarea>";

        var mainLayout =  "<div id='CPS_tools_container'>" + header + "<div class='content'><div class='panel'></div>"+other+footer+"</div></div>";
        $("body").append(mainLayout);

        $("#cls-btn").click(function(){
            $("#CPS_tools_container").hide();
        });

        CPS.layout.menu();
        CPS.adzone.get();
    };

    CPS.layout.adjust = function(){
        $("#CPS_tools_container").hide();

        var panel = "<div id='auto_adjust_div' class='row'>"+
        "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td><td></td></tr>"+
        "<tr><td>出价：</td><td><input type='text' name='bidPrice' value='10'/></td><td></td></tr>"+
        "<tr><td><a class='CPS_bt' id='CPS_auto_adjust'>开始调整</a></td><td></td><td></td></tr>" +
        "</table></div>";

        $("#CPS_exector_msg").html("");

        $("#CPS_tools_container .content .panel").html(panel);


        $("#CPS_auto_adjust").unbind();
        $("#CPS_auto_adjust").one("click",function(){
            var self = $(this);
            self.html("正在处理,请稍候..");

            var campaignid = $("#auto_adjust_div").find("input[name=campaignid]").val();
            var bidPrice =  $("#auto_adjust_div").find("input[name=bidPrice]").val();
            if(isNaN(parseInt(bidPrice)) || bidPrice<=0){
                self.html("请填写正确的出价");
                return;
            }

            CPS.app.findAdzoneList(campaignid,1,function(data){
                var c = data.count;
                CPS.time.start(c);
                var pt = parseInt((c+39)/40);
                for(var p =1;p<=pt;p++){
                    CPS.app.modifyPriceByValue(campaignid,bidPrice,p);
                }

            },function(){self.html("网络错误,请刷新页面重试!");})


        });
        $("#CPS_tools_container").show();

    };

    CPS.layout.adjust_i = function(){
        $("#CPS_tools_container").hide();

        var panel = "<div id='auto_adjust_i_div' class='row'>"+
            "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td><td></td></tr>"+
            "<tr><td>加大比率(%)：</td><td><input type='text' name='rate' value='10'/></td><td></td></tr>"+
            "<tr><td><a class='CPS_bt' id='CPS_auto_adjust_i'>开始调整</a></td><td></td><td></td></tr>" +
            "</table></div>";

        $("#CPS_exector_msg").html("");

        $("#CPS_tools_container .content .panel").html(panel);

        //CPS.app.adzoneSelectHtml();

        $("#CPS_auto_adjust_i").unbind();
        $("#CPS_auto_adjust_i").one("click",function(){
            var self = $(this);
            self.html("正在处理,请稍候..");

            var campaignid = $("#auto_adjust_i_div").find("input[name=campaignid]").val();
            var rate =  parseInt($("#auto_adjust_i_div").find("input[name=rate]").val())/100;

            CPS.app.findAdzoneList(campaignid,1,function(data){
                var c = data.count;
                CPS.time.start(c);
                var pt = parseInt((c+39)/40);
                for(var p =1;p<=pt;p++){
                    CPS.app.modifyPriceByRate(campaignid,rate,p);
                }

            },function(){self.html("网络错误,请刷新页面重试!");})


        });

        $("#CPS_tools_container").show();

    };

    CPS.layout.adjust_d = function(){
        $("#CPS_tools_container").hide();

        var panel = "<div id='auto_adjust_d_div' class='row'>"+
            "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td><td></td></tr>"+
            "<tr><td>减少比率(%)：</td><td><input type='text' name='rate' value='10'/> </td><td></td></tr>"+
            "<tr><td><a class='CPS_bt' id='CPS_auto_adjust_d'>开始调整</a></td><td></td><td></td></tr>" +
            "</table></div>";

        $("#CPS_exector_msg").html("");

        $("#CPS_tools_container .content .panel").html(panel);

        //CPS.app.adzoneSelectHtml();

        $("#CPS_auto_adjust_d").unbind();
        $("#CPS_auto_adjust_d").one("click",function(){
            var self = $(this);
            self.html("正在处理,请稍候..");

            var campaignid = $("#auto_adjust_d_div").find("input[name=campaignid]").val();
            var rate =  parseInt($("#auto_adjust_d_div").find("input[name=rate]").val())/100;
            rate = 0-Math.abs(rate);
            CPS.app.findAdzoneList(campaignid,1,function(data){
                var c = data.count;
                CPS.time.start(c);
                var pt = parseInt((c+39)/40);
                for(var p =1;p<=pt;p++){
                    CPS.app.modifyPriceByRate(campaignid,rate,p);
                }

            },function(){self.html("网络错误,请刷新页面重试!");})


        });

        $("#CPS_tools_container").show();

    };

    CPS.layout.addadzone = function(){
        var panel = "<div id='auto_adjust_div' class='row'>"+
            "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td><td></td></tr>"+
            "<tr><td>资源位：</td><td colspan='2'><p class='adzone_input'>" +
            "<select name='adzoneId'><option value='34502344,2'>PC_流量包_网上购物_淘宝首页焦点图(34502344)</option></select>"+
            "</p></td></tr>"+
            "<tr><td>出价：</td><td><input type='text' name='bidPrice' value='10'/></td><td></td></tr>"+
            "<tr><td><a class='CPS_bt' id='CPS_adzone_btn' href='javascript:void(0)'>增加资源位</a></td><td></td><td></td></tr>" +
            "</table></div>";

        $("#CPS_tools_container .content .panel").html(panel);
        $("#CPS_tools_container").hide();
        $("#CPS_exector_msg").html("");
        CPS.app.adzoneSelectHtml();

        $("#CPS_adzone_btn").unbind();
        $("#CPS_adzone_btn").one("click",function(){
            var self = $(this);
            var campaignid = $("#auto_adjust_div").find("input[name=campaignid]").val();
            var bidPrice =  $("#auto_adjust_div").find("input[name=bidPrice]").val();
            var ad = $("#auto_adjust_div").find("select[name=adzoneId]").val();

            var a = ad.split(",");
            var adzoneId = a[0],type = a[1];
            //   var adzones = [{"adzoneId":a[0],"bidPrice":bidPrice,"type":a[1]}];

            self.html("正在处理,请稍候..");
            $.when(CPS.app.findCrowdList(campaignid,1),CPS.app.findCrowdList(campaignid,2),CPS.app.findCrowdList(campaignid,3)).then(function(a,b,c){
                var transList = [];
                if(a[0].data && a[0].data.list){
                    transList = transList.concat(a[0].data.list);
                }
                if(b[0].data && b[0].data.list){
                    transList = transList.concat(b[0].data.list);
                }
                if(c[0].data && c[0].data.list){
                    transList = transList.concat(c[0].data.list);
                }

                CPS.time.start(transList.length);

                for(var i in transList) {
                    var trans = transList[i];
                    CPS.app.targetAddAdzones(trans,adzoneId,type,bidPrice,function(){CPS.time.success()},function(){CPS.time.fail()});
                }

            });
        });
    };

    CPS.layout.deladzone = function(){
        var panel = "<div id='auto_adjust_div' class='row'>"+
            "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td><td></td></tr>"+
            "<tr><td>资源位：</td><td colspan='2'><p class='adzone_input'>" +
            "<select name='adzoneId'><option value='34502344,2'>PC_流量包_网上购物_淘宝首页焦点图(34502344)</option></select>"+
            "</p></td></tr>"+
            "<tr><td><a class='CPS_bt' id='CPS_adzone_del_btn'>删除资源位</a></td><td></td><td></td></tr>" +
            "</table></div>";

        $("#CPS_tools_container .content .panel").html(panel);
        $("#CPS_tools_container").hide();
        $("#CPS_exector_msg").html("");
        CPS.app.adzoneSelectHtml();

        $("#CPS_adzone_del_btn").unbind();
        $("#CPS_adzone_del_btn").one("click",function(){
            var self = $(this);
            self.html("正在处理,请稍候..");
            var campaignid = $("#auto_adjust_div").find("input[name=campaignid]").val();
            var ad = $("#auto_adjust_div").find("select[name=adzoneId]").val();
            var a = ad.split(",");
            var adzoneId = a[0];
            $.when(CPS.app.findAdgroupList(campaignid,1),CPS.app.findAdgroupList(campaignid,2),CPS.app.findAdgroupList(campaignid,3)).then(function(a,b,c){
                var transList = [];
                if(a[0].data && a[0].data.list){
                    transList = transList.concat(a[0].data.list);
                }
                if(b[0].data && b[0].data.list){
                    transList = transList.concat(b[0].data.list);
                }
                if(c[0].data && c[0].data.list){
                    transList = transList.concat(c[0].data.list);
                }

                CPS.time.start(transList.length);

                for(var i in transList) {
                    var batchUnbindAdzones = [];
                    var trans = transList[i];
                    batchUnbindAdzones.push({"campaignId":trans.campaignId,"adzoneId":adzoneId,"transId":trans.transId});
                    CPS.app.unbindAdzones(batchUnbindAdzones,function(){
                        CPS.time.success()
                    },function(){
                        CPS.time.fail()
                    });
                }

            });
        });

    };

    CPS.layout.adboard = function(){
        $("#CPS_tools_container").hide();
        var panel = "<div id='batch_adjust_adboard' class='row'>"+
            "<table class='table'><tr><td>计划编号：</td><td><input type='text' name='campaignid' value=''/></td></tr>"+
            "<tr><td>移除创意：</td><td><input type='text' name='searchid' value=''/></td></tr>"+
            "<tr><td>添加创意：</td><td><input type='text' name='replaceid' value=''/></td></tr>"+
            "<tr><td><a class='CPS_bt' id='CPS_adboard_btn'>替换创意</a></td><td></td></tr></table></div>";

        $("#CPS_tools_container .content .panel").html(panel);

        $("#CPS_exector_msg").html("");
       // CPS.app.adzoneSelectHtml();


        $("#CPS_adboard_btn").unbind();
        $("#CPS_adboard_btn").one("click",function(){
            var self = $(this);
            var campaignid = $("#batch_adjust_adboard").find("input[name=campaignid]").val();
            var searchid =  $("#batch_adjust_adboard").find("input[name=searchid]").val();
            var replaceid = $("#batch_adjust_adboard").find("input[name=replaceid]").val();

            self.html("正在处理,请稍候..");
            if(campaignid == undefined || campaignid<=0 || isNaN(campaignid)){
                self.html("计划编号不能为空!");
                return false;
            }
            searchid = parseInt(searchid);
            replaceid = parseInt(replaceid);
            if(isNaN(searchid) && isNaN(replaceid)){
                self.html("移除创意和添加创意不能同时为空!");
                return false;
            }
            $.when(CPS.app.findAdgroupList(campaignid,1),CPS.app.findAdgroupList(campaignid,2),CPS.app.findAdgroupList(campaignid,3)).then(function(a,b,c){
                var transList = [];
                if(a[0].data && a[0].data.list){
                    transList = transList.concat(a[0].data.list);
                }
                if(b[0].data && b[0].data.list){
                    transList = transList.concat(b[0].data.list);
                }
                if(c[0].data && c[0].data.list){
                    transList = transList.concat(c[0].data.list);
                }

                CPS.time.start(transList.length);

                for(var i in transList) {
                    var trans = transList[i];
                    if (isNaN(searchid) && replaceid > 0) {
                        CPS.app.addAdboard2(trans.campaignId, trans.transId, replaceid);
                    } else if (isNaN(replaceid) && searchid > 0) {
                        CPS.app.delAdboard2(trans.campaignId, trans.transId, searchid);
                    } else if (replaceid > 0 && searchid > 0) {
                        CPS.app.replaceAdboard(trans.campaignId, trans.transId, searchid, replaceid);
                    }else{

                    }
                }

            });

        });

        $("#CPS_tools_container").show();
    };

    CPS.layout.create = function(){
        $("#CPS_tools_container").hide();
        $("#CPS_exector_msg").html("");
        CPS.app.getSetting(function(data){
            var panel = "";
            if(data.campaignid && data.campaignid>0){
                 panel = "<div id='batch_create' class='row'>"+
                    "<table class='table'><tr><td>计划编号：</td><td>"+data.campaignid+"</td></tr>"+
                    "<tr><td><a class='CPS_bt' href='http://cps.da-mai.com/zuanshi/setting/index2.html?nick="+CPS.app.nick+"' target='_blank'>重新设置</a></td><td><a class='CPS_bt'  id='CPS_auto_create'>开始推广</a></td></tr></table></div>";
            }else{
                 panel = "<p><a href='http://cps.da-mai.com/zuanshi/setting/index2.html?nick="+CPS.app.nick+"' target='_blank'>未获取到批量推广设置,马上去进行设置.</a></p>";
            }
            $("#CPS_tools_container .content .panel").html(panel);
            $("#CPS_tools_container").show();

            $("#CPS_auto_create").unbind();
            $("#CPS_auto_create").one("click",function(){
                var self = $(this);
                self.html("正在处理,请稍候..");

                CPS.app.getSetting(function(data2){

                    CPS.app.campaignid = data2.campaignid;
                    CPS.app.creatives =  data2.creatives;
                    CPS.app.adzone =  data2.adzone;

                    if(data2.type==1) {
                        CPS.time.start(data2.dmps.length);
                        for(var i in data2.dmps){
                            CPS.adgroup.createByDmp(data2.dmps[i]);
                        }

                    }else{
                        CPS.app.shopNames = data2.shops;
                        CPS.app.shopLabels = [];
                        for (var i in CPS.app.shopNames) {
                            CPS.app.shopLabels.push(i);
                        }
                        CPS.app.shopInfo2(CPS.app.shopLabels.join(","), function (data) {

                            CPS.time.start(data.length);

                            for (var i in data) {
                                var shop = {
                                    shopId: data[i].shopId,
                                    nickname: data[i].nickname,
                                    cnt: CPS.app.shopNames[data[i].nickname]
                                };
                                CPS.app.createTrans(shop);
                            }

                        });
                    }

                },function(){
                    self.html("低价批量推广失败，请刷新界面重试！");
                });

            });
        })
    };

    CPS.layout.menu = function(){
        var menuHtml = "<div id='CPS_layout_menu'><ul style='display: none'>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_create'>批量推广...</a></li>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_adjust'>统一出价...</a></li>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_adjust_i'>加大投放...</a></li>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_adjust_d'>减少投放...</a></li>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_adboard'>替换创意...</a></li>"+
            "</ul><div id='CPS_layout_icon'><div class='img_box'><i class='icon'></i></div></div></div>";
        $("body").append(menuHtml);
        $("#CPS_layout_icon").click(function(){
            $("#CPS_layout_menu ul").toggle();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_create']").click(function(){
            CPS.layout.create();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_adjust']").click(function(){
            CPS.layout.adjust();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_adjust_i']").click(function(){
            CPS.layout.adjust_i();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_adjust_d']").click(function(){
            CPS.layout.adjust_d();
        });

        //$("#CPS_layout_menu a[data-target='CPS_layout_add_ad']").click(function(){
        //    CPS.layout.addadzone();
        //});
        //
        //$("#CPS_layout_menu a[data-target='CPS_layout_del_ad']").click(function(){
        //    CPS.layout.deladzone();
        //});

        $("#CPS_layout_menu a[data-target='CPS_layout_adboard']").click(function(){
            CPS.layout.adboard();
        });

    };

    $(document).ready(function(){
        CPS.app.start();
    });



    //
    //    $("#CPS_auto_adzone").click(function(){
    //        for(var page=1;page<=7;page++){
    //            CPS.app.getAdzoneList(page)
    //        }
    //    });


})($);







