chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    setTimeout(function(){
		var otherAccount = document.getElementById('J_OtherAccountV');
		if(otherAccount) otherAccount.click();
        var quickStatic = document.getElementById('J_Quick2Static');
        if(quickStatic) quickStatic.click();

        setTimeout(function(){
            var safeLogin = document.getElementById("J_SafeLoginCheck");
            if(safeLogin && safeLogin.checked)
            {
                safeLogin.click();
            }

            setTimeout(function(){
                if(msg.username && msg.password){
                    var username = document.getElementById('TPL_username_1');
                    username.focus();
                    username.value = msg.username;
                    var password =   document.getElementById('TPL_password_1');
                    password.focus();
                    password.value = msg.password;
                    var submitStatic = document.getElementById("J_SubmitStatic");
                    submitStatic.focus();
                    setTimeout(function(){
                        var noCaptcha = document.getElementById("nocaptcha");
                        if(noCaptcha) {
                            if(noCaptcha.style.display !="block") {
                                submitStatic = document.getElementById("J_SubmitStatic");
                                if (submitStatic) submitStatic.click();
                            }
                        }else{
                            submitStatic = document.getElementById("J_SubmitStatic");
                            if(submitStatic) submitStatic.click();
                        }
                    },4000);
                }

            },1000);


        },1000);

    },1000);

});

