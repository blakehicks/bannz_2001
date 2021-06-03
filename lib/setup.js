const figlet = require('figlet')
const chalk = require('chalk')
const readlineSync = require('readline-sync')
const jetpack = require('fs-jetpack')
const fs = require('fs')
const axios = require('axios')
const parser = require('node-html-parser')
let sizeRegExp = new RegExp('(\\d{2,}x\\d{2,})', 'g')

function setup() {
  //DUMB ASCII INTRO
  console.log(
    figlet.textSync('bannz3000') +
      '\n----------------------------------------\n'
  )

  //INITIAL SETUP QUESTIONS
  //CLIENT NAME
  let curr_pkg = jetpack.read('package.json', 'json')
  let client_name = readlineSync.question(
    'Please enter ' + chalk.cyan("client's name: ")
  )
  curr_pkg.title = client_name
  jetpack.write('package.json', curr_pkg)

  //GSAP OR ANIME.JS
  let js_loc = 'src/banners/_banner_template/assets/js/main.js'
  let template_loc = 'src/banners/_banner_template/index.html'
  let root = ''
  let script = ''
  fs.readFile(template_loc, 'utf8', (err, html) => {
    if (err) {
      throw err
    }
    root = parser.parse(html)
    script = root.querySelector('[data-lib]')
  })
  let animLib = readlineSync.keyInSelect(
    ['GSAP', 'Anime.js'],
    '//Enter the ' +
      chalk.cyan('number') +
      ' above of your desired animation library.'
  )
  if (animLib === 0) {
    //INSERT GSAP CDNJS SCRIPT TAG
    getLatest('gsap')
  } else if (animLib === 1) {
    //INSERT ANIME.JS CDNJS SCRIPT TAG
    getLatest('animejs')
  } else {
    console.log(
      '\n//Process aborted...BY YOU. Try again when you feel a little more ready.\n'
    )
    process.exit(1)
  }

  async function getLatest(library) {
    try {
      const response = await axios.get(
        'https://api.cdnjs.com/libraries/' + library + '?fields=latest'
      )
      //WRITE CDN INTO SCRIPT TAG IN SRC/BANNERS/*/INDEX.HTML
      script.setAttribute('src', response.data.latest)
      jetpack.write(template_loc, root.toString())
      //WRITE STARTER ANIMATION CODE INTO SRC/BANNERS/*/ASSETS/JS/MAIN.JS
      if (library === 'gsap') {
        jetpack.write(
          js_loc,
          `// GSAP - https://greensock.com/docs/v3
var tl = gsap.timeline({repeat: 3, repeatDelay: 1});
tl.to("", {});
        `
        )
      } else if (library === 'animejs') {
        jetpack.write(
          js_loc,
          `// Anime.js - https://animejs.com/documentation/
var tl = anime.timeline({
  easing: "easeInOutQuad",
});
        
// Add Timeline Stages
tl.add({});
`
        )
      }
    } catch (error) {
      console.error(error)
    } finally {
      //CHOOSE STARTING SIZE
      let starting_size = readlineSync.question(
        '\n//Please enter the ' +
          chalk.cyan('size ') +
          'of the first banner you want to create (e.g. 300x250 or 300x250_yourtexthere): '
      )

      function sizeCheck(size) {
        if (size.match(sizeRegExp)) {
          console.log(
            '\n//Creating new folder ' +
              chalk.magenta('src/banners/' + starting_size) +
              '!\n'
          )
        } else {
          starting_size = readlineSync.question(
            '\n//Try again. A proper ' +
              chalk.cyan('size ') +
              "would be something like '300x250' or '300x250_yourtexthere': "
          )
          sizeCheck(starting_size)
        }
      }

      sizeCheck(starting_size)

      //COPY _BANNER_TEMPLATE INTO GENERATED FOLDER
      jetpack.copy(
        'src/banners/_banner_template',
        'src/banners/' + starting_size
      )
    }
    //DUMB ASCII OUTRO
    console.log(
      figlet.textSync('setup complete') +
        '\n----------------------------------------\n' +
        '\n//All set up! To watch your newly created ad for updates in the browser, try ' +
        chalk.magenta('yarn bannz watch') +
        '.\n'
    )
  }
}

exports.command = 'setup'

exports.aliases = 's'

exports.describe = 'Run initial setup.'

module.exports.handler = setup
