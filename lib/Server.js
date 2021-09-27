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

      const args = []
      args.push(`-jar ${config.download.dir}/org.apache.sling.kickstart-0.0.12.jar`)
      args.push(`-c ${instanceName}`) 
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

function getPidFile(instanceName) {
  return path.join(instanceName, config.sling.pid) 
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
      console.log()
      console.log('[INFO] list of all peregrine-cms servers on this computer')
      const settings = JSON.parse(fs.readFileSync(getSettings()).toString())
      console.log()
      settings.forEach( (server) => {
          console.log('-', server.name, server.path)
      })
  } else {
      console.error('[ERROR] no settings file found at', serverConfig)
  }
}

function addServer(instanceName) {
  // todo: check before adding sever
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
    createInstallDir,
    installPackage,
    listServers,
    startSling,
    stopSling,
    isSlingRunning,
    getPid,
    waitForSlingReady
}