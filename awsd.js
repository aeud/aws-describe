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

function processInstance(instances) {
    instances.forEach((instance, _i) => {
        console.log([
            _i,
            colors.underline(instance.Tags.map(tag => tag.Key == 'Name' ? tag.Value : null).filter(name => name != null ).join()),
            colors.red(instance.InstanceId),
            instance.State.Name,
            (instance.PublicIpAddress ? colors.yellow(instance.PublicIpAddress) : null),
            instance.KeyName,
        ].join(' '))
        instancesExec[_i] = 'ssh -i /Users/adrien/.ssh/ae.pem ubuntu@' + instance.PublicIpAddress
    })
    if (process.argv[2]) {
        var a = parseInt(process.argv[2])
        if (a in instancesExec)
            exec('osascript -e \'tell app "iTerm"\n tell the first terminal\n tell current session\n write text "' + instancesExec[process.argv[2]] + '"\n end tell\n end tell\n end tell\'')
    } else {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        var ask = () => {
            rl.question('Server to access?', answer => {
                answer.split(',').forEach(a => {
                    var a = parseInt(a)
                    if (a in instancesExec)
                        exec('osascript -e \'tell app "iTerm"\n tell the first terminal\n tell (launch session "Default session")\n write text "' + instancesExec[a] + '"\n end tell\n end tell\n end tell\'')
                })
                ask()
            })
        }
        ask()
    }
}

ec2.describeInstances({}, (err, data) => {
    var instances = data.Reservations.map(reservation => reservation.Instances).reduce((a, b) => a.concat(b), [])
    processInstance(instances)
})