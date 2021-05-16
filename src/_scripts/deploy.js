// DEPLOY TASK !!!!
const fs = require('fs')
const jetpack = require('fs-jetpack')
const pkg = require('../../package.json')
const AdmZip = require('adm-zip')
const chalk = require('chalk')
const figlet = require('figlet')
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
  //IF ZIP FOLDER EXISTS, REMOVE TO REPLACE
  if (jetpack.exists(tempFolder)) {
    jetpack.remove(tempFolder)
  }
  //CREATE TEMP FOLDER
  jetpack.dir(tempFolder)
  //ITERATE OVER EACH CREATIVE
  folders.forEach(function (folder) {
    let files = []
    //COPY BANNER FOLDERS TO TEMP FOLDER
    jetpack.copy('src/banners/' + folder, tempFolder + '/' + folder)
    //FIND UNNECESSARY STUFF
    files = jetpack.find(tempFolder, {
      matching: ['.DS_Store', '*.css', '*.js', '!style.css', '!main-min.js'],
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
    let zip = new AdmZip()
    zip.addLocalFolder(tempFolder + '/' + folder)
    jetpack.write(zipFolder + '/' + folder + '.zip', zip.toBuffer())
  })
  jetpack.remove(tempFolder)
}
deploy()
