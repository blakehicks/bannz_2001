const gulp = require('gulp-help')(require('gulp'))
const { src, dest, series } = require('gulp')
const pkg = require('./package.json')
const browserSync = require('browser-sync').create()
const readlineSync = require('readline-sync')
const fs = require('fs-jetpack')
const path = require('path')
const del = require('del')
const zip = require('gulp-zip')
const chalk = require('chalk')
const rename = require('gulp-rename')
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')
const merge = require('merge-stream')
//POSTCSS
const cssnano = require('gulp-cssnano')
const autoprefixer = require('autoprefixer')
const variables = require('postcss-advanced-variables')
const calc = require('postcss-calc')
const position = require('postcss-position-alt')
const sorting = require('postcss-sorting')
const postcss = require('gulp-postcss')
// MISC OTHER SHIT
const uglify = require('gulp-uglify')
let argv = require('yargs').argv
let watchFolder = ''
let zipFolder = 'deploy'
let bannerList = []
let sizeRegExp = new RegExp('(\\d{2,}x\\d{2,})', 'g')

/* Setup: File paths and naming
--------------------------------------------------------------------------- */
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

const project = {
  get title() {
    return pkg.title
  },
  get desc() {
    return pkg.description
  },
}

/* Utilities
--------------------------------------------------------------------------- */
const utils = {
  getFolders: function (dir) {
    let folders = []
    fs.inspectTree(dir).children.forEach(function (folder) {
      if (folder.type === 'dir') {
        folders.push(folder.name)
      }
    })
    return folders
  },
  getBanners: function () {
    // return only folders with dimensions in label
    let banners = utils.getFolders('banners')
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
          filelist.push(fs.inspect(dir + '/' + file, { times: true }))
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

/* SUB-TASKS: Error Reporting
==================================================================================================== */
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

/* SUB-TASKS: Modify assets (html, images, styles, scripts) on change
==================================================================================================== */

//UPDATE HTML ON SAVE
function html() {
  return gulp
    .src(watchFolder + paths.html)
    .pipe(plumber({ errorHandler: reportError }))
}

//UPDATE ASSETS ON SAVE
function assets() {
  return gulp
    .src(watchFolder + paths.img)
    .pipe(plumber({ errorHandler: reportError }))
}

//UPDATE STYLES ON SAVE
function styles() {
  let processors = [
    require('precss')({}),
    autoprefixer(),
    variables(),
    position(),
    calc(),
    sorting({ 'sort-order': 'zen' }),
  ]
  return gulp
    .src(watchFolder + paths.css.source)
    .pipe(plumber({ errorHandler: reportError }))
    .pipe(postcss(processors))
    .pipe(
      cssnano({
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(rename('style.css'))
    .pipe(dest(watchFolder + paths.css.destination))
}

//UPDATE SCRIPTS ON SAVE
function scripts() {
  return gulp
    .src(watchFolder + paths.js.source)
    .pipe(plumber({ errorHandler: reportError }))
    .pipe(uglify())
    .pipe(rename('main-min.js'))
    .pipe(dest(watchFolder + paths.js.destination))
}

//UPDATE FILE INFO ON FIRST WATCH
async function watchDir() {
  if (!argv.folder) {
    console.log('nah')
    return
  }
  /* Directory Exists. Update the index page and style page to show the correct dimensions
  --------------------------------------------------------------------------- */
  let currentDirectory = fs.cwd('banners/' + argv.folder)
  watchFolder = currentDirectory.cwd()
  // The directory is available, let's update files to match the directory name
  let size = utils.getDimensions(argv.folder)

  // index.html -- set <meta name="ad.size"> and <title> to dimensions of folder
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
  fs.write(currentDirectory.cwd() + '/index.html', indexContent)

  // source.css -- set css letiable width/height, if it exists
  let source_css = 'assets/css/source.css'
  if (!fs.exists(watchFolder + '/' + source_css)) {
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
  fs.write(watchFolder + '/' + source_css, styleContent)
  html()
  styles()
  scripts()
}

/* MAIN TASK LIST 
==================================================================================================== */
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
  if (argv.folder) {
    watchFolder = 'banners/' + argv.folder
    watchDir()
  } else {
    utils.getBanners()
    let index = readlineSync.keyInSelect(
      bannerList,
      '// Enter the ' +
        chalk.magenta('number') +
        ' from the list above of the creative you want to view in the browser.'
    )
    argv.folder = bannerList[index]
    watchFolder = 'banners/' + argv.folder
    watchDir()
  }
  gulp
    .watch([watchFolder + paths.html])
    .on('change', gulp.series(html, browserSync.reload))
  gulp
    .watch([watchFolder + paths.img])
    .on('change', gulp.series(assets, browserSync.reload))
  gulp
    .watch(watchFolder + paths.css.source)
    .on('change', gulp.series(styles, browserSync.reload))
  gulp
    .watch(watchFolder + paths.js.source)
    .on('change', gulp.series(scripts, browserSync.reload))
}

exports.watch = series(watch, bsTask)

//DEPLOY
/* Clean: Remove any existing folders before proceeding
--------------------------------------------------------------------------- */
function cleanDeploy() {
  return del(['deploy/**/.*', 'deploy/**/*'], { force: true })
}
function cleanFolders() {
  return del(['deploy/**/*', '!deploy/*.zip'], { force: true })
}

/* Task: Deploy -- clean up folders/files, zip up for distribution
--------------------------------------------------------------------------- */
async function deployBuild() {
  fs.remove('deploy')
  fs.copy('banners', 'deploy')
}

/* SUB-TASK: Two actions: Zip up each directory, zip up all directories as one
==================================================================================================== */
async function zipUp() {
  var folders = utils.getFolders(zipFolder)

  // each folder will be zipped up
  let singleZip = folders.map(function (folder) {
    return gulp
      .src(path.join(zipFolder, folder, '/**/*'))
      .pipe(plumber({ errorHandler: reportError }))
      .pipe(zip(project.title + '_' + folder + '.zip'))
      .pipe(gulp.dest(zipFolder))
  })

  // if there is only one, there's no need to create a "group" zip too
  if (folders.length === 1) {
    return merge(singleZip)
  }

  // // all folders will be grouped and zipped up into one file
  // let groupZip = gulp
  //   .src(path.join(zipFolder, '/**/*'))
  //   .pipe(plumber({ errorHandler: reportError }))
  //   .pipe(zip(project.title + '-all(' + folders.length + ').zip'))
  //   .pipe(gulp.dest(zipFolder))

  return merge(singleZip)
}

exports.deploy = series(cleanDeploy, zipUp, cleanFolders, deployBuild)
