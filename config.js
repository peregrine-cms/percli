const os = require('os')
const path = require('path')

const config = {
  download: {
    url: 'https://raw.githubusercontent.com/wiki/peregrine-cms/percli/percli-server-install-script-for-kickstarter.md',
    dir: 'out',
  },
  sling: {
    pid: 'sling.pid',
    default: {
      port: 8080,
      serverName: 'sling' 
    }
  },
  server: {
    settings: path.join(os.homedir(), '.perclirc')
  }
}

module.exports = config