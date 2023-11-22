const showSignUpPassword = document.querySelector("#showSignIpPassword");
const userSignUpPassword = document.querySelector("#userSignIpPassword");

showSignInPassword.addEventListener('click', ()=>{
    userSignInPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        userSignInPassword.setAttribute('type', 'password')
    }, 1000);
});