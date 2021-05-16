// WATCH TASK !!!!
const pkg = require('../package.json')
const browserSync = require('browser-sync').create()
const readlineSync = require('readline-sync')
const fs = require('fs')
const jetpack = require('fs-jetpack')
const chalk = require('chalk')
const uglify = require('uglify-js')
const chokidar = require('chokidar')
//POSTCSS
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')
const variables = require('postcss-advanced-variables')
const calc = require('postcss-calc')
const position = require('postcss-position-alt')
const sorting = require('postcss-sorting')
const postcss = require('postcss')
const precss = require('precss')
// MISC OTHER SHIT
const figlet = require('figlet')
let argv = require('yargs').argv
let watchFolder = ''
let bannerList = []
let sizeRegExp = new RegExp('(\\d{2,}x\\d{2,})', 'g')

// SET PATHS
const paths = {
  html: '/index.html',
  img: '/assets/img/**/*',
  css: {
    source: '/assets/css/source.css',
    destination: '/assets/css/',
  },
  js: {
    source: '/assets/js/main.js',
    destination: '/assets/js/',
  },
}

// NAMING
const project = {
  get title() {
    return pkg.title
  },
}

// UTILITIES

const utils = {
  getFolders: function (dir) {
    let folders = []
    jetpack.inspectTree(dir).children.forEach(function (folder) {
      if (folder.type === 'dir') {
        folders.push(folder.name)
      }
    })
    return folders
  },
  getBanners: function () {
    // return only folders with dimensions in label
    let banners = utils.getFolders('src/banners')
    banners.forEach(function (item) {
      if (item.match(sizeRegExp)) {
        bannerList.push(item)
      }
    })

    return bannerList
  },
  walkDirectory: function (dir, filelist) {
    let fso = fso || require('fs')
    let files = fso.readdirSync(dir)
    filelist = filelist || []

    files.forEach(function (file) {
      if (fso.statSync(dir + '/' + file).isDirectory()) {
        filelist = utils.walkDirectory(dir + '/' + file, filelist)
      } else {
        if (!/(\.DS_Store|\.keep)/.test(file)) {
          filelist.push(jetpack.inspect(dir + '/' + file, { times: true }))
        }
      }
    })
    return filelist
  },
  getDimensions: function (item) {
    let dimensions = item.match(sizeRegExp)[0].split('x')
    return {
      width: parseInt(dimensions[0], 10),
      height: parseInt(dimensions[1], 10),
      get formatted() {
        return this.width + 'x' + this.height
      },
    }
  },
}

//UPDATE ASSETS ON SAVE
function assets() {
  return gulp
    .src(watchFolder + paths.img)
    .pipe(plumber({ errorHandler: reportError }))
}

//UPDATE STYLES ON SAVE
function styles() {
  fs.readFile(watchFolder + paths.css.source, (err, css) => {
    postcss([
      precss,
      autoprefixer,
      variables,
      position,
      calc,
      sorting({ 'sort-order': 'zen' }),
      cssnano,
    ])
      .process(css, {
        from: watchFolder + paths.css.source,
        to: watchFolder + paths.css.destination + 'style.css',
      })
      .then((result) => {
        fs.writeFile(
          watchFolder + paths.css.destination + 'style.css',
          result.css,
          () => true
        )
      })
  })
}

//UPDATE SCRIPTS ON SAVE
function scripts() {
  let result = uglify.minify(
    fs.readFileSync(watchFolder + paths.js.source, 'utf8')
  )
  fs.writeFile(
    watchFolder + paths.js.destination + 'main.min.js',
    result.code,
    function (err) {
      if (err) {
        console.log(err)
      }
    }
  )
}

