const passwordInput =
document.getElementById("password");


const toggle =
document.getElementById("togglePassword");


if(toggle){

toggle.addEventListener("click",()=>{


if(passwordInput.type==="password"){

passwordInput.type="text";

toggle.textContent="🙈";

}

else{

passwordInput.type="password";

toggle.textContent="👁";

}


});

}