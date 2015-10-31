#! /usr/local/bin/node

var AWS      = require('aws-sdk')
var colors   = require('colors')
var readline = require('readline')
var cp       = require('copy-paste')

var ec2 = new AWS.EC2({region: 'us-east-1'})

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

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
    rl.question('Server to access?', answer => {
        cp.copy(instancesExec[answer])
        console.log(instancesExec[answer])
        rl.close()
    })
}

ec2.describeInstances({}, (err, data) => {
    var instances = data.Reservations.map(reservation => reservation.Instances).reduce((a, b) => a.concat(b), [])
    processInstance(instances)
})