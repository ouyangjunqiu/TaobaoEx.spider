(function() {
    var CPS = {};
    CPS.app = {};
    CPS.board = {};
    CPS.campaign = {};
    CPS.utils = {};
    CPS.layout = {};
    CPS.process = {};
    CPS.dmp = {};
    CPS.adgroup = {};
    CPS.adzone = {};
    CPS.rpt = {};
    CPS.storage = {};
    CPS.mutex = {};
    CPS.lockdata = {};

    /**
     *
     * @param uri
     * @param data
     */
    CPS.utils.postdata = function(uri,data){
        chrome.extension.sendMessage({type: "ZUANSHIDATA",uri:uri,data:data})
    };

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
     *
     * @param id
     */
    CPS.mutex.load = function(id){
        var k = "zuanshi.mutex.data."+id;
        var d =  CPS.storage.get(k);
        if(d){
            CPS.lockdata = d;
        }else{
            CPS.lockdata = {};
        }
    };

    CPS.mutex.save = function(id){
        var k = "zuanshi.mutex.data."+id;
        CPS.storage.set(k,CPS.lockdata);
    };

    /**
     *
     * @param id
     */
    CPS.mutex.init = function(id){
        CPS.mutex.load(id);
        CPS.mutex.hwnd = setInterval(function(){
           CPS.mutex.save(id);
       },1000);

        setTimeout(function(){
            CPS.mutex.hwnd && clearInterval(CPS.mutex.hwnd);
        },120000);
    };
    /**
     * 检测是否锁定
     * @param i
     * @returns {boolean}
     */
    CPS.mutex.is = function(i){
        var d = CPS.lockdata[i];

        return !!(d && (d == 1));
    };
    /**
     * 加锁
     * @param i
     */
    CPS.mutex.lock = function(i){
        CPS.lockdata[i] = 1;
    };


    CPS.app.start = function () {
       /* var w = new WebStorageCache({storage: 'sessionStorage'});
        w.deleteAllExpires();*/

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
                url: 'https://zuanshi.taobao.com/loginUser/info.json',
                type: 'GET',
                dataType: 'jsonp',
                jsonpCallback: 'jsonp29',
                success: function (resp) {
                    if(resp.data && resp.data.loginUser && resp.data.loginUser.shopId){
                        CPS.app.csrfID = resp.data.csrfID;
                        CPS.app.rptToken = resp.data.rptToken;
                        CPS.app.loginUser = resp.data.loginUser;
                        CPS.app.shopId = resp.data.loginUser.shopId;
                        CPS.app.productPermission = resp.data.productPermission;

                        CPS.app.postUser();

                        CPS.layout.window();
                        CPS.mutex.init(CPS.app.shopId);

                        var f = new DateFormat();
                        var h = f.formatCurrentDate("HH");

                        h = parseInt(h);
                        if(h>=8 && h<=23){

                            CPS.app.run();
                        }

                        CPS.campaign.alert();
                        // CPS.board.alert();
                        setTimeout(function(){
                            CPS.board.findAdboardAll();

                            CPS.dmp.get();
                        },10000);

                    }
                }
            });
        }, 1000);
    };

    /**
     * 获取所有的DMP标签
     */
    CPS.dmp.get = function(){
        if(CPS.mutex.is("dmp")) return false;
        $.ajax({
            url:"https://zuanshi.taobao.com/dmpcrowdTarget/list.json",
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

    /**
     * 提交DMP标签
     * @param data
     */
    CPS.dmp.post = function(data){
        CPS.mutex.lock("dmp");
        CPS.utils.postdata("/zuanshi/dmp/source",{nick:CPS.app.nick,data:JSON.stringify(data)});
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

                    $("#CPS_campaign_alert .cls_btn").click(function () {
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
        CPS.utils.postdata("/main/shop/cloudupdate",{nick:  CPS.app.nick,userid:CPS.app.loginUser.userId,shopid:CPS.app.loginUser.shopId,usernumid:CPS.app.loginUser.userNumId});
    };


    /**
     * 智钻运行
     * @version 3.3.3
     * @returns {boolean}
     */
    CPS.app.runZuanshi = function(){

        var p = CPS.app.productPermission["productZuanshi"];
        if(!(p && p["productId"]))
            return false;

        CPS.app.productId = p.productId;
        CPS.rpt.AdvertiserHour();
        CPS.rpt.campaignToday();

        CPS.rpt.advertiserHistory("click",3);
        CPS.rpt.advertiserHistory("click",7);
        CPS.rpt.advertiserHistory("click",15);

        setTimeout(function(){

            var r3 = function(i){

                var t = Math.random()*1000+500;
                var f = new DateFormat();
                var e = f.addDays(new Date(), i, "yyyy-MM-dd");
                setTimeout(function(){
                    CPS.rpt.adboardHistory({effect:3,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetHistory({effect:3,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.adzoneHistory({effect:3,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetadzoneHistory({effect:3,effectType:"click",startTime:e,endTime:e});
                },t);
            };

            var r7 = function(i){
                var t = Math.random()*1000+1500;
                var f = new DateFormat();
                var e = f.addDays(new Date(), i, "yyyy-MM-dd");
                setTimeout(function(){
                    CPS.rpt.adboardHistory({effect:7,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetHistory({effect:7,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.adzoneHistory({effect:7,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetadzoneHistory({effect:7,effectType:"click",startTime:e,endTime:e});
                },t);
            };

            var r15 = function(i){
                var t = Math.random()*1000+2500;
                var f = new DateFormat();
                var e = f.addDays(new Date(), i, "yyyy-MM-dd");
                setTimeout(function(){
                    CPS.rpt.adboardHistory({effect:15,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetHistory({effect:15,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.adzoneHistory({effect:15,effectType:"click",startTime:e,endTime:e});
                    CPS.rpt.targetadzoneHistory({effect:15,effectType:"click",startTime:e,endTime:e});
                },t);
            };

            for(var i=-5;i<=-1;i++){
                r3(i);
            }

            for(var j=-9;j<=-7;j++){
                r7(j);
            }

            for(var k=-16;k<=-14;k++){
                r15(k);
            }

        },6000);

    };

    /**
     * 单品运行
     * @version 3.3.3
     * @returns {boolean}
     */
    CPS.app.runItemCpc = function(){

        var p = CPS.app.productPermission["productItemCpc"];
        if(!(p && p["productId"]))
            return false;

        CPS.rpt.advertiser4History("click",3);
        CPS.rpt.advertiser4History("click",7);
        CPS.rpt.advertiser4History("click",15);
    };

    /**
     * 运行
     * @version 3.3.3
     */
    CPS.app.run = function () {

        CPS.app.runZuanshi();

        CPS.app.runItemCpc();

    };

    /**
     *  获取全店推广报表
     *  @version 3.3.3
     */
    CPS.rpt.advertiserHistory = function (effectType,effect) {

        if(CPS.mutex.is("z"+effectType+effect))
            return false;

        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            var f = new DateFormat();
            var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
            var b = f.addDays(new Date(), -16, "yyyy-MM-dd");

            $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptAdvertiserDayList.json',
                dataType: 'json',
                data: {csrfID:  CPS.app.csrfID,token:CPS.app.rptToken,productId:CPS.app.productPermission["productZuanshi"].productId, startTime: b, endTime: e, campaignModel: 1,effectType:effectType,effect:effect},
                type: 'get',
                success: function (resp) {
                    if(resp && resp.info && resp.info.ok){
                        var data = resp.data.result;

                        CPS.utils.postdata("/zz/advertiserrpt/source",{effectType: effectType, effect:effect, data: JSON.stringify(data), nick: CPS.app.nick});
                        CPS.mutex.lock("z"+effectType+effect);
                    }
                }
            });


        }, t);
    };

    /**
     *  获取单品推广报表
     *  @version 3.3.3
     */
    CPS.rpt.advertiser4History = function (effectType,effect) {

        if(CPS.mutex.is("z4"+effectType+effect))
            return false;

        var t = parseInt(Math.random()*500+1000);
        setTimeout(function () {
            var f = new DateFormat();
            var e = f.addDays(new Date(), -1, "yyyy-MM-dd");
            var b = f.addDays(new Date(), -16, "yyyy-MM-dd");

            $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptAdvertiserDayList.json',
                dataType: 'json',
                data: {csrfID:  CPS.app.csrfID,token:CPS.app.rptToken,productId:CPS.app.productPermission["productItemCpc"].productId, startTime: b, endTime: e, campaignModel: 4,effectType:effectType,effect:effect},
                type: 'get',
                success: function (resp) {

                    if(resp && resp.info && resp.info.ok){
                        var data = resp.data.result;

                        CPS.utils.postdata("/zz/advertiserrpt4/source",{effectType: effectType, effect:effect, data: JSON.stringify(data), nick: CPS.app.nick});
                        CPS.mutex.lock("z4"+effectType+effect);
                    }
                }
            });


        }, t);
    };
    /**
     * 获取实时数据
     * @version 3.2.1
     */
    CPS.rpt.AdvertiserHour = function(){
        var t = parseInt(Math.random()*2000+500);
        var r = function () {
            var f = new DateFormat();
            var n = f.formatCurrentDate("yyyy-MM-dd");
            var y = f.addDays(new Date(), -1, "yyyy-MM-dd");
            $.when(
                $.ajax({
                    url: 'https://zuanshi.taobao.com/index/account.json',
                    dataType: 'json',
                    data: {csrfID: CPS.app.csrfID},
                    type: 'get'
                }),
                $.ajax({
                    url: 'https://report.simba.taobao.com/common/query/zszw/1/advertiserHourSumList.json',
                    dataType: 'json',
                    data: {
                        csrfID: CPS.app.csrfID,
                        token:CPS.app.rptToken,
                        productId:CPS.app.productId,
                        campaignModel:1,
                        logDate:y
                    },
                    type: 'get'
                }),
                $.ajax({
                    url: 'https://report.simba.taobao.com/common/query/zszw/1/advertiserHourList.json',
                    dataType: 'json',
                    data: {
                        csrfID: CPS.app.csrfID,
                        token:CPS.app.rptToken,
                        productId:CPS.app.productId,
                        campaignModel:1,
                        logDate:y
                    },
                    type: 'get'
                }),
                $.ajax({
                    url: 'https://report.simba.taobao.com/common/query/zszw/1/advertiserHourSumList.json',
                    dataType: 'json',
                    data: {
                        csrfID: CPS.app.csrfID,
                        token:CPS.app.rptToken,
                        productId:CPS.app.productId,
                        campaignModel:1,
                        logDate:n
                    },
                    type: 'get'
                }),
                $.ajax({
                    url: 'https://report.simba.taobao.com/common/query/zszw/1/advertiserHourList.json',
                    dataType: 'json',
                    data: {
                        csrfID: CPS.app.csrfID,
                        token:CPS.app.rptToken,
                        productId:CPS.app.productId,
                        campaignModel:1,
                        logDate:n
                    },
                    type: 'get'
                })
            ).then(function(a,b,c,d,e){
                if(a && b && c && a[0] && b[0] && c[0] && d[0] && e[0]){
                    if(a[0].info.ok && b[0].info.ok && c[0].info.ok && d[0].info.ok && e[0].info.ok){
                        var d1 = {total:b[0].data.result[0],list:c[0].data.result},
                            d2 = {total:d[0].data.result[0],list:e[0].data.result};

                        CPS.utils.postdata("/zz/advertiserhour/source",{
                            nick: CPS.app.nick,
                            account: JSON.stringify(a[0].data),
                            yesterday: JSON.stringify(d1),
                            data: JSON.stringify(d2)
                        });
                    }
                }
            })
        };
        setTimeout(r,t);
    };


    /**
     * 获取创意报表
     * @version 2.9.7
     *
     */
    CPS.app.rptnAdboardDayList = function(arg,fn){

        var k = "ad"+arg.effectType+arg.effect+arg.startTime+arg.endTime+arg.offset;
        k = k.replace(/-/g,"");
        if(CPS.mutex.is(k)){
            return false;
        }

        var t = parseInt(Math.random()*1000+arg.offset*10);
        var r = function() {

            return $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptCreativeList.json',
                dataType: 'json',
                data: {
                    csrfID:  CPS.app.csrfID,
                    token:CPS.app.rptToken,
                    productId:CPS.app.productId,
                    startTime: arg.startTime,
                    endTime: arg.endTime,
                    campaignModel: 1,
                    effectType:arg.effectType,
                    effect:arg.effect,
                    pageIndex:arg.offset/100+1,
                    offset:arg.offset,
                    pageSize:100


                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data,arg);
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取创意报表总量
     * @param arg
     * @param fn
     * @constructor
     * @version 3.2.1
     */
    CPS.rpt.CreativeListCount = function(arg,fn){
        $.ajax({
            url: 'https://report.simba.taobao.com/common/count/zszw/1/rptCreativeListCount.json',
            dataType: 'json',
            data: {
                csrfID:  CPS.app.csrfID,
                token:CPS.app.rptToken,
                productId:CPS.app.productId,
                startTime: arg.startTime,
                endTime: arg.endTime,
                campaignModel: 1,
                effectType: arg.effectType,
                effect: arg.effect,
                pageIndex:1,
                offset:0,
                pageSize:100


            },
            type: 'get',
            success: function (resp) {
                if (resp && resp.info && resp.info.ok) {
                    fn(resp.data,arg);
                }

            }
        })
    };

    /**
     * 获取所有的创意报表
     * @version 3.2.0
     *
     */
    CPS.rpt.adboardHistory = function(arg){

        CPS.rpt.CreativeListCount(arg,function(c,args){

            for(var offset = 0;offset < c.count;offset+=100){
                CPS.app.rptnAdboardDayList({
                    effect:args.effect,
                    effectType:args.effectType,
                    offset:offset,
                    startTime:args.startTime,
                    endTime:args.endTime
                },function(rpt,argi){
                    CPS.app.postRptnAboard2(rpt,argi);

                });

            }

        });
    };

    /**
     * 提交创意统计报表
     * @version 3.2.0
     *
     */
    CPS.app.postRptnAboard2 = function(rpt,arg){

        CPS.utils.postdata("/zz/history/adboard",{
            data:JSON.stringify(rpt),
            nick:CPS.app.nick,
            logdate:arg.startTime,
            offset:arg.offset,
            effectType:arg.effectType,
            effect:arg.effect
        });

    };

    /**
     * 获取定向统计报表
     * @param arg
     * @param fn
     * @version 3.2.0
     *
     */
    CPS.app.rptnDestDayList = function(arg,fn){
        var k = "dest"+arg.effectType+arg.effect+arg.startTime+arg.endTime+arg.offset;
        k = k.replace(/-/g,"");
        if(CPS.mutex.is(k)){
            return false;
        }

        var t = parseInt(Math.random()*1000+arg.offset*10);
        var r = function() {

            return $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptTargetList.json',
                dataType: 'json',
                data: {
                    csrfID:  CPS.app.csrfID,
                    token:CPS.app.rptToken,
                    productId:CPS.app.productId,
                    startTime: arg.startTime,
                    endTime: arg.endTime,
                    campaignModel: 1,
                    effectType:arg.effectType,
                    effect:arg.effect,
                    pageIndex:arg.offset/100+1,
                    offset:arg.offset,
                    pageSize:100


                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data,arg);
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取定向报表总量
     * @param arg
     * @param fn
     * @constructor
     * @version 3.2.0
     */
    CPS.rpt.TargetListCount = function(arg,fn){
        $.ajax({
            url: 'https://report.simba.taobao.com/common/count/zszw/1/rptTargetListCount.json',
            dataType: 'json',
            data: {
                csrfID:  CPS.app.csrfID,
                token:CPS.app.rptToken,
                productId:CPS.app.productId,
                startTime: arg.startTime,
                endTime: arg.endTime,
                campaignModel: 1,
                effectType: arg.effectType,
                effect: arg.effect,
                pageIndex:1,
                offset:0,
                pageSize:100


            },
            type: 'get',
            success: function (resp) {
                if (resp && resp.info && resp.info.ok) {
                    fn(resp.data,arg);
                }

            }
        })
    };

    /**
     * 获取所有的定向报表
     * @param arg
     * @version 3.2.0
     *
     */
    CPS.rpt.targetHistory = function(arg){

        CPS.rpt.TargetListCount(arg,function(c,args){

            for(var offset = 0;offset < c.count;offset+=100){
                CPS.app.rptnDestDayList({
                    effect:args.effect,
                    effectType:args.effectType,
                    offset:offset,
                    startTime:args.startTime,
                    endTime:args.endTime
                },function(rpt,argi){
                    CPS.app.postRptnDest2(rpt,argi);

                });

            }

        });
    };



    /**
     * 提交定向统计报表
     * @version 3.2.0
     *
     */
    CPS.app.postRptnDest2 = function(rpt,arg){
        CPS.utils.postdata("/zz/history/dest",{
            data:JSON.stringify(rpt),
            nick:CPS.app.nick,
            logdate:arg.startTime,
            offset:arg.offset,
            effectType:arg.effectType,
            effect:arg.effect
        });
    };

    /**
     * 获取定向资源位报表
     * @version 3.2.0
     *
     */
    CPS.app.rptnDestAdzoneDayList = function(arg,fn){
        var k = "destad"+arg.effectType+arg.effect+arg.startTime+arg.endTime+arg.offset;
        k = k.replace(/-/g,"");
        if(CPS.mutex.is(k)){
            return false;
        }

        var t = parseInt(Math.random()*1000+arg.offset*10);
        var r = function() {

            return $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptTargetAdzoneList.json',
                dataType: 'json',
                data: {
                    csrfID:  CPS.app.csrfID,
                    token:CPS.app.rptToken,
                    productId:CPS.app.productId,
                    startTime: arg.startTime,
                    endTime: arg.endTime,
                    campaignModel: 1,
                    effectType:arg.effectType,
                    effect:arg.effect,
                    pageIndex:arg.offset/100+1,
                    offset:arg.offset,
                    pageSize:100


                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data,arg);
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取定向资源位总量
     * @param arg
     * @param fn
     * @constructor
     */
    CPS.rpt.TargetAdzoneListCount = function(arg,fn){
        $.ajax({
            url: 'https://report.simba.taobao.com/common/count/zszw/1/rptTargetAdzoneListCount.json',
            dataType: 'json',
            data: {
                csrfID:  CPS.app.csrfID,
                token:CPS.app.rptToken,
                productId:CPS.app.productId,
                startTime: arg.startTime,
                endTime: arg.endTime,
                campaignModel: 1,
                effectType: arg.effectType,
                effect: arg.effect,
                pageIndex:1,
                offset:0,
                pageSize:100


            },
            type: 'get',
            success: function (resp) {
                if (resp && resp.info && resp.info.ok) {
                    fn(resp.data,arg);
                }

            }
        })
    };


    /**
     * 获取所有的定向统计报表
     * @version 3.2.0
     *
     */
    CPS.rpt.targetadzoneHistory = function(arg){

        CPS.rpt.TargetAdzoneListCount(arg,function(c,args){

            for(var offset = 0;offset < c.count;offset+=100){
                CPS.app.rptnDestAdzoneDayList({
                    effect:args.effect,
                    effectType:args.effectType,
                    offset:offset,
                    startTime:args.startTime,
                    endTime:args.endTime
                },function(rpt,argi){
                    CPS.app.postRptnDestAdzone2(rpt,argi);

                });

            }

        });
    };


    /**
     * 提交定向统计报表
     * @version 3.2.0
     *
     */
    CPS.app.postRptnDestAdzone2 = function(rpt,arg){
        CPS.utils.postdata("/zz/history/destadzone",{
            data:JSON.stringify(rpt),
            nick:CPS.app.nick,
            logdate:arg.startTime,
            offset:arg.offset,
            effectType:arg.effectType,
            effect:arg.effect
        });
    };

    /**
     * 获取资源位报表,新增缓存机制
     * @version 3.2.0
     *
     */
    CPS.app.rptnAdzoneDayList = function(arg,fn){
        var k = "adzone"+arg.effectType+arg.effect+arg.startTime+arg.endTime+arg.offset;
        k = k.replace(/-/g,"");
        if(CPS.mutex.is(k)){
            return false;
        }

        var t = parseInt(Math.random()*1000+arg.offset*10);
        var r = function() {

            return $.ajax({
                url: 'https://report.simba.taobao.com/common/query/zszw/1/rptAdzoneList.json',
                dataType: 'json',
                data: {
                    csrfID:  CPS.app.csrfID,
                    token:CPS.app.rptToken,
                    productId:CPS.app.productId,
                    startTime: arg.startTime,
                    endTime: arg.endTime,
                    campaignModel: 1,
                    effectType:arg.effectType,
                    effect:arg.effect,
                    pageIndex:arg.offset/100+1,
                    offset:arg.offset,
                    pageSize:100


                },
                type: 'get',
                success: function (resp) {
                    if (resp && resp.info && resp.info.ok) {
                        CPS.mutex.lock(k);
                        fn(resp.data,arg);
                    }

                }
            })
        };
        setTimeout(r,t);
    };

    /**
     * 获取资源位报表总量
     * @param arg
     * @param fn
     * @constructor
     */
    CPS.rpt.AdzoneListCount = function(arg,fn){
        $.ajax({
            url: 'https://report.simba.taobao.com/common/count/zszw/1/rptAdzoneListCount.json',
            dataType: 'json',
            data: {
                csrfID:  CPS.app.csrfID,
                token:CPS.app.rptToken,
                productId:CPS.app.productId,
                startTime: arg.startTime,
                endTime: arg.endTime,
                campaignModel: 1,
                effectType: arg.effectType,
                effect: arg.effect,
                pageIndex:1,
                offset:0,
                pageSize:100


            },
            type: 'get',
            success: function (resp) {
                if (resp && resp.info && resp.info.ok) {
                    fn(resp.data,arg);
                }

            }
        })
    };

    /**
     * 获取所有的资源位报表
     * @version 3.2.0
     *
     */
    CPS.rpt.adzoneHistory = function(arg){

        CPS.rpt.AdzoneListCount(arg,function(c,args){

            for(var offset = 0;offset < c.count;offset+=100){
                CPS.app.rptnAdzoneDayList({
                    effect:args.effect,
                    effectType:args.effectType,
                    offset:offset,
                    startTime:args.startTime,
                    endTime:args.endTime
                },function(rpt,argi){
                    CPS.app.postRptnAdzone2(rpt,argi);

                });

            }

        });
    };

    /**
     * 提交资源位报表
     * @version 3.0.5
     *
     */
    CPS.app.postRptnAdzone2 = function(rpt,arg){
        CPS.utils.postdata("/zz/history/adzone",{
            data:JSON.stringify(rpt),
            nick:CPS.app.nick,
            logdate:arg.startTime,
            offset:arg.offset,
            effectType:arg.effectType,
            effect:arg.effect
        });
    };

    /**
     * 获取有效的推广计划列表
     * @version 2.9.8
     */
    CPS.app.findCampaignList = function(fn){
        $.ajax({
            url:"https://zuanshi.taobao.com/mooncampaign/findCampaignList.json",
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

    /**
     * 获取计划报表
     * @version 3.2.1
     */
    CPS.rpt.campaignToday = function(){
        CPS.app.findCampaignList(function(data){
            if(data && data.list) {
                var list = data.list;
                var ids = [];
                for (var i in list) {
                    var campaign = list[i];
                    ids.push(campaign.campaignId);
                }
                var format = new DateFormat();
                var curDate = format.formatCurrentDate("yyyy-MM-dd");

                $.ajax({
                    url:"https://report.simba.taobao.com/common/query/zszw/1/campaignHourSumList.json",
                    type:"get",
                    dataType:"json",
                    data: {
                        csrfID: CPS.app.csrfID,
                        token:CPS.app.rptToken,
                        productId:CPS.app.productId,
                        campaignModel:1,
                        vs:2,
                        logDate:curDate,
                        idList:ids
                    },
                    success:function(resp){
                        if(resp && resp.info && resp.info.ok){
                            CPS.utils.postdata("/zuanshi/campaign/source",{
                                nick: CPS.app.nick,
                                data: JSON.stringify(list),
                                rptdata: JSON.stringify(resp.data.result)
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
        var html = "<div id='CPS_campaign_alert'><div class='hd'><p>计划过期提醒</p><a href='javascript:void(0)' class='cls_btn'>关闭</a></div>";
        var content = "<div class='content'>";
        var items = [];
        for(var i in campaigns){
            var campaign = campaigns[i];
            var format = new DateFormat();
            var result = format.compareTo(format.parseDate(campaign.endTime));
            var days = parseInt(Math.ceil(result/(24*60*60*1000)));
            items.push("<p><strong>"+campaign.campaignName+"</strong>将在<em>"+days+"</em>天后过期</p>");
        }
        content = content + items.join("")+"</div>";
        var footer = "<div class='f'><div class='btns'><button id='btn-w2'>24小时后提醒</button></div></div>";
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
                url: 'https://zuanshi.taobao.com/adgroup/createAdgroup.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,trans:JSON.stringify(trans)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok && resp.data && resp.data.transId) {
                        CPS.app.bindAdboard(resp.data.transId, CPS.app.creatives, function () {
                            CPS.process.success()
                        }, function () {
                            CPS.process.fail();
                        })
                    }else{
                        CPS.process.fail();
                    }

                },
                error:function(){
                    CPS.process.fail();
                }
            })

        }, 1000);
    };

    /**
     * 创建推广单元
     * @param dmp
     */
    CPS.adgroup.createByDmp = function(dmp){
        var t = Math.random()*4000+500;
        setTimeout(function () {
            var format = new DateFormat();
            var dateStr = format.formatCurrentDate("yyyyMMdd");
            var trans = {};
            trans.campaignId = CPS.app.campaignid;
            trans.transName = dmp.targetName+"_"+dateStr;
            trans.transAdzoneBinds = [];
            trans.intelligentBid = 1;
            trans.frequency = -1;
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
                url: 'https://zuanshi.taobao.com/adgroup/createAdgroup.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,trans:JSON.stringify(trans)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok && resp.data && resp.data.transId) {
                        CPS.app.bindAdboard(resp.data.transId, CPS.app.creatives, function () {
                            CPS.process.success()
                        }, function () {
                            CPS.process.fail();
                        })
                    }else{
                        CPS.process.fail();
                    }

                },
                error:function(){
                    CPS.process.fail();
                }
            })

        }, t);
    };

    /**
     * 批量替换资源位
     * @param crowd
     * @param adzoneId
     * @param adzoneType
     * @param bidPrice
     * @param fn
     * @param err
     */
    CPS.app.targetReplaceAdzone = function(crowd,adzoneId,adzoneType,bidPrice,fn,err){
        var l = [];
        l.push({
            "campaignId":crowd.campaignId,
            "adzoneId":adzoneId,
            "adzoneType":adzoneType,
            "transId":crowd.transId,
            "matrixPriceBatchVOList":[{"targetId":crowd.targetId,"targetType":crowd.targetType,"bidPrice":bidPrice}]
        });
        $.ajax({
            url: 'https://zuanshi.taobao.com/adgroup/bind/updateAllAdzoneBind.json',
            dataType: 'json',
            data: {
                csrfID: CPS.app.csrfID,
                adgroupBindAdzoneVOList:JSON.stringify(l)
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
                url: 'https://zuanshi.taobao.com/adgroup/bind/updateAllAdzoneBind.json',
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
            url: 'https://zuanshi.taobao.com/matrixprice/getTransXTargetXAdzoneByCrowd.json',
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
            url: 'https://zuanshi.taobao.com/matrixprice/getTransXTargetXAdzoneByCrowd.json',
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
            url: 'https://zuanshi.taobao.com/adgroup/bind/unbindAdzones.json',
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
                url: 'https://zuanshi.taobao.com/adgroup/bind/bindAdboard.json',
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
                url: 'https://zuanshi.taobao.com/matrixprice/batchModifyMatrixPrice.json',
                dataType: 'json',
                data: {
                    csrfID: CPS.app.csrfID,
                    matrixPriceBatchVOList: JSON.stringify(matrixPriceBatchVOList)
                },
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok){
                        CPS.process.success();
                    }else{
                        CPS.process.fail();
                    }
                },
                error:function(){
                    CPS.process.fail();
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
                url: 'https://zuanshi.taobao.com/trans/isHavingShop.json',
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

        chrome.extension.sendMessage({type: "ZUANSHISETTINGDATA",nick:CPS.app.nick},function(resp){
           // console.log(resp);
            if(resp.isSuccess && resp.data){
                fn(resp.data);
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
            url: 'https://zuanshi.taobao.com/adgroup/findAdgroupList.json',
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
            url: 'https://zuanshi.taobao.com/horizontalManage/findCrowdList.json',
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
                url: 'https://zuanshi.taobao.com/horizontalManage/findAdzoneList.json',
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
            url: ' https://zuanshi.taobao.com/horizontalManage/findAdboardList.json',
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

                },function(){CPS.process.fail()});
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

                },function(){CPS.process.fail()});
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
                    CPS.process.success();
                },function(){
                    CPS.process.fail();
                });
            }else{
                CPS.process.success();
            }

        },function(){
            CPS.process.fail();
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
            CPS.app.bindAdboard(transId,ids,function(){CPS.process.success()},function(){CPS.process.fail()});
        },function(){
            CPS.process.fail()
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
                url: 'https://zuanshi.taobao.com/horizontalManage/unbindAdboard.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,adboardList:JSON.stringify(aboard)},
                type: 'post',
                success: function (resp) {
                    if(resp.info && resp.info.ok){
                        CPS.process.success();
                    }else{
                        CPS.process.fail();
                    }
                },
                error:function(){
                    CPS.process.fail();
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
                CPS.process.success();
            }

        },function(){
            CPS.process.fail();
        });
    };

    CPS.app.getAdzoneList = function(page){
        var pager = {};
        pager.pageSize = 40;
        pager.index = page;
        pager.offset = (pager.index-1)* pager.pageSize;
        setTimeout(function () {
            $.ajax({
                url: ' https://zuanshi.taobao.com/adzone/findAdzoneList.json',
                dataType: 'json',
                data: {csrfID: CPS.app.csrfID,queryAdzoneParamStr:JSON.stringify(pager)},
                type: 'post',
                success: function (resp) {
                    if(resp.data && resp.data.list){
                        for(var i in resp.data.list){
                            var data = resp.data.list[i];

                            CPS.utils.postdata("/zuanshi/adzone/update",{adzone: JSON.stringify(data)});
                        }

                    }
                }
            });
        }, 1000);
    };


    CPS.adzone.get = function(){
        var d = CPS.storage.get("adzone.list.data");
        if(d){
            return d;
        }

        chrome.extension.sendMessage({type: "ZUANSHIADZONEDATA"},function(resp){

            CPS.storage.set("adzone.list.data",resp.data);
            return resp.data;

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


    /**
     * 获取创意库的创意数据
     * @param offset
     * @returns {*|{requires}}
     */
    CPS.board.findList = function(offset){
        if(CPS.mutex.is("ap"+offset))
            return false;

        var t = parseInt(Math.random()*500+500);
        setTimeout(function () {
            $.ajax({
                url:"https://zuanshi.taobao.com/aboard_package/find.json",
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
                type: 'get',
                success:function(resp){
                    if(resp.data && resp.data.list){

                        CPS.mutex.lock("ap"+offset);

                        CPS.utils.postdata("/zuanshi/aboardpackage/source",{
                            nick:CPS.app.nick,
                            data:JSON.stringify(resp.data.list)
                        });

                    }
                }
            })
        },t);
    };

    /**
     * 获取所有的创意
     */
    CPS.board.findAdboardAll = function(){
        $.when($.ajax({
            url:"https://zuanshi.taobao.com/aboard_package/find.json",
            dataType: 'json',
            data: {
                csrfID: CPS.app.csrfID,
                adzoneIdList:"",
                offset:0,
                pageSize:10,
                status:"P",
                adboardSize:"",
                adboardLevel:"",
                format:2,
                multiMaterial:"",
                adboardName:"",
                archiveStatus:0
            },
            type: 'get'})).then(function(a){
            if(a.data && a.data.list && a.data.count>0){
                for(var i=0;i<= a.data.count;i+=40){
                    CPS.board.findList(i);
                }

            }

        });


    };

    CPS.process.start = function(c){
        $("#CPS_exector_msg").html("正在处理...");
        CPS.process.i = 0;
        CPS.process.s = 0;
        CPS.process.e = 0;
        CPS.process.c = c;
        var fn = function(){
            $("#CPS_exector_msg").html("正在处理("+ CPS.process.i+"/"+ CPS.process.c+")，成功("+CPS.process.s+"),失败("+CPS.process.e+"),请稍等...");
            if(CPS.process.i>=CPS.process.c){
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
    CPS.process.incre = function(){
        CPS.process.i++;
    };
    CPS.process.success = function(){
        CPS.process.incre();
        CPS.process.s++;

    };
    CPS.process.fail = function(){
        CPS.process.incre();
        CPS.process.e++;
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

/*
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
                CPS.process.start(c);
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
                CPS.process.start(c);
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
                CPS.process.start(c);
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
            "<tr><td><a class='CPS_bt' id='CPS_adzone_btn' href='javascript:void(0)'>开始调整</a></td><td></td><td></td></tr>" +
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

                CPS.process.start(transList.length);

                for(var i in transList) {
                    var trans = transList[i];
                    CPS.app.targetReplaceAdzone(trans,adzoneId,type,bidPrice,function(){CPS.process.success()},function(){CPS.process.fail()});
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

                CPS.process.start(transList.length);

                for(var i in transList) {
                    var batchUnbindAdzones = [];
                    var trans = transList[i];
                    batchUnbindAdzones.push({"campaignId":trans.campaignId,"adzoneId":adzoneId,"transId":trans.transId});
                    CPS.app.unbindAdzones(batchUnbindAdzones,function(){
                        CPS.process.success()
                    },function(){
                        CPS.process.fail()
                    });
                }

            });
        });

    };
    */

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

                CPS.process.start(transList.length);

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
                        CPS.process.start(data2.dmps.length);
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

                            CPS.process.start(data.length);

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
            "<li><a href='javascript:void(0)' data-target='CPS_layout_adboard'>替换创意...</a></li>"+
            "<li><a href='javascript:void(0)' data-target='CPS_layout_campaign_alert'>计划过期提醒...</a></li>"+
            "</ul><div id='CPS_layout_icon'><div class='img_box'><i class='icon'></i></div></div></div>";
        $("body").append(menuHtml);
        $("#CPS_layout_icon").click(function(){
            $("#CPS_layout_menu ul").toggle();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_create']").click(function(){
            CPS.layout.create();
        });

        //$("#CPS_layout_menu a[data-target='CPS_layout_adjust']").click(function(){
        //    CPS.layout.adjust();
        //});
        //
        //$("#CPS_layout_menu a[data-target='CPS_layout_adjust_i']").click(function(){
        //    CPS.layout.adjust_i();
        //});
        //
        //$("#CPS_layout_menu a[data-target='CPS_layout_adjust_d']").click(function(){
        //    CPS.layout.adjust_d();
        //});
        //
        //$("#CPS_layout_menu a[data-target='CPS_layout_adzone']").click(function(){
        //    CPS.layout.addadzone();
        //});
        //
        //$("#CPS_layout_menu a[data-target='CPS_layout_del_ad']").click(function(){
        //    CPS.layout.deladzone();
        //});



        $("#CPS_layout_menu a[data-target='CPS_layout_adboard']").click(function(){
            CPS.layout.adboard();
        });

        $("#CPS_layout_menu a[data-target='CPS_layout_campaign_alert']").click(function(){
            $("#CPS_campaign_alert") && $("#CPS_campaign_alert").show();
        });

    };

    $(document).ready(function(){
        CPS.app.start();
    });


})($);







