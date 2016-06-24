setTimeout(function(){

       var html = "<div id='CPS_tools_container' class='left'>" +
        "<div class='hd'><p>精准投放平台小助手</p><a href='javascript:void(0)' id='cls-btn'>关闭</a></div>"+
        "<div class='content'>"+
            "<div class='row'><table class='table'>"+
        "<tbody><tr><td>店铺名:</td><td><input type='text' name='nick' value=''/></td></tr>"+
           "<tr><td><a class='CPS_bt' id='shop-btn'>采集竞品店铺</a></td><td></td></tr></tbody>"+
        "</table></div>"+
        "</div>"+
        "</div><div id='CPS_tools_menu' class='left'>精准投放平台小助手</div>";
    $("body").append(html);

    $("#cls-btn").click(function(){
        $("#CPS_tools_container").hide();
        $("#CPS_tools_menu").show();

    });
    $("#CPS_tools_menu").click(function(){
        $("#CPS_tools_container").show();
        $("#CPS_tools_menu").hide();
    });


    $("#shop-btn").click(function(){
        var nick = $("#CPS_tools_container").find("input[name=nick]").val();
        var shops = [];

        if($(".m-samestyleitem .item") &&  $(".m-samestyleitem .item").size()>0) {
            var keyword = $(".m-header .title__anchor").text().trim();

            $(".m-samestyleitem .item").each(function () {

                var imgElem = $(this).find(".item__img");
                var infoElem = $(this).find(".item__info");
                if (imgElem && infoElem) {
                    var a = imgElem.find(".img__anchor").attr("href"), b = imgElem.find(".img__inner").attr("src"),
                        c = infoElem.find(".info__name").text();



                    var shopElem = infoElem.find(".info__shopname");
                    var d = shopElem.text().trim(), url = shopElem.attr("href");
                    var cnt = $(this).find(".info__npaid").text();


                    shops.push({
                        shopnick: d.trim(),
                        cnt: parseInt(cnt),
                        nick: nick.trim(),
                        keyword: keyword.trim(),
                        src: "宝贝相似",
                        item: {num_iid:parseInt((a.match(/id=(\d+)/g)[0]).match(/(\d+)/g)[0]),detail_url: a, pic: b, title: c},
                        shop: {nick: d, url: url,userid:parseInt((url.match(/user_number_id=(\d+)/g)[0]).match(/(\d+)/g)[0])}
                    });

                }

            });
        }

        if($(".m-itemlist .item") && $(".m-itemlist .item").size()>0){
            var keyword = $(".search-combobox-input").val();

            $(".m-itemlist .item").each(function(){
                var picElem = $(this).find(".J_PicBox");
                var moreElem = $(this).find(".J_IconMoreNew");

                if(picElem && moreElem){
                    var linkElem = picElem.find(".pic-link");
                    var a = {num_iid:linkElem.attr("data-nid"),pic:linkElem.find(".img").attr("data-src"),title:linkElem.find(".img").attr("alt")};

                    var shopElem = $(this).find(".J_ShopInfo");
                    var b = {userid:shopElem.attr("data-userid"),nick:shopElem.children(1).text().trim(),url:shopElem.attr("href")};

                    var c = $(this).find(".deal-cnt").text();

                    shops.push({item:a,shop:b,cnt:parseInt(c),shopnick:b.nick,nick:nick.trim(),keyword:keyword.trim(),src:"淘宝搜索"});
                }

            });
        }

        chrome.extension.sendMessage({type: "SHOP_BID",nick:nick,keyword:keyword,shops:shops},function(response){console.log(response);alert("添加成功");});

        console.log(shops);
    });
},5000);
