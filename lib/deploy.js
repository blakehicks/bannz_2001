// DEPLOY TASK !!!!
const fs = require('fs')
const jetpack = require('fs-jetpack')
const pkg = require('../package.json')
const AdmZip = require('adm-zip')
const figlet = require('figlet')
const chalk = require('chalk')
const zipFolder = 'dist'
let folders = []
let sizeRegExp = new RegExp('(\\d{2,}x\\d{2,})', 'g')

// UTILITIES
const utils = {
  getFolders: function (dir) {
    folders = []
    jetpack.inspectTree(dir).children.forEach(function (folder) {
      if (folder.type === 'dir' && folder.name.match(sizeRegExp)) {
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

//UPDATE STYLES ON SAVE
function styles(watchFolder) {
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
function scripts(watchFolder) {
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

//GET THE CLIENT NAME
const project = {
  get title() {
    return pkg.title
  },
}

//ZIP IT!!!!

function deploy() {
  utils.getFolders('src/banners')
  let tempFolder = 'dist/_ZIPPING'
  //CHECK FOR DIST FOLDER AND CREATE IF MISSING
  jetpack.dir('dist')
  //REMOVE EVERYTHING FROM DIST FOLDER
  let deleters = jetpack.find(zipFolder, {
    matching: '*',
    files: true,
    directories: true,
  })
  deleters.forEach((deleter) => {
    jetpack.remove(deleter)
  })
  //CREATE TEMP FOLDER
  jetpack.dir(tempFolder)
  //ITERATE OVER EACH CREATIVE
  if (folders.length == 0) {
    console.log(
      "\n//You've got nothing to deploy! Come back when you're ready.\n"
    )
    process.exit(1)
  }
  folders.forEach(function (folder) {
    let files = []
    //COPY BANNER FOLDERS TO TEMP FOLDER
    jetpack.copy('src/banners/' + folder, tempFolder + '/' + folder)
    //FIND UNNECESSARY STUFF
    files = jetpack.find(tempFolder, {
      matching: ['.DS_Store', '*.css', '*.js', '!style.css', '!*min.js'],
    })
    //DELETE UNNECESSARY STUFF
    files.forEach((file) => {
      jetpack.remove(file)
    })
    //STUPID ASCII ART
    figlet('Deploying: ' + folder + '!', function (err, data) {
      if (err) {
        console.log('Something went wrong...')
        console.dir(err)
        return
      }
      console.log(data + '\n\n')
    })
    //FINALLY ZIP AND ADD TO DIST
    let zip = new AdmZip()
    zip.addLocalFolder(tempFolder + '/' + folder)
    jetpack.write(
      zipFolder +
        '/' +
        project.title.replace(/ /g, '_') +
        '_' +
        folder +
        '.zip',
      zip.toBuffer()
    )
  })
  jetpack.remove(tempFolder)
}

exports.command = 'deploy'

exports.aliases = 'd'

exports.describe =
  'Zip up vendor-ready files and move to ' + chalk.magenta('/dist') + '.'

module.exports.handler = deploy
