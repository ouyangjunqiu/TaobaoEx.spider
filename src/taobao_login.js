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
                            }else {
                                //var a = document.getElementById("nc_1_n1z");
                                //
                                //var e1 = document.createEvent("MouseEvents");
                                //e1.initMouseEvent("mousedown", true, true, document.defaultView, 0, 0, 0,
                                //    0, 0/*, false, false, false, false, 0, null*/);
                                //a.dispatchEvent(e1);
                                //
                                //var e11 = document.createEvent("MouseEvents");
                                //e11.initMouseEvent("mousemove", true, true, document.defaultView, 0, 0, 0,
                                //    100, 0/*, false, false, false, false, 0, null*/);
                                //a.dispatchEvent(e11);
                                //
                                //var e12 = document.createEvent("MouseEvents");
                                //e12.initMouseEvent("mousemove", true, true, document.defaultView, 0, 0, 0,
                                //    200, 0/*, false, false, false, false, 0, null*/);
                                //a.dispatchEvent(e12);
                                //
                                //var e13 = document.createEvent("MouseEvents");
                                //e13.initMouseEvent("mousemove", true, true, document.defaultView, 0, 0, 0,
                                //    300, 0/*, false, false, false, false, 0, null*/);
                                //a.dispatchEvent(e13);
                                //
                                //
                                //var e3 = document.createEvent("MouseEvents");
                                //e3.initMouseEvent("mouseup", true, true, document.defaultView, 0, 0, 0,
                                //            285, 0/*, false, false, false, false, 0, null*/);
                                //a.dispatchEvent(e3);
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

