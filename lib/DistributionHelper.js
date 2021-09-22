const axios = require('axios')

async function getDistroArtifactList() {
  const url = "https://raw.githubusercontent.com/wiki/peregrine-cms/percli/percli-server-install-script.md"

  return await axios.get(url)
    .then(res => {
      if (res.status == 200) {
        distroAll = res.data.split(/\r?\n/).filter(line  => (line.length > 0 && line.includes('http')))
        return {
          core: distroAll.filter(url => (url.includes('peregrine-builder'))),
          pkgs: distroAll.filter(url => (url.includes('percli')))
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