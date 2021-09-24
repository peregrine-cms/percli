const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const { peregrineBanner } = require('../lib/Banner')
const config = require('../config')

const NO_PROCESS_FOUND_PID = -1

function startSling() {

    if (!isSlingInstalled()) {
      console.error("Peregrine is not installed. Run 'percli server install'")
    } else if (!isSlingRunning()) {

      peregrineBanner()

      const args = []
      args.push(`-jar ${config.download.dir}/org.apache.sling.kickstart-0.0.12.jar`)
      args.push(`-c ${config.sling.dir}`) 
      args.push(`-s ${config.download.dir}/feature-oak_tar_fds.json`) 
//   args.push(`-D sling.runmodes=local`)
  
      const child = spawn('java', args, {
        detached: true,
        shell: true,
        stdio: 'inherit'
      })
      child.unref()
      savePid(child.pid)
    } else {
        console.error('Server is already running with pid:', getPid())
    }
}

function stopSling() {
    let pid = getPid()
    if (pid >= 0) {
      console.log(`Stopping server with pid '${pid}'`)
      // note: the '-' is needed to kill the process as a group
      process.kill(-pid)
      fs.unlinkSync(getPidFile())
    } else {
        console.error('No process id file found')
    }
}

function isSlingRunning() {
  return fs.existsSync(getPidFile())
}

function isSlingInstalled() {
  return fs.existsSync(config.sling.dir)
}

function getPid() {
  return fs.existsSync(getPidFile()) ? fs.readFileSync(getPidFile(), 'utf8') : NO_PROCESS_FOUND_PID
}

function getPidFile() {
  return path.join(config.sling.dir, config.sling.pid) 
}

function savePid(pid) {
  try {
    const pidFile = getPidFile() 
    fs.writeFileSync(pidFile, `${pid}`)
  } catch (err) {
    console.error(`Error creating pid file for process: '${pid}'`,err)
  }
}

async function waitForSlingReady(ms) {
    await new Promise(r => setTimeout(r, ms));
}

async function installPackage(packageFile) {
  return spawnSync( 'node', ['"'+__dirname+'/../node_modules/@peregrinecms/slingpackager/bin/slingpackager"', 'upload','-i', '--server', `http://localhost:${config.sling.port}`, `${config.download.dir}/${packageFile}`] ,{
      shell: true,
      stdio: 'inherit'
  })
}

module.exports = {
    installPackage,
    startSling,
    stopSling,
    isSlingRunning,
    getPid,
    waitForSlingReady
}