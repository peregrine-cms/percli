const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const { peregrineBanner } = require('../lib/Banner')
const config = require('../config')

const NO_PROCESS_FOUND_PID = -1
const CMD_STOP = 'stop'
const CMD_STATUS = 'status'

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
      let runmodes = getRunModesForServer(instanceName)

      process.chdir(getPathForServer(instanceName))

      const args = []
      args.push(`-jar ${config.download.dir}/org.apache.sling.kickstart-0.0.12.jar`)
      args.push(`-c ${instanceName}`) 
      args.push(`-p ${port}`) 
      if (runmodes) {
        args.push(`-D sling.runmodes=${runmodes}`)
      }
      args.push(`-s ${config.download.dir}/feature-oak_tar_fds.json`) 
  
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
  execKickstarterCmd(instanceName, CMD_STOP)
}

function statusSling(instanceName) {
  execKickstarterCmd(instanceName, CMD_STATUS)
}

function execKickstarterCmd(instanceName, cmd) {
  const controlPort = getControlPortForServer(instanceName)
  const instancePath = path.join(getPathForServer(instanceName), instanceName)
  process.chdir(instancePath)

  const args = []
  args.push(`-jar ../${config.download.dir}/org.apache.sling.kickstart-0.0.12.jar`)
  args.push(`-j ${controlPort}`)
  args.push(cmd) 

  if (cmd.includes(CMD_STOP) && fs.existsSync(getPidFile(instanceName))) {
    fs.unlinkSync(getPidFile(instanceName))
  }

  const child = spawn('java', args, {
    detached: true,
    shell: true,
    stdio: 'inherit'
  })
}

function stopSlingByPid(instanceName) {

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
  let pathPrefix = getPathForServer(instanceName)
  if (pathPrefix) {
    let pathAbs = path.join(pathPrefix, instanceName)
    return fs.existsSync(pathAbs)
  }
  return false
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

function getRunModesForServer(instanceName) {
  let serverConfig = getServer(instanceName)
  return serverConfig ? getServer(instanceName).runmodes : undefined
}

async function installPackage(packageFile, port) {
  return spawnSync( 'node', ['"'+__dirname+'/../node_modules/@peregrinecms/slingpackager/bin/slingpackager"', 'upload','-i', '--server', `http://localhost:${port}`, `${config.download.dir}/${packageFile}`] ,{
      shell: true,
      stdio: 'inherit'
  })
}

function getControlPortForServer(instanceName) {

  let server = getServer(instanceName)
  if (!server) {
    console.error(`No server named '${instanceName}' found`)
    process.exit(-1)
  }

  let controlFile = path.join(server.path, server.name, 'conf', 'controlport')
  
  if (fs.existsSync(controlFile)) {
    try {
      // the control host and port is the first line
      return fs.readFileSync(controlFile, 'utf8').split(/\r?\n/)[0]
    } catch (err) {
      console.error(`Error reading control port file: ${controlFile}`, err);
      process.exit(-1)
    }
  } 
}

module.exports = {
    addServer,
    createInstallDir,
    getPid,
    installPackage,
    isSlingRunning,
    listServers,
    serverExists,
    statusSling,
    startSling,
    stopSling,
}
