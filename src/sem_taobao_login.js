chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    setTimeout(function(){
        var username = document.getElementById('TPL_username_1');
        username.value = msg.username;
        var password =   document.getElementById('TPL_password_1');
        password.value = msg.password;
    },2000);

});


