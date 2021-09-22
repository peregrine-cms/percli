const request = require('request')
const fs = require('fs') 
const path = require('path')
const _cliProgress = require('cli-progress')

const DOWNLOAD_DIR='out'

async function progressDownload(url) {
  return await new Promise((resolve, reject) => {
    download(url, (result, err) => {
      if(err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/*
 * Code adapted from: https://webomnizz.com/download-a-file-with-progressbar-using-node-js/
 */
function download(url, callback) {

    const filename = url.substring(url.lastIndexOf('/')+1)

    const progressBar = new _cliProgress.SingleBar({
        format: `{bar} {percentage}% | ETA: {eta}s ${filename}`
    }, _cliProgress.Presets.shades_classic)

    if (!fs.existsSync(DOWNLOAD_DIR)){
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }

    const downloadPath = path.join(DOWNLOAD_DIR,filename) 
    const file = fs.createWriteStream(downloadPath)
    let receivedBytes = 0
   
    request.get(url)
    .on('response', (response) => {
        if (response.statusCode !== 200) {
            return callback('Response status was ' + response.statusCode)
        }

        const totalBytes = response.headers['content-length']
        progressBar.start(totalBytes, 0)
    })
    .on('data', (chunk) => {
        receivedBytes += chunk.length
        progressBar.update(receivedBytes)
    })
    .pipe(file)
    .on('error', (err) => {
        fs.unlink(filename)
        progressBar.stop()
        return callback(err.message)
    })

    file.on('finish', () => {
        progressBar.stop()
        file.close(callback)
    })

    file.on('error', (err) => {
        fs.unlink(filename) 
        progressBar.stop()
        return callback(err.message)
    })
}

module.exports = {
    progressDownload
}