const { execSync, spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const { peregrineBanner } = require('../lib/Banner')
const config = require('../config')

const CMD_STOP = 'stop'
const CMD_STATUS = 'status'
const CMD_THREADS = 'threads'

function createInstallDir(instanceName) {

  if (!fs.existsSync(instanceName)){
    fs.mkdirSync(instanceName)
  } else {
    console.error(`Installation directory '${instanceName}' already exists.`)
    process.exit(-1)
  }
}

function startSling(instanceName) {

    if (!isSlingInstalled(instanceName)) {
      console.error("Peregrine is not installed. Run 'percli server install'")
    } else if (!isSlingRunning(instanceName)) {

      peregrineBanner()

      const port = getPortForServer(instanceName)
      const runmodes = getRunModesForServer(instanceName)
      const jarPath = path.join(getDownloadDirForServer(instanceName), config.kickstarter.jar)
      const farPath = path.join(getDownloadDirForServer(instanceName), config.kickstarter.far) 

      process.chdir(getPathForServer(instanceName))

      const args = []
      args.push(`--add-opens 'java.base/java.lang=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/java.net=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/sun.net.www.protocol.file=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/sun.net.www.protocol.ftp=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/sun.net.www.protocol.http=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/sun.net.www.protocol.https=ALL-UNNAMED'`)
      args.push(`--add-opens 'java.base/sun.net.www.protocol.jar=ALL-UNNAMED'`)
      args.push(`-jar ${jarPath}`)
      args.push(`-c sling`)
      args.push(`-p ${port}`) 
      if (runmodes) {
        args.push(`-D sling.runmodes=${runmodes}`)
      }
      args.push(`-s ${farPath}`) 
  
      const child = spawn('java', args, {
        detached: true,
        shell: true,
        stdio: 'inherit'
      })
      child.unref()
    } else {
        console.error('Server is already running')
    }
}

function stopSling(instanceName) {
  execKickstarterCmd(instanceName, CMD_STOP)
}

function statusSling(instanceName) {
  return execKickstarterCmd(instanceName, CMD_STATUS)
}

function threadsSling(instanceName) {
  execKickstarterCmd(instanceName, CMD_THREADS)
}

function execKickstarterCmd(instanceName, cmd) {
  const controlPort = getControlPortForServer(instanceName)
  if (!controlPort) {
    console.error(`Can't execute comand '${cmd}'. No control port found`)
    return -1
  }
  const jarPath = path.join(getDownloadDirForServer(instanceName), config.kickstarter.jar)
  // kickstart has a bug which requires that it is run in the launcher directory (i.e. sling dir)
  process.chdir(path.join(getPathForServer(instanceName), 'sling'))

  const args = []
  args.push('java')
  args.push(`-jar ${jarPath}`)
  args.push(`-j ${controlPort}`)
  args.push(cmd) 

  try {
    execSync(args.join(' '), 'ignore')
    return 0
  } catch(err) {
    return err.status
  }
}

function isSlingRunning(instanceName) {
  let exitCode = execKickstarterCmd(instanceName, CMD_STATUS)
  return (exitCode === 0)
}

function isSlingInstalled(instanceName) {
  let installPath = getPathForServer(instanceName)
  if (installPath) {
    return fs.existsSync(installPath)
  }
  return false
}

function listServers() {
  const serverConfig = config.server.settings

  if (fs.existsSync(serverConfig)) {
      const settings = JSON.parse(fs.readFileSync(serverConfig).toString())
      console.log('instance'.padEnd(15), 'running'.padEnd(8), 'port'.padEnd(6), 'runmodes'.padEnd(24), 'path')
      settings.forEach( (server) => {
        let runmodes = server.runmodes ? server.runmodes : ''  
        console.log(server.name.padEnd(15), isSlingRunning(server.name).toString().padEnd(8), server.port.toString().padEnd(6), runmodes.padEnd(24), server.path)
      })
  } else {
      console.error('no server configuration file found at', serverConfig)
  }
}

function addServer(instanceName, port, path, runmodes) {
  const serverConfig = config.server.settings

  let settings = []
  if(fs.existsSync(serverConfig)) {
      settings = JSON.parse(fs.readFileSync(serverConfig).toString())
  }
  settings.push( {name: instanceName, path: path, port: port, runmodes: runmodes})
  fs.writeFileSync(serverConfig, JSON.stringify(settings, true, 2))
}

function serverExists(instanceName) {
  return typeof getPathForServer(instanceName) !== 'undefined'
}

function getServer(instanceName) {
  const serverConfig = config.server.settings

  let settings = []
  if (fs.existsSync(serverConfig)) {
    settings = JSON.parse(fs.readFileSync(serverConfig).toString())
    for(let i = 0; i < settings.length; i++) {
      if(settings[i].name === instanceName) {
        return settings[i]
      }
    }
  }
}

function getPathForServer(instanceName) {
  let serverConfig = getServer(instanceName)
  return serverConfig ? getServer(instanceName).path : undefined
}

function getPortForServer(instanceName) {
  let serverConfig = getServer(instanceName)
  return serverConfig ? getServer(instanceName).port : undefined
}

function getDownloadDirForServer(instanceName) {
  let serverConfig = getServer(instanceName)
  return serverConfig ? path.join(serverConfig.path, '..', config.download.dir) : undefined
}

function getRunModesForServer(instanceName) {
  let serverConfig = getServer(instanceName)
  return serverConfig ? getServer(instanceName).runmodes : undefined
}

async function installPackage(packageFile, port) {
  const packagePath = path.join('..', config.download.dir, packageFile)
  return spawnSync( 'node', ['"'+__dirname+'/../node_modules/@peregrinecms/slingpackager/bin/slingpackager"', 'upload','-i', '--server', `http://localhost:${port}`, packagePath] ,{
      shell: true,
      stdio: 'inherit'
  })
}

function getControlPortForServer(instanceName) {

  let server = getServer(instanceName)
  if (!server) {
    console.error(`No server named '${instanceName}' found`)
    return undefined
  }

  let controlFile = path.join(server.path, 'sling', 'conf', 'controlport')
  
  if (fs.existsSync(controlFile)) {
    try {
      // the control host and port is the first line
      return fs.readFileSync(controlFile, 'utf8').split(/\r?\n/)[0]
    } catch (err) {
      console.error(`Error reading control port file: ${controlFile}`, err);
      return undefined
    }
  } 
}

module.exports = {
    addServer,
    createInstallDir,
    getPortForServer,
    installPackage,
    isSlingRunning,
    listServers,
    serverExists,
    statusSling,
    startSling,
    stopSling,
    threadsSling,
}
