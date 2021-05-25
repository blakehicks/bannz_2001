#! /usr/bin/env node
const figlet = require("figlet");
const chalk = require("chalk");
const yargs = require("yargs");
const readlineSync = require("readline-sync");
const jetpack = require("fs-jetpack");
const fs = require("fs");
const axios = require("axios");
const parser = require("node-html-parser");

//DUMB ASCII INTRO
console.log(figlet.textSync("bannz3000") + "\n--------------------\n");

//INITIAL SETUP QUESTIONS
//CLIENT NAME
let curr_pkg = jetpack.read("package.json", "json");
let client_name = readlineSync.question(
  "Please enter " + chalk.cyan("client's name: ")
);
curr_pkg.title = client_name;
jetpack.write("package.json", curr_pkg);

//GSAP OR ANIME.JS
let template_loc = "src/banners/_banner_template/index.html";
let root = "";
let script = "";
fs.readFile(template_loc, "utf8", (err, html) => {
  if (err) {
    throw err;
  }
  root = parser.parse(html);
  script = root.querySelector("[data-lib]");
});
let animLib = readlineSync.keyInSelect(
  ["GSAP", "Anime.js"],
  "//Enter the " +
    chalk.cyan("number") +
    " above of your favorite animation library."
);
if (animLib === 0) {
  //INSERT GSAP CDNJS SCRIPT TAG
  getLatest("gsap");
} else if (animLib === 1) {
  //INSERT ANIME.JS CDNJS SCRIPT TAG
  getLatest("animejs");
} else {
  console.log(
    "\n//Process aborted...BY YOU. Try again when you feel a little more ready.\n"
  );
  process.exit(1);
}

async function getLatest(library) {
  try {
    const response = await axios.get(
      "https://api.cdnjs.com/libraries/" + library + "?fields=latest"
    );
    //WRITE CDN INTO SCRIPT TAG IN INDEX.HTML
    script.setAttribute("src", response.data.latest);
    jetpack.write(template_loc, root.toString());
  } catch (error) {
    console.error(error);
  }
}
//CHOOSE STARTING SIZE
let starting_size = readlineSync.question(
  "\nPlease enter the " +
    chalk.cyan("size ") +
    "of the first banner you want to create (e.g. 300x250): "
);
console.log(starting_size);

console.log("\n//All set up! Make some banners, dude!\n");
