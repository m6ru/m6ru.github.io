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


// Modify the home function to call renderUserInfo with the fetched data
async function home() {
    logOutDiv.style.display = "";
    app.style.display = "";
    app.innerHTML = "";

    let header = document.createElement("h2");
    header.className = "sectionHeader";
    header.textContent = "Your profile information";
    app.appendChild(header);

    // Fetch user data
    let userData = await fetchUserData();
    console.log(userData)

    // Check if user data exists
    if (userData) {

        // Render user information to the page
        renderUserInfo(userData.data.user[0]);
       

    }
}

// Function to fetch user data
async function fetchUserData() {
    let token = localStorage.getItem('JWToken');
    try {
        let response = await fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                    { user {
                        id
                        login
                        createdAt
                        transactions {
                            id
                            type
                            amount
                            objectId
                            createdAt
                            path
                          }
                    }
                }`
            })
        });
        let data = await response.json();
        return data; // Return user data
    } catch (error) {
        console.log(error);
        return null; // Return null if error occurs
    }
}


// Function to render user information to the page
function renderUserInfo(userData) {

    // Create elements to display user information
    let userInfoContainer = document.createElement("div");
    userInfoContainer.className = "userInfoContainer";

    let userId = document.createElement("p");
    userId.textContent = "User ID: " + userData.id;

    let userLogin = document.createElement("p");
    userLogin.textContent = "Username: " + userData.login;

    let userCreatedAt = document.createElement("p");
    userCreatedAt.textContent = "Account created at: " + new Date(userData.createdAt).toLocaleString();

   // Calculate audits ratio
   let auditsRatio = calculateAuditsRatio(userData.transactions);

   // Create a paragraph element for audits ratio
   let auditsRatioPara = document.createElement("p");
   auditsRatioPara.textContent = "Audits Ratio: " + auditsRatio.toFixed(2);

   // Calculate XP progression
   let xpProgression = calculateXPProgression(userData.transactions);


   // Create a paragraph element for xp progression
   let xpProgressionElement = document.createElement("p");
   xpProgressionElement.textContent = "XP Progression: " + xpProgression/1000 + "kB";



    // Append user information elements to the container
    userInfoContainer.appendChild(userId);
    userInfoContainer.appendChild(userLogin);
    userInfoContainer.appendChild(userCreatedAt);
    userInfoContainer.appendChild(auditsRatioPara); 
    userInfoContainer.appendChild(xpProgressionElement);

    // Append the container to the app div
    app.appendChild(userInfoContainer);
}


// Function to calculate the audits ratio
function calculateAuditsRatio(transactions) {
    // Initialize variables to count "up" and "down" transactions
    let upAmount = 0;
    let downAmount = 0;

    // Loop through each transaction
    transactions.forEach(transaction => {
        // Check the type of transaction
        if (transaction.type === "up") {
            // Add the amount for up transaction
            upAmount += transaction.amount;
        } else if (transaction.type === "down") {
            // Add the amount for down transaction
            downAmount += transaction.amount;
        }
    });

    // Calculate audits ratio
    let auditsRatio = (upAmount / downAmount);

    return auditsRatio;
}

// Function to calculate the total XP progression gained from performed tasks
function calculateXPProgression(transactions) {
    let totalXP = 0;

    // Loop through each transaction
    transactions.forEach(transaction => {
        // Check if the transaction is for XP progression from performed tasks, taking out all the xp gained from piscines
        if (transaction.type === "xp" && !transaction.path.includes('piscine')) {
            totalXP += transaction.amount;
        }
        
    });

    return totalXP
}