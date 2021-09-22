const axios = require('axios')

async function getDistributionArtifactsList() {
  const url = "https://raw.githubusercontent.com/wiki/peregrine-cms/percli/percli-server-install-script.md"

  return await axios.get(url)
    .then(res => {
      if (res.status == 200) {
        return res.data.split(/\r?\n/).filter(line  => (line.length > 0 && line.includes('http')))
      }
    })
    .catch(err => {
      console.error('Error fetching distribution artifact list', err.message)
      return []
    })
}


module.exports = {
  getDistributionArtifactsList
}