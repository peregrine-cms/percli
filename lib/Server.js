const { spawn, spawnSync } = require('child_process')

const config = require('../config')

function startSling() {
    const args = []
    args.push(`-jar ${config.download.dir}/org.apache.sling.feature.launcher.jar`)
    args.push(`-D sling.runmodes=local`)
    args.push(`-f ${config.download.dir}/com.peregrine-cms.sling.launchpad-12-SNAPSHOT-oak_tar_far.far`)
    args.push(`-p ${config.sling.dir}`) 
    args.push(`-c ${config.sling.dir}/launcher/cache`)
  
    const child = spawn('java', args, {
      detached: true,
      shell: true,
      stdio: 'inherit'
    })
    child.unref()
}

module.exports = {
    startSling
}