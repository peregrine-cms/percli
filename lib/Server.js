const { spawn, spawnSync } = require('child_process')

const config = require('../config')

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
    waitForSlingReady
}