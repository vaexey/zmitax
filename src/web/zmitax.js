const pageIds = document.location.href
    .split("?")[0]
    .replaceAll(".","_")
    .split("/")
    .slice(3)

const pageIdClasses = pageIds.map(i => `zmi_${i}`)
document.body.classList.add(...pageIdClasses)

if(pageIds.includes("st_logout_php"))
{
    document.location.href = "/baza/st_login.html"
}

async function includeHtml(src)
{
    const html = await getRequest(src)

    const zmitacDiv = document.getElementById("zmitax")
    zmitacDiv.innerHTML += html
}

async function getRequest(url) {
    return new Promise((res, rej) => {
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                {
                    res(this.responseText)
                    return
                }

                rej(this.status)
            }
        }
        xhttp.open("GET", url, true);
        xhttp.send();
    })
}

document.body.onload = async () => {
    zmitac_currentUser = await zmitac_getCurrentUser()

    await includeHtml(`/zmitax/static/pages/nav.html`)
    await includeHtml(`/zmitax/static/pages/${pageIds.join("/")}.html`)

    document.getElementsByClassName("navuser")[0].innerText = 
        zmitac_currentUser 
        ? `Zalogowano: ${zmitac_currentUser}`
        : ``
}

// zmitax wrapper functions
function zmitax_login(e)
{
    // e.preventDefault()

    const login = $("#login")[0].value.split(" ")
    const password = $("#password")[0].value.split(" ")

    document.querySelector(`[name="imie"]`).value = login[0]
    document.querySelector(`[name="nazwisko"]`).value = login[1]
    document.querySelector(`[name="password"]`).value = password
    document.querySelector(`input[value="Login"][type="Submit"]`).click()

    return false
}

let zmitac_currentUser
async function zmitac_getCurrentUser() {
    const html = await getRequest("/baza/st_main.php")

    if(html.indexOf("st_login1.php") != -1)
    {
        return null
    }

    const student = html.split("Student: ")

    if(student.length == 1)
    {
        await zmitac_forceChangeSubject()

        return null
    }

    return student[1].split("<")[0]
}

async function zmitac_forceChangeSubject() {
    const html = await getRequest("/baza/st_changesubject.php")

    const linkRegex = /"(st_changesubject1\.php\?[^\/]*)"/gi

    const match = linkRegex.exec(html)
    const subjectUrl = match[1]

    await getRequest(subjectUrl)

    document.location.href = "/baza/st_main.php"
}