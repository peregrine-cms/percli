const axios = require('axios')

const config = require('../config')

async function getDistroArtifactList() {

  return await axios.get(config.download.url)
    .then(res => {
      if (res.status == 200) {
        distroAll = res.data.split(/\r?\n/).filter(line  => (line.length > 0 && line.includes('http')))
        return {
          core: distroAll.filter(url => (url.includes('.far') || url.includes('.jar'))),
          pkgs: distroAll.filter(url => (url.includes('.zip')))
        }
      }
    })
    .catch(err => {
      console.error('Error fetching distribution artifact list', err.message)
      return {
        core: [],
        pkgs: []
      }
    })
}


module.exports = {
  getDistroArtifactList
}