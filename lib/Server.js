const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const config = require('../config')

const NO_PROCESS_FOUND_PID = -1

function startSling() {
    const args = []
    args.push(`-jar ${config.download.dir}/org.apache.sling.feature.launcher.jar`)
    args.push(`-D sling.runmodes=local`)
    args.push(`-f ${config.download.dir}/com.peregrine-cms.sling.launchpad-12-SNAPSHOT-oak_tar_far.far`)
    args.push(`-p ${config.sling.dir}`) 
    args.push(`-c ${config.sling.dir}/cache`) 
  
    const child = spawn('java', args, {
      detached: true,
      shell: true,
      stdio: 'inherit'
    })
    child.unref()
    savePid(child.pid)
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
    console.log('Going to sleep')
    await new Promise(r => setTimeout(r, ms));
    // todo implement me
    console.log('Waking up')
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
    waitForSlingReady
}