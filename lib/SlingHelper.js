const axios = require('axios')
const { sling } = require('../config')
const config = require('../config')

const WAIT_TIME_MS = 5000

async function waitUntilBundlesReady(port) {

  let state = await checkBundles(port)
  while (!state) {
    await wait(WAIT_TIME_MS)
    state = await checkBundles(port)
  }
}

async function checkBundles(port) {

  let bundleUrl = `http://${config.sling.default.user}:${config.sling.default.pass}@${config.sling.default.host}:${port}/system/console/bundles.json`

  return await axios.get(bundleUrl)
    .then(res => {
      if (res.status == 200) {
        try {
          let status = res.data.s
          if (status[3] === 0 && status[4] === 0) {
            return true
          } else {
            console.log('waiting for active bundles')
            return false
          }
        } catch (err) {
          console.log('waiting for active bundles')
          return false
        }
      }
    })
    .catch(err => {
      console.log('waiting for active bundles')
      return false 
    })
}

async function wait(ms) {
  await new Promise(r => setTimeout(r, ms));
}

module.exports = {
  wait,
  waitUntilBundlesReady 
}