chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    var nick = msg.nick;
    setTimeout(function(){
        if(document.getElementById("J_allMember_list")) {
            var text = document.getElementsByClassName('input');
            text['0'].value = nick;

            document.getElementsByClassName('iconfont')['0'].click();

            document.getElementsByTagName('td')['0'].className = "firstcell td-selected";

            document.getElementsByClassName('btn btn-orange btn-size30')['0'].click();

        }
    },3000);

});


$(document).ready(function(){
   setTimeout(function(){

       var r = function(){
           if($("#J_common_header")) {
               $.ajax({
                   url: "http://subway.simba.taobao.com/bpenv/getLoginUserInfo.htm",
                   type: "post",
                   dataType: "json",
                   success: function (resp) {
                       console.log(resp);
                       if(resp && resp.result){
                           $.ajax({
                               url: 'http://cps.da-mai.com/main/shop/cloudupdate.html',
                               dataType: 'json',
                               data: {nick:resp.result.nickName,usernumid:resp.result.outsideNumID},
                               type: 'post'
                           });
                       }


                   }
               })
           }else{
               setTimeout(r,2000);
           }
       };

       r();


   },3000);
});






