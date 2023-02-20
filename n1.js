// require("dotenv").config(); // token
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
var tt = process.env.TOKEN
// console.log('TOKEN:', tt )

import { Octokit } from "@octokit/rest";
// const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ 
    auth: tt,
});

try {
    var rc = await octokit.request("GET /repos/{owner}/{repo}/issues", {
	owner: "brentreeves",
	repo: "theotapi",
	per_page: 2
    })
	.then(({ data}) => {
	    console.log("\nHAPPY", data)
	});
} catch (err) {
    console.log("ERROR: ", err)
}