//UPDATE FILE INFO ON FIRST WATCH
async function watchDir() {
  if (!argv.folder) {
    return
  }

  let currentDirectory = jetpack.cwd('src/banners/' + argv.folder)
  watchFolder = currentDirectory.cwd()

  let size = utils.getDimensions(argv.folder)

  let adSizeRegExp = new RegExp(
    'content="width=({{width}}|\\d{2,}), height=({{height}}|\\d{2,})"',
    'g'
  )
  let titleRexExp = new RegExp('<title>(.*)</title>', 'g')
  let indexContent = currentDirectory.read('index.html').toString()
  indexContent = indexContent.replace(
    adSizeRegExp,
    'content="width=' + size.width + ', height=' + size.height + '"'
  )
  indexContent = indexContent.replace(
    titleRexExp,
    '<title>' +
      project.title +
      ' | ' +
      size.width +
      'x' +
      size.height +
      '</title>'
  )
  jetpack.write(currentDirectory.cwd() + '/index.html', indexContent)

  let source_css = 'assets/css/source.css'
  if (!jetpack.exists(watchFolder + '/' + source_css)) {
    return
  }
  let styleContent = currentDirectory.read(source_css).toString()
  styleContent = styleContent.replace(
    /\$width:\s?({{width}}|\d{2,}px);/g,
    '$width: ' + size.width + 'px;'
  )
  styleContent = styleContent.replace(
    /\$height:\s?({{height}}|\d{2,}px);/g,
    '$height: ' + size.height + 'px;'
  )
  jetpack.write(watchFolder + '/' + source_css, styleContent)
  styles()
  scripts()
  bsTask()
}

/////////// MAIN TASKS /////////////

//BROWSERSYNC
async function bsTask() {
  browserSync.init({
    server: {
      baseDir: watchFolder,
    },
    notify: false,
  })
}
//WATCH
async function watch() {
  //IF FOLDER ARG SET
  if (argv.folder) {
    watchFolder = 'src/banners/' + argv.folder
    watchDir()
  }
  //IF IT AIN'T, LET'S MAKE A LIST
  else {
    utils.getBanners()
    let index = readlineSync.keyInSelect(
      bannerList,
      '// Enter the ' +
        chalk.magenta('number') +
        ' from the list above of the creative you want to view in the browser.'
    )
    argv.folder = bannerList[index]
    watchFolder = 'banners/' + argv.folder
    //TRIGGER FIRST DIRECTORY LOOKVER
    watchDir()
  }
  //STUPID ASCII ART
  figlet(argv.folder + '!', function (err, data) {
    if (err) {
      console.log('Something went wrong...')
      console.dir(err)
      return
    }
    console.log(data)
  })
  //WATCH FOR CHANGES, UPDATE FILES AND RELOAD VIA BROWSERSYNC
  //HTML
  chokidar.watch(watchFolder + paths.html).on('change', (event, path) => {
    console.log(
      '\n' + chalk.magenta('//HTML') + ' changed. Reloading to reflect.\n'
    )
    browserSync.reload()
  })
  //CSS
  chokidar.watch(watchFolder + paths.css.source).on('change', (event, path) => {
    styles()
    console.log(
      '\n' + chalk.magenta('//CSS') + ' changed. Reloading to reflect.\n'
    )
    browserSync.reload()
  })
  //JS
  chokidar.watch(watchFolder + paths.js.source).on('change', (event, path) => {
    scripts()
    console.log(
      '\n' + chalk.magenta('//JavaScript') + ' changed. Reloading to reflect.\n'
    )
    browserSync.reload()
  })
}

//ERROR REPORTING
const reportError = function (error) {
  let lineNumber = error.line ? 'LINE ' + error.line + ' -- ' : ''

  notify({
    title: 'Task Failed [' + error.plugin + ']',
    message: lineNumber + 'See console.',
    // See: System Preferences… » Sound » Sound Effects
    sound: 'Basso',
  }).write(error)

  // Pretty error reporting
  let report = ''

  report += chalk.magenta('TASK:') + ' [' + error.plugin + ']\n'
  if (error.line) {
    report += chalk.magenta('LINE:') + ' ' + error.line + '\n'
  }
  report += chalk.magenta('PROB:') + ' ' + error.messageFormatted + '\n'
  console.error(report)

  // Prevent the `watch` task from stopping
  this.emit('end')
}

//LET'S GOOOOOOOOOOO
watch()
