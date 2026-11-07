const form = document.getElementById('form');
const firstname_input = document.getElementById('firstname-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const confirm_password_input = document.getElementById('confirm-password-input');
const error_message = document.getElementById('error-message');
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Helper function used by the input and submit event handlers
// Check one field using the same rules during typing and signup/login form submission
function getInputError(input, isSubmitting = false) {
    const value = input.value.trim()

    if (input === firstname_input && value === '') {
        return 'First name is required'
    }

    if (input === firstname_input && value.length < 2) {
        return 'Name must be at least 2 characters long'
    }

    if (input === email_input && value === '') {
        return 'Email is required'
    }

    if (input === email_input && !emailPattern.test(value)) {
        return 'Enter a valid email address (name@example.com)'
    }

    if (input === password_input) {
        if (value === '') {
            return 'Password is required'
        }
        if (value.length < 8) {
            return 'Password must be at least 8 characters long'
        }
    }

    if (
        input === confirm_password_input &&
        (isSubmitting || input.value !== '') &&
        input.value !== password_input.value
    ) {
        return 'Passwords do not match'
    }

    return ''
}

function updateInputValidation(input, isSubmitting = false) {
    // Get this field's validation message using the current input value
    const error = getInputError(input, isSubmitting)

    // Also mark the password invalid if it no longer matches confirmation
    const passwordsDoNotMatch = input === password_input &&
        confirm_password_input &&
        (isSubmitting || confirm_password_input.value !== '') &&
        confirm_password_input.value !== password_input.value

    // Add or remove the red error styling based on the validation result
    input.parentElement.classList.toggle('incorrect', Boolean(error) || passwordsDoNotMatch)
    return error
}

// On submit, show validation errors/prevent submission and redirect to account.html after successful validation.
form.addEventListener('submit', (e) => {
    const errors = allInputs.map(input => updateInputValidation(input, true)).filter(Boolean)

    if (errors.length > 0) {
        e.preventDefault()
        error_message.innerText = errors.join('. ')
    } else {
        e.preventDefault()
        sessionStorage.setItem(
            'accountSuccessMessage',
            firstname_input ? 'Account registered successfully!' : 'Login successful! Explore your account.'
        )
        showPageLoader()

        window.setTimeout(() => {
            window.location.href = 'account.html'
        }, 450)
    }
})

// Get inputs, Include only fields present on Login when on Login page (signup has extra fields)
const allInputs = [firstname_input, email_input, password_input, confirm_password_input].filter(input => input != null)

// Revalidate the edited field, changing a password also affects confirmation
allInputs.forEach(input => {
    input.addEventListener('input', () => {
        const inputsToValidate = input === password_input
            ? [password_input, confirm_password_input].filter(Boolean)
            : [input]
        const errors = inputsToValidate.map(field => updateInputValidation(field)).filter(Boolean)
        error_message.innerText = errors.join('. ')
    })
})