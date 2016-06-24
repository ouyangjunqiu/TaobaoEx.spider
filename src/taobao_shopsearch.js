setTimeout(function(){
    var html = "<div id='auto_create' style='position: fixed;top: 12px;left: 10px;background: white'>"+
        "店铺名：<input type='text' name='nick' value=''/><br/>"+
        "<input type='button' id='shop-btn' style='line-height: 27px;background-color: #fa6d51; color: white;padding: 2px;border-radius: 4px;' value='数据未加载完..请拖动滚动条到最底端！'></div>";


    $("body").append(html);

    var procFn = function(){
    //    console.log($("#list-container .ks-datalazyload"));
        if($("#list-container .ks-datalazyload").length>0){
            $("#shop-btn").val("数据未加载完..请拖动滚动条到最底端！");
            setTimeout(procFn,1000);
        }else{
            $("#shop-btn").val("数据已加载完,采集竞争店铺");
        }
    };
    procFn();


    $("#shop-btn").click(function(){
        var nick = $("#auto_create").find("input[name=nick]").val();
        var shops = [];

        var keyword = $(".search-combobox-input").val();
        if(!keyword || keyword.length<=0){
            keyword = "相似店铺";
        }

        $("#list-container .list-item").each(function(){
            var nick = $(this).find(".shop-info-list a[trace='shop']").text();
            var cnt =  $(this).find(".info-sale em").text();
            shops.push({shopnick:nick.trim(),cnt:parseInt(cnt)});
        });

        console.log(shops);
        chrome.extension.sendMessage({type: "SHOPS",nick:nick,keyword:keyword,shops:shops},function(response){console.log(response);alert("添加成功");});

    });
},5000);