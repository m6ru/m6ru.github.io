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
   let auditsData = calculateAuditsRatio(userData.transactions);

   // Create a paragraph element for audits ratio
   let auditsRatioPara = document.createElement("p");
   auditsRatioPara.textContent = "Audits Ratio: " + auditsData.auditsRatio.toFixed(2);

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
    generateAuditRatioGraph(auditsData.auditsDone, auditsData.auditsReceived);
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

    // Return audits ratio, audits done, and audits received
    return {
        auditsRatio: auditsRatio,
        auditsDone: upAmount,
        auditsReceived: downAmount
    };
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


// Function to generate the doughnut graph for audit ratio using SVG
function generateAuditRatioGraph(auditsDone, auditsReceived) {
    // Calculate total audits
    const totalAudits = auditsDone + auditsReceived;

    // Calculate percentages
    const auditsDoneRatio = auditsDone / totalAudits;
    const auditsReceivedRatio = auditsReceived / totalAudits;

    // Set up SVG dimensions and parameters
    const svgWidth = 200;
    const svgHeight = 200;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const radius = 80;
    const strokeWidth = 40;

    // Calculate angles for audits done and audits received
const auditsDoneAngle = (360 * auditsDoneRatio);
const auditsReceivedAngle = 360 - auditsDoneAngle; // Corrected calculation

    // Create SVG container
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);

    // Create outer circle (background)
    const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerCircle.setAttribute("cx", centerX);
    outerCircle.setAttribute("cy", centerY);
    outerCircle.setAttribute("r", radius);
    outerCircle.setAttribute("stroke", "#e0e0e0");
    outerCircle.setAttribute("stroke-width", strokeWidth);
    outerCircle.setAttribute("fill", "none");
    svg.appendChild(outerCircle);


// Create audits done arc
const auditsDoneArc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
auditsDoneArc.setAttribute("cx", centerX);
auditsDoneArc.setAttribute("cy", centerY);
auditsDoneArc.setAttribute("r", radius);
auditsDoneArc.setAttribute("stroke", "#4CAF50"); 
auditsDoneArc.setAttribute("stroke-width", strokeWidth);
auditsDoneArc.setAttribute("fill", "none");
auditsDoneArc.setAttribute("stroke-dasharray", auditsDoneAngle + ", " + (360 - auditsDoneAngle));
svg.appendChild(auditsDoneArc);

// Create audits received arc
const auditsReceivedArc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
auditsReceivedArc.setAttribute("cx", centerX);
auditsReceivedArc.setAttribute("cy", centerY);
auditsReceivedArc.setAttribute("r", radius);
auditsReceivedArc.setAttribute("stroke", "#FF5722"); // Red color for audits received
auditsReceivedArc.setAttribute("stroke-width", strokeWidth);
auditsReceivedArc.setAttribute("fill", "none");
auditsReceivedArc.setAttribute("stroke-dasharray", auditsReceivedAngle + ", " + (360 - auditsReceivedAngle));
auditsReceivedArc.setAttribute("transform", `rotate(${auditsDoneAngle}, ${centerX}, ${centerY})`);
svg.appendChild(auditsReceivedArc);



    // Create text labels for audits done and audits received
    const auditsDoneLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    auditsDoneLabel.setAttribute("x", centerX);
    auditsDoneLabel.setAttribute("y", centerY - 10);
    auditsDoneLabel.setAttribute("font-size", "16px");
    auditsDoneLabel.setAttribute("text-anchor", "middle");
    auditsDoneLabel.textContent = `Audits Done: ${(auditsDoneRatio * 100).toFixed(2)}%`;
    svg.appendChild(auditsDoneLabel);

    const auditsReceivedLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    auditsReceivedLabel.setAttribute("x", centerX);
    auditsReceivedLabel.setAttribute("y", centerY + 20);
    auditsReceivedLabel.setAttribute("font-size", "16px");
    auditsReceivedLabel.setAttribute("text-anchor", "middle");
    auditsReceivedLabel.textContent = `Audits Received: ${(auditsReceivedRatio * 100).toFixed(2)}%`;
    svg.appendChild(auditsReceivedLabel);

    // Append SVG to container
    app.appendChild(svg);
}


