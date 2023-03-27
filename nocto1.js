import { Octokit } from "octokit"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// import { Base64 } from "Base64"
dotenv.config()
// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
var tt = process.env.GITHUB_TOKEN

// const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// })

// // Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
// const {
//   data: { login },
// } = await octokit.rest.users.getAuthenticated();
// console.log("Hello, %s", login);

// console.log("Creating Issues");
// await octokit.rest.issues.create({
//   owner: "brentreeves",
//   repo: "theotr",
//   title: "CoolBeansIssue",
//   body: "I created this issue using Octokit!",
// });

// var owner = 'brentreeves'
// var repo = 'theotr'
// await octokit.request(`POST /repos/{owner}/{repo}/issues`, {
//   owner: "brentreeves",
//   repo: "theotr",
//   title: "CoolBeansIssue3",
//   body: "I created this issue using Octokit! 3",
// });
// // var f1 = Base64.encode(   "BleeBlahBlue")

// // get a file
// const { data } = await octokit.rest.repos.getContent({
//   mediaType: {
//     format: "raw",
//   },
//   owner: "brentreeves",
//   repo: "theotapi",
//   path: "docs/book_deu.html",
// });
// console.log("book_deu.html: %s", data);
// // console.log("package name: %s", JSON.parse(data).name);

// Source: https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0

const { Octokit } = require('@octokit/rest')
const glob = require('globby')
const path = require('path')
const { readFile } = require('fs-extra')


// org or owner
const ORGANIZATION = process.env.ORGANIZATION
const REPO = process.env.REPO
const BRANCH = process.env.BRANCH || 'main'
const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || 'Auto generated Commit Msg'

const main = async (workspace) => {
    const octo = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })
    // listForOrg(org) or listForUser(username)
    const repos = await octo.rest.repos.listForOrg({
        org: ORGANIZATION,
    })
    const repoNames = repos.data.map((repo) => repo.name)
    if (!repoNames.includes(REPO)) {
        await createRepo(octo, ORGANIZATION, REPO)
    }
    const workspacePath = path.join(__dirname, workspace)
    await uploadToRepo(octo, workspacePath, ORGANIZATION, REPO, BRANCH)

    console.log('Pushed commit')
}

// createInOrg or createForAuthenticatedUser
const createRepo = async (octo, org, name) => {
    await octo.rest.repos.createInOrg({ org, name, auto_init: true })
}

const uploadToRepo = async (octo, coursePath, org, repo, branch) => {
    // gets commit's AND its tree's SHA
    const currentCommit = await getCurrentCommit(octo, org, repo, branch)
    const filesPaths = await glob(coursePath)
    const filesBlobs = await Promise.all(filesPaths.map(createBlobForFile(octo, org, repo)))
    const pathsForBlobs = filesPaths.map(fullPath => path.relative(coursePath, fullPath))
    const newTree = await createNewTree(
        octo,
        org,
        repo,
        filesBlobs,
        pathsForBlobs,
        currentCommit.treeSha
    )
    const newCommit = await createNewCommit(
        octo,
        org,
        repo,
        COMMIT_MESSAGE,
        newTree.sha,
        currentCommit.commitSha
    )
    await setBranchToCommit(octo, org, repo, branch, newCommit.sha)
}


const getCurrentCommit = async (octo, org, repo, branch) => {
    const { data: refData } = await octo.rest.git.getRef({
        owner: org,
        repo,
        ref: `heads/${branch}`,
    })
    const commitSha = refData.object.sha
    const { data: commitData } = await octo.rest.git.getCommit({
        owner: org,
        repo,
        commit_sha: commitSha,
    })
    return {
        commitSha,
        treeSha: commitData.tree.sha,
    }
}

// Notice that readFile's utf8 is typed differently from Github's utf-8
const getFileAsUTF8 = (filePath) => readFile(filePath, 'utf8')

const createBlobForFile = (octo, org, repo) => async (filePath) => {
    const content = await getFileAsUTF8(filePath)
    const blobData = await octo.rest.git.createBlob({
        owner: org,
        repo,
        content,
        encoding: 'utf-8',
    })
    return blobData.data
}

const createNewTree = async (octo, owner, repo, blobs, paths, parentTreeSha) => {
    // My custom config. Could be taken as parameters
    const tree = blobs.map(({ sha }, index) => ({
        path: paths[index],
        mode: `100644`,
        type: `blob`,
        sha,
    }))
    const { data } = await octo.rest.git.createTree({
        owner,
        repo,
        tree,
        base_tree: parentTreeSha,
    })
    return data
}

const createNewCommit = async (octo, org, repo, message, currentTreeSha, currentCommitSha) =>
    (await octo.rest.git.createCommit({
        owner: org,
        repo,
        message,
        tree: currentTreeSha,
        parents: [currentCommitSha],
    })).data

const setBranchToCommit = (octo, org, repo, branch, commitSha) =>
    octo.rest.git.updateRef({
        owner: org,
        repo,
        ref: `heads/${branch}`,
        sha: commitSha,
    })

main('docs')

