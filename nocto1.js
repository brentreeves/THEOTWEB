import { Octokit } from "octokit"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// import { Base64 } from "Base64"
dotenv.config()
// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
var tt = process.env.GITHUB_TOKEN

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();
console.log("Hello, %s", login);

console.log("Creating Issues");
await octokit.rest.issues.create({
  owner: "brentreeves",
  repo: "theotr",
  title: "CoolBeansIssue",
  body: "I created this issue using Octokit!",
});

var owner = 'brentreeves'
var repo = 'theotr'
await octokit.request(`POST /repos/{owner}/{repo}/issues`, {
  owner: "brentreeves",
  repo: "theotr",
  title: "CoolBeansIssue3",
  body: "I created this issue using Octokit! 3",
});
// var f1 = Base64.encode(   "BleeBlahBlue")

// get a file
const { data } = await octokit.rest.repos.getContent({
  mediaType: {
    format: "raw",
  },
  owner: "brentreeves",
  repo: "theotapi",
  path: "docs/book_deu.html",
});
console.log("book_deu.html: %s", data);
// console.log("package name: %s", JSON.parse(data).name);


// pages/api/publishArticle.js
// need the SHA of the file we're fixing to overwrite
async function getSHA(path) {
   const result = await octokit.repos.getContent({
     owner: "brentreeves",
     repo: "theotr",
     path,
   })
 
   const sha = result?.data?.sha
 
   return sha
 }
