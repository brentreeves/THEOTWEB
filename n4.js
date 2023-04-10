import { Octokit } from "octokit"
import * as dotenv from 'dotenv'

dotenv.config()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN, })

async function run() {
    // const { data: { login }, } = await octokit.rest.users.getAuthenticated();
    // console.log("Hello, %s", login);


    const {data: user } = await octokit.request('Get /user')
    console.log(`authenticated as ${user.login}`)

    const {data: bookdeu } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'brentreeves',
        repo: 'theotr',
        path: 't1.html'
        })

        // .sha
        // .content
    const content = Buffer.from(bookdeu.content, 'base64').toString()
    const updated = bumpVersion(content)
        console.log(updated)

    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner: 'brentreeves',
    repo: 'theotr',
    path: 't1.html',
    message: 'Boop',
    content: 'some content for the afile.txt file'
    })

    console.log(response.data)
}

run()

function bumpVersion(content) {
    return content.replace(
        /<title>THEOT (\d+)<\/title>/,
        (_content, content) =>
        `<title>THEOT (${Number(counter) + 1})<\/title>`
    )
}