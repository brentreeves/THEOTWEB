import { Octokit } from "octokit"
import * as dotenv from 'dotenv'

dotenv.config()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN, })

async function run() {
    // const { data: { login }, } = await octokit.rest.users.getAuthenticated();
    // console.log("Hello, %s", login);


    const {data: user } = await octokit.request('Get /user')
    console.log(`authenticated as ${user.login}`)

    const {data: afile } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'brentreeves',
        repo: 'theotapi',
        path: 't1.html'
        })

        // .sha
        // .content
    const content = Buffer.from(afile.content, 'base64').toString()
    const updated = bumpVersion(content)
    console.log(`Updated: ${updated}`)

    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner: 'brentreeves',
    repo: 'theotapi',
    path: 't1.html',
    message: 'Boop',
    content: Buffer.from(updated, 'utf8').toString('base64'),
    sha: afile.sha
    })

    // console.log(response.data)
}

run()

function bumpVersion(content) {
    return content.replace(
        /<h1>THEOT \((\d+)/,
        (_content, counter) =>
        `<h1>THEOT (${Number(counter) + 1}`
    )
}