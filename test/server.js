const { createServer } = require("http")
const { readdir, readFile } = require('fs/promises')
const { basename, join } = require("path")

const [,, basefolder = 'custom_symbols', port = '3000'] = process.argv

createServer((req, res) => {
  route(req.url)
    .then(text => {
      res.write(text)
      res.end()
    })
    .catch(error => {
      console.error(error)
      res.statusCode = 404
      res.end()
    })
})
.listen(port, _ => console.log(`Open http://localhost:${port}#+#0+#h+#h40+#p+#m+#m40 in your browser`))

async function route (url) {
  if (url === '/custom_symbols/list/cs') {
    return JSON.stringify(await getIconList(basefolder), null, 2)
  }

  let filePath = url.startsWith('/custom_symbols/icon/cs')
    ? join(basefolder, basename(url))
    : url === '/main.js'
      ? join(__dirname, '../js/main.js')
      : join(__dirname, './index.html')

  return readFile(filePath, 'utf-8')
}

async function getIconList(folder) {
  return (await readdir(folder))
      .filter(name => name.endsWith('.svg'))
      .map(name => name.slice(0, -4))
}
