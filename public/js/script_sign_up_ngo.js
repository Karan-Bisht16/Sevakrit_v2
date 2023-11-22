const showSignUpPassword = document.querySelector("#showSignUpPassword");
const NGOSignUpPassword = document.querySelector("#NGOSignUpPassword");

showSignUpPassword.addEventListener('click', ()=>{
    NGOSignUpPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        NGOSignUpPassword.setAttribute('type', 'password')
    }, 1000);
});

const overlay = document.querySelector("#overlay");
const NGOCoordinates = document.querySelector("#NGOCoordinates");
navigator.geolocation.watchPosition(success, error);

function success(position){
    let positionObj = {
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude
    };
    NGOCoordinates.setAttribute('value', JSON.stringify(positionObj));
    console.log(positionObj);
    // overlay.classList.add('hidden');
}
function error() {
    // overlay.classList.remove('hidden');
    alert("Allow geolocation access");
}