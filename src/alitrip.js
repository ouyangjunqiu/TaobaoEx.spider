setTimeout(function(){

    var html = "<div id='auto_create' style='position: fixed;top: 12px;left: 10px;background: white'>"+
        "店铺名：<input type='text' name='nick' value=''/><br/>"+
        "关键词：<input type='text' name='search-input' value=''/><br/>"+
        "<input type='button' id='shop-btn' style='line-height: 27px;background-color: #fa6d51; color: white;padding: 2px;border-radius: 4px;' value='采集竞争店铺'></div>";


    $("body").append(html);

    $("#shop-btn").click(function(){
        var nick = $("#auto_create").find("input[name=nick]").val();
        var shops = [];

        var keyword = $("#auto_create").find("input[name=search-input]").val();

            $("#travel-search-page .travel-list-wrapper .travel-list .item-info-content").each(function(){

                var nick = $(this).find(".seller-and-grade").children("a").eq(0).text();
                var cnt = $(this).parent().parent().find(".number").text();
                shops.push({shopnick:nick.trim(),cnt:parseInt(cnt)});
            });

        chrome.extension.sendMessage({type: "SHOPS",nick:nick,keyword:keyword,shops:shops},function(response){console.log(response);alert("添加成功");});

        console.log(shops);
    });
},5000);