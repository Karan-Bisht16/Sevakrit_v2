const showSignUpPassword = document.querySelector("#showSignIpPassword");
const NGOSignUpPassword = document.querySelector("#NGOSignIpPassword");

showSignInPassword.addEventListener('click', ()=>{
    NGOSignInPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        NGOSignInPassword.setAttribute('type', 'password')
    }, 1000);
});