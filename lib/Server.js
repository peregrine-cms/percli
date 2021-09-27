const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const { peregrineBanner } = require('../lib/Banner')
const config = require('../config')

const NO_PROCESS_FOUND_PID = -1

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

      let port = getPortForServer(instanceName)

      const args = []
      args.push(`-jar ${config.download.dir}/org.apache.sling.kickstart-0.0.12.jar`)
      args.push(`-c ${instanceName}`) 
      args.push(`-p ${port}`) 
      args.push(`-s ${config.download.dir}/feature-oak_tar_fds.json`) 
//   args.push(`-D sling.runmodes=local`)
  
      const child = spawn('java', args, {
        detached: true,
        shell: true,
        stdio: 'inherit'
      })
      child.unref()
      savePid(instanceName, child.pid)
    } else {
        console.error('Server is already running with pid:', getPid(instanceName))
    }
}

function stopSling(instanceName) {
    let pid = getPid(instanceName)
    if (pid >= 0) {
      console.log(`Stopping server with pid '${pid}'`)
      // note: the '-' is needed to kill the process as a group
      process.kill(-pid)
      fs.unlinkSync(getPidFile(instanceName))
    } else {
        console.error('No process id file found')
    }
}

function isSlingRunning(instanceName) {
  return fs.existsSync(getPidFile(instanceName))
}

function isSlingInstalled(instanceName) {
  return fs.existsSync(instanceName)
}

function getPid(instanceName) {
  return fs.existsSync(getPidFile(instanceName)) ? fs.readFileSync(getPidFile(instanceName), 'utf8') : NO_PROCESS_FOUND_PID
}

/**
 * @param {*} instanceName 
 * @returns The absolute PID file path
 */
function getPidFile(instanceName) {
  let pathPrefix = getPathForServer(instanceName);
  return pathPrefix ? path.join(pathPrefix, instanceName, config.sling.pid) : undefined
}

function savePid(instanceName, pid) {
  try {
    const pidFile = getPidFile(instanceName) 
    fs.writeFileSync(pidFile, `${pid}`)
  } catch (err) {
    console.error(`Error creating pid file for process: '${pid}'`,err)
  }
}

function listServers() {
  const serverConfig = config.server.settings

  if (fs.existsSync(serverConfig)) {
      const settings = JSON.parse(fs.readFileSync(serverConfig).toString())
      console.log('instance'.padEnd(12), 'running'.padEnd(8), 'port'.padEnd(6), 'path')
      settings.forEach( (server) => {
          console.log(server.name.padEnd(12), isSlingRunning(server.name).toString().padEnd(8), server.port.toString().padEnd(6), server.path)
      })
  } else {
      console.error('no server configuration file found at', serverConfig)
  }
}

function addServer(instanceName, port, path) {
  const serverConfig = config.server.settings

  let settings = []
  if(fs.existsSync(serverConfig)) {
      settings = JSON.parse(fs.readFileSync(serverConfig).toString())
  }
  settings.push( {name: instanceName, path: path, port: port})
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

async function waitForSlingReady(ms) {
    await new Promise(r => setTimeout(r, ms));
}

async function installPackage(packageFile, port) {
  return spawnSync( 'node', ['"'+__dirname+'/../node_modules/@peregrinecms/slingpackager/bin/slingpackager"', 'upload','-i', '--server', `http://localhost:${port}`, `${config.download.dir}/${packageFile}`] ,{
      shell: true,
      stdio: 'inherit'
  })
}

module.exports = {
    addServer,
    createInstallDir,
    getPid,
    installPackage,
    isSlingRunning,
    listServers,
    serverExists,
    startSling,
    stopSling,
    waitForSlingReady
}