const successMessage = document.getElementById('account-success-message')
const message = sessionStorage.getItem('accountSuccessMessage')

if (message) {
    successMessage.textContent = message
    successMessage.hidden = false
    sessionStorage.removeItem('accountSuccessMessage')
}
