import { Octokit } from "octokit"
import * as dotenv from 'dotenv'
import path from 'path'
import { globby } from 'globby'
import pkg from 'fs-extra'
const { readFile } = pkg;

const __dirname = path.resolve();
// import { Base64 } from "Base64"
dotenv.config()

const octo = new Octokit({ auth: process.env.GITHUB_TOKEN, })

const REPO = process.env.REPO
const OWNER = process.env.OWNER
const BRANCH  = process.env.BRANCH
const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || 'Beautiful Commit Msg'

// Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
const { data: { login }, } = await octo.rest.users.getAuthenticated();
console.log("Hello, %s", login);

const createIssue = async (anIssue, aText) => {
    await octo.rest.issues.create({
	owner: OWNER,
	repo: REPO,
	title: anIssue,
	body: aText
    });
}

//
// and again with POST syntax
//
const createIssuePOST = async (anIssue, aText) => {
    await octo.request(`POST /repos/{owner}/{repo}/issues`, {
	owner: OWNER,
	repo: REPO,
	title: anIssue,
	body: aText
    });
}
// var f1 = Base64.encode(   "BleeBlahBlue")

// get a file
// eg: "docs/book_deu.html"
const retrieveFile = async (filename) => {
    const { data } = await octo.rest.repos.getContent({
	mediaType: { format: "raw", },
	owner: OWNER,
	repo: REPO,
	path: filename, 
    });
    console.log(`Filename: %s: %s`, filename, data);
}

// console.log("package name: %s", JSON.parse(data).name);

// Source: https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0

const pushCommit = async (workspace) => {
    console.log('pushCommit ', workspace)
    const workspacePath = path.join(__dirname, workspace)
    await uploadToRepo(octo, workspacePath, OWNER, REPO, BRANCH)
    console.log('Pushed commit ', workspacePath)
}

const uploadToRepo = async (octo, coursePath, org, repo, branch) => {
    // gets commit's AND its tree's SHA
    console.log('uploadToRepo')
    const currentCommit = await getCurrentCommit(octo, org, repo, branch)
    const filesPaths = await globby(coursePath)
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
    console.log(`uploadToRepo newTree: %s  newCommit: %s `, newTree, newCommit)
}


const getCurrentCommit = async (octo, owner, repo, branch) => {
    console.log('getCurrentCommit')
    const { data: refData } = await octo.rest.git.getRef({
        owner: owner,
        repo,
        ref: `heads/${branch}`,
    })
    const commitSha = refData.object.sha
    const { data: commitData } = await octo.rest.git.getCommit({
        owner: owner,
        repo,
        commit_sha: commitSha,
    })
    console.log('getCurrentCommit returning ', commitSha)
    return {
        commitSha,
        treeSha: commitData.tree.sha,
    }
}

// Notice that readFile's utf8 is typed differently from Github's utf-8
const getFileAsUTF8 = (filePath) => readFile(filePath, 'utf8')

const createBlobForFile = (octo, owner, repo) => async (filePath) => {
    console.log('createBlobForFile ')
    const content = await getFileAsUTF8(filePath)
    const blobData = await octo.rest.git.createBlob({
        owner: owner,
        repo,
        content,
        encoding: 'utf-8',
    })
    console.log('createBlobForFile end. ', blobData.data)
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
    console.log('createNewTree returning: ', data)
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

const setBranchToCommit = (octo, owner, repo, branch, commitSha) =>
      {
	  console.log('setBranchToCommit: ', commitSha)

	  octo.rest.git.updateRef({
              owner: owner,
              repo,
              ref: `heads/${branch}`,
              sha: commitSha,
	  })
      }

//
// ================================================================================
//
//createIssue('Mui Importante Issue', 'Not kidding, bucko, veh veh important.');
//createIssuePOST('Mui Importante POST Issue', 'Not kidding, bucko, veh veh POST important.');
retrieveFile('docs/blee.txt')

// pushCommit('docs/rando1.xml')
pushCommit('tosend')
