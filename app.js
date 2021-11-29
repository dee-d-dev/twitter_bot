require("dotenv").config();
const twit = require("./tweet");
const fs = require("fs");
const path = require("path");
const express = require("express");

const paramsPath = path.join(__dirname, "params.json");

function writeParams(data) {
  console.log(`we are writing params: ${data}`);
  fs.writeFileSync(paramsPath, JSON.stringify(data));
}

function readParams() {
  console.log(`we are reading params`);
  const data = fs.readFileSync(paramsPath);
  return JSON.parse(data.toString());
}

async function getTweets(since_id) {
  return new Promise((resolve, reject) => {
    let params = {
      q: "#adedotun",
      count: 10,
      result_type: "recent",
    };
    if (since_id) {
      params.since_id = since_id;
    }

    console.log("we are getting the tweets...", params);
    twit.get("search/tweets", params, (err, data) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

async function postRetweets(id) {
  let params = {
    id,
  };

  await twit.post("statuses/retweet/:id", params, (err, data) => {
    if (err) {
      return err;
    } else {
      return data;
    }
  });
}

async function main() {
  try {
    const params = readParams();
    const data = await getTweets(params.since_id);
    const tweets = data.statuses;
    console.log(`we got the tweets ${tweets.length}`);

    for await (let tweet of tweets) {
      try {
        await postRetweets(tweet.id_str);
        console.log(`successful retweet: ${tweet.id_str}`);
      } catch (e) {
        console.log(`unsuccessful retweet: ${tweet.id_str}`);
      }

      params.since_id = tweet.id_str;
    }
    writeParams(params);
  } catch (error) {
    console.error(error);
  }
}

console.log("starting the twitter bot");

setInterval(main, 10000);
