const fs = require("fs")
const path = require("path")

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
    }
  })
  return arrayOfFiles
}

const getDependencies = rootJson => {
  let deps = []
  if (Array.isArray(rootJson)) {
    deps = rootJson.map(d => d['@id'])
    return deps
  }
  if (rootJson.extends) {
    if (Array.isArray(rootJson.extends)) {
      rootJson.extends.forEach(e => deps.push(e))
    } else {
      deps.push(rootJson.extends)
    }
  }
  if (rootJson.contents) {
    const comps = rootJson.contents.filter(c => c['@type'] === 'Component')
    comps.forEach(c => {
      if (typeof c.schema !== 'object') {
        if (deps.indexOf(c.schema) === -1) {
          deps.push(c.schema)
        }
      }
    })
  }
  return deps
}

const buildIndex = () => {
  const index = new Array();
  const allFiles = getAllFiles("dtmi")
  allFiles.forEach(async f => {
    const json = JSON.parse(fs.readFileSync(f, 'utf-8'))
    const id = json['@id']
    index.push({id,json})
  })
  return index
}

const stats = async () => {
  const res = new Map()
  const index = buildIndex()
  for (var i=0;i<index.length;i++) {
    const curId = index[i]['id']
    if (res[curId] === undefined) {
      res[curId] = 0
    }
    const deps = getDependencies(index[i]['json'])
    deps.forEach(d => {
      if (res[d]>-1) {
        const newCount = res[d] + 1
        res[d] = newCount
      } else {
        res[d] = 1
      }
    })
  }

  for(const item in res) {
    console.log(item + ', ' + res[item])
  }
}
stats()

