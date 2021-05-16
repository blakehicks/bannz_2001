// DEPLOY TASK !!!!
const fs = require('fs')
const jetpack = require('fs-jetpack')
const archiver = require('archiver')

const zipFolder = '/dist'
let bannerList = []
let sizeRegExp = new RegExp('(\\d{2,}x\\d{2,})', 'g')
const archive = archiver('zip', {
  zlib: { level: 9 },
})

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

//GET THE CLIENT NAME
const project = {
  get title() {
    return pkg.title
  },
}

//ZIP IT!!!!
function zipUp() {
  utils.getBanners()
  fs.mkdirSync('/src/_ZIPPING')
  bannerList.forEach((banner) => {
    console.log(banner)
  })
}
//let output = fs.createWriteStream(zipFolder + banner)

zipUp()
