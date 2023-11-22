const showSignUpPassword = document.querySelector("#showSignUpPassword");
const userSignUpPassword = document.querySelector("#userSignUpPassword");

showSignUpPassword.addEventListener('click', ()=>{
    userSignUpPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        userSignUpPassword.setAttribute('type', 'password')
    }, 1000);
});