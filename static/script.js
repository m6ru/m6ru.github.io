var usernameEmail = ""
var password = ""
var app = document.getElementById("app")
var logOutDiv = document.getElementById("logOutDiv")

init()

// initially get the 
function init() {
    
    //localStorage.clear() 
    let body = document.getElementById("app")
    if (localStorage.loggedIn != "true") {
        login()
    } else {
        home()
    }
}

function login() {
   
    //hide the app div, don't need to show it while login page
    app.style.display = "none"


    //get the loginDiv (html hardcoded)
    let loginDiv = document.getElementById("loginDiv")
    loginDiv.className = "login"


    let loginForm = document.createElement("form")
    let lineBreak = document.createElement("br")
    //can't append same linebreak 2 times somewhy to the form, so creating 2 different ones : D
    let lineBreak2 = document.createElement("br")
    
    let loginName = document.createElement("input")
    loginName.type = "text"
    loginName.name = "username"
    loginName.className = "input"
    loginName.placeholder = "Username or email"
    loginName.id = "username"
    loginName.required = true
   
    let loginPassword = document.createElement("input")
    loginPassword.type = "password"
    loginPassword.name = "password"
    loginPassword.className = "input"
    loginPassword.placeholder = "Password"
    loginPassword.id = "password"
    loginPassword.required = true

    loginPassword.addEventListener("keyup", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            authorize()
        }
    })

    let button = document.createElement("button")
    button.type = "submit"
    button.className = "button"
    button.innerHTML = "Login"
    
    let error = document.createElement("h2")
    error.style.display = "none"
    error.id = "error"
    error.className = "error"
    
// append all the shit to the loginForm -> to the loginDiv
    loginForm.appendChild(loginName)
    loginForm.appendChild(lineBreak)
    loginForm.appendChild(loginPassword)
    loginForm.appendChild(lineBreak2)
    loginForm.appendChild(button)
    loginForm.appendChild(error)
    loginDiv.appendChild(loginForm)
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
        authorize()
    })
}


async function authorize() {

    let error = document.getElementById("error")
    
    //hide error div, display only when appears
    error.style.display = "none"
    usernameEmail = document.getElementById("username").value
    password = document.getElementById("password").value

    // btoa(): This function is used to encode a string in base64. It takes a string as input and returns a base64-encoded ASCII string.
    //In this case, usernameEmail and password variables are concatenated together with a colon (:) between them.
    let data = btoa(usernameEmail + ':' + password);
    let response = await fetch("https://01.kood.tech/api/auth/signin", {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${data}`
        }
    })
    let token = await response.json()

    // error codes: 
    // 401 - request lacks valid authentication credentials for the target resource.
    // 403 - server understood the request but refuses to authorize it, due to permissions or security reasons. (WRONG username/pass)
    if (response.status == "401" || response.status == "403") {
       
        // show the errorDiv
        error.style.display = ""
        error.innerHTML = "Username / password incorrect, please try again"

        return
    }

    // Storing the information about token in the local storage and setting the loggedIn flag true
    localStorage.setItem('JWToken', token)
    localStorage.setItem('loggedIn', true)
   
    //turning the loginDiv off by not displaying it
    document.getElementById("loginDiv").style.display = "none"
    
    // Opening the home page
    home()
}


// function for logging out, this is hardcoded in HTML, so when clicking, triggers this:
function logout() {

    //remove the token and loggedIn information from local storage (ending the session basically)
    localStorage.clear()
    window.location.replace("/")
}

//this is the main beast :)

async function home() {
    logOutDiv.style.display = ""
    app.style.display = ""
    app.innerHTML = "";

    let header = document.createElement("h2")
    header.className = "sectionHeader"
    header.innerHTML = "Your profile information"
    app.appendChild(header)

    // creating a variable for the data that's going to be fetched
    let data = ""
    // variable for the authorization token, that we stored before
    let token = localStorage.getItem('JWToken')
    try {
        let response = await fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                // When making GraphQL queries, you'll supply the JWT using Bearer authentication. 
                // It will only allow access to the data belonging to the authenticated user.
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({

                // to find logic about how to get information from the query tables, see the page:
                // https://github.com/01-edu/public/tree/master/subjects/graphql
                query: `
                {user {
                    id
                    login
                    createdAt
                }
            }
            `
            })
        })
        data = await response.json()
    }
    catch (error) {
        console.log(error)
    }

    // Getting the data about the user and displaying it in the console.
    // Basic structure is here, now need to see what information need to get and how to display it.
    // Later also need to think how to make the diagrams
    console.log(data)
}
