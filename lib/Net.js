var net = require('net');

async function isPortInUse(port) {
  return await new Promise((resolve, reject) => {
    portInUse(port, (result, err) => {
      if(err) {
        reject(err)
      } else {
        resolve(result)
      }  
    })
  })
}

function portInUse(port, callback) {
  var server = net.createServer(function(socket) {
  })

  server.on('error', function (e) {
    callback(true);
  })
  server.on('listening', function (e) {
    server.close();
    callback(false);
  })

  server.listen(port, '127.0.0.1');
};

module.exports = {
  isPortInUse
}