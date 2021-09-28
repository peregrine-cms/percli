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
      instanceName: 'sling',
      host: 'localhost',
      user: 'admin',
      pass: 'admin'
    }
  },
  server: {
    settings: path.join(os.homedir(), '.perclirc')
  }
}

module.exports = config