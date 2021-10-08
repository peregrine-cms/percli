const os = require('os')
const path = require('path')

const config = {
  download: {
    url: 'https://raw.githubusercontent.com/wiki/peregrine-cms/percli/percli-server-install-script-for-kickstarter.md',
    dir: 'out',
  },
  sling: {
    default: {
      port: 8080,
      instanceName: 'peregrine-cms',
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