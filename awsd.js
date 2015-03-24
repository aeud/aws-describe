var AWS = require('aws-sdk');
var colors = require('colors');
var ec2 = new AWS.EC2({region: 'us-east-1'});

ec2.describeInstances({}, function(err, data) {
    data.Reservations.map(function(reservation){
        //console.log(colors.green(reservation.ReservationId));
        reservation.Instances.map(function(instance){
            console.log([
                colors.underline(instance.Tags.map(function(tag){ return tag.Key == 'Name' ? tag.Value : null; }).filter(function(name){ return name != null; }).join()),
                colors.red(instance.InstanceId),
                instance.State.Name,
                (instance.PublicIpAddress ? colors.yellow(instance.PublicIpAddress) : null)
            ].join(' '));
        });
    });
});