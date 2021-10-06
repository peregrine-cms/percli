# percli - cli tool for peregrine cms

### about peregrine-cms

peregrine-cms is an API first headless content management system with a 
beautiful head built with VueJS

For more information about this project go to https://www.peregrine-cms.com/

### about percli

`percli` is a command line tool to accomplish general tasks that arise when 
working

### prerequisits

the following tools need to be installed and accessible for percli to be able to work

- Java 11
- NodeJS 14.16.0 (LTS)

### install percli
```
npm install @peregrine-cms/percli -g
```

### install peregrine-cms
```
percli server install
```

### start an already installed peregrine-cms instance

```
percli server start
```

### stop a running peregrine-cms instance

```
percli server stop
```

### check if a peregrine-cms instance is running

```
percli server status
```

### list installed instances

```
percli server list
```

### running multiple instances

multiple peregrine instances can be installed, started and stopped using the `--name` and `--port` parameters. 

**note:** by default, an instance named `sling` will run on port `8080`.

to install an instance called `myinstance`, run:

```
percli server install --name myinstance --port 8081
```

to stop, start and check status of the instance, run:

```
percli server stop --name myinstance
percli server start --name myinstance
percli server status --name myinstance
```

### advanced install

you can define additional run modes during the server install. for example, if you want a classic author/publish
deployment, run:

```
percli server install --name author --port 8081 --runmodes author,notshared
percli server install --name publish --port 8082 --runmodes publish,notshared
```

the runmodes are saved in the server configuration file (`~/.perclirc`) and do not need to be specified after the initial install.

```
percli server start --name author 
percli server start --name publish
```
