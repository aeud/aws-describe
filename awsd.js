#! /usr/local/bin/node

var fs       = require('fs')
var readline = require('readline')
var AWS      = require('aws-sdk')
var colors   = require('colors')
var cp       = require('copy-paste')
var exec     = require('child_process').execSync

var command = fs.readFileSync(__dirname + '/command', 'utf-8')

var ec2 = new AWS.EC2({region: 'us-east-1'})

var instancesExec = []

var responsePath = __dirname + '/response.json'

function processInstance(instances) {
    instances.map(instance => {
        instance.name = instance.Tags.map(tag => tag.Key == 'Name' ? tag.Value : null).filter(name => name != null ).join()
        return instance
    }).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1).forEach((instance, _i) => {
        console.log([
            _i,
            colors.underline(instance.name),
            colors.red(instance.InstanceId),
            instance.State.Name,
            (instance.PublicIpAddress ? colors.yellow(instance.PublicIpAddress) : null),
            instance.KeyName,
        ].join(' '))
        instancesExec[_i] = command + instance.PublicIpAddress
    })
    if (process.argv[2] && process.argv[2] != -1) {
        var a = parseInt(process.argv[2])
        if (a in instancesExec)
            exec('osascript -e \'tell app "iTerm"\ntell current window\ntell current tab\ntell current session\nwrite text "' + instancesExec[process.argv[2]] + '"\nend tell\nend tell\nend tell\nend tell\'')
    } else {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        var ask = () => {
            rl.question('Server to access?\t', answer => {
                answer.split(',').forEach(a => {
                    var a = parseInt(a)
                    if (a in instancesExec)
                        exec('osascript -e \'tell app "iTerm"\ntell current window\ntell current tab\ntell current session\nwrite text "' + instancesExec[a] + '"\nend tell\nend tell\nend tell\nend tell\'')
                })
                rl.close()
                //ask()
            })
        }
        ask()
    }
}

var run = () => {
    var response = fs.existsSync(responsePath) ? JSON.parse(fs.readFileSync(responsePath, 'utf-8')) : null
    if (!response || new Date(response.updated_at).getTime() < new Date().getTime() - 24*60*60*1000 || process.argv[2] == -1) {
        console.log('Loading instances ...')
        ec2.describeInstances({}, (err, data) => {
            var instances = data.Reservations.map(reservation => reservation.Instances).reduce((a, b) => a.concat(b), [])
            response = { updated_at: new Date().toISOString(), instances: instances }
            fs.writeFileSync(responsePath, JSON.stringify(response))
            processInstance(response.instances)
        })
    } else processInstance(response.instances)
}
run()