"use strict";

import yaml from "js-yaml";
import Octokat from "octokat";
import Promise from "bluebird";
import { writeFileSync } from "fs";

//const config = "https://raw.githubusercontent.com/github/government.github.com/gh-pages/_data/governments.yml"
const config = "https://raw.githubusercontent.com/asmith-nhsx/xgov-opensource-repo-scraper/master/example.yml"

const octo = new Octokat({
  token: process.env.GITHUB_TOKEN,
});

const formatResult = (result) => {
  return {
    owner: result.owner.login,
    name: result.name,
    url: result.html.url,
    archived: result.archived,
    license: result.license,
    stargazersCount: result.stargazersCount,
    // watchersCount: result.watchersCount, // github api appears to be returning the same as the stargazersCount?!
    language: result.language,
    forksCount: result.forksCount,
    openIssuesCount: result.openIssuesCount//,
    //readMe: result.readme
  };
};

const fetchAll = async (org, args) => {
  let response = await octo.orgs(org).repos.fetch({ per_page: 100 });
  let aggregate = [response];

  console.log(`fetched page 1 for ${org}`);
  //console.log(response.name);
  //console.log(response.readme);
  let i = 1;
  await Promise.delay(200); //slow down to appease github rate limiting
  while (response.nextPage) {
    i++;
    response = await response.nextPage();
    console.log(`fetched page ${i} for ${org}`);
    //console.log(response[0].name);
    //console.log(response[0].readme);
    //console.log(response);
    await Promise.delay(200); //slow down to appease github rate limiting
    aggregate.push(response);
  }
  return aggregate;
};

const allDepartments = yaml.safeLoad(
  await (
    await fetch(
      config
    )
  ).text()
);

const UKDepartments = [].concat(
  allDepartments["U.K. Councils"],
  allDepartments["U.K. Central"]
);

const allReposForAllUKDepartments = await Promise.mapSeries(
  UKDepartments,
  fetchAll
);

const formattedResults = allReposForAllUKDepartments.flat(2).map(formatResult);

console.log("writing results to file");
writeFileSync("./public/repos.json", JSON.stringify(formattedResults));
console.log("done");
