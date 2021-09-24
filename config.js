const os = require('os')
const path = require('path')

const config = {
  download: {
    url: 'https://raw.githubusercontent.com/wiki/peregrine-cms/percli/percli-server-install-script-for-kickstarter.md',
    dir: 'out',
  },
  sling: {
    dir: 'sling',
    port: 8080,
    pid: 'sling.pid'
  },
  server: {
    settings: path.join(os.homedir(), '.perclirc')
  }
}

module.exports = config