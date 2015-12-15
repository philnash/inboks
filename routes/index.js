var express = require('express');
var router = express.Router();
var twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
var crypto = require('crypto');

var numberMappings = {};

function hideNumbers(messages) {
  for (var i = messages.length - 1; i >= 0; i--) {
    var message = messages[i];
    var shasum = numToSha(message.from);
    numberMappings[shasum] = message.from;
    message.from = shasum;
  };
}

function numToSha(number){
  var shasum = crypto.createHash('sha256');
  shasum.update(number);
  shasum = shasum.digest('hex');
  return shasum;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  twilio.messages.list({to: process.env.TWILIO_PHONE_NUMBER}).then(function(data){
    hideNumbers(data.messages);
    res.render('index', { title: 'Inboks', messages: data.messages });
  });
});

router.get('/:sha', function(req, res, next){
  var number = numberMappings[req.params.sha];
  twilio.messages.list({from: number, to: process.env.TWILIO_PHONE_NUMBER}).then(function(data){
    hideNumbers(data.messages);
    res.render('conversation', { title: 'Inboks', messages: data.messages, sha: data.messages[0].from });
  });
});

router.post('/:sha/messages', function(req, res, next) {
  var number = numberMappings[req.params.sha];
  twilio.messages.create({
    to: number,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: req.body.message
  }).then(function(response){
    res.redirect('/' + req.params.sha);
  }).catch(function(err){
    console.log(err);
    res.redirect('/');
  });
})

router.post('/messages', function(req, res, next){
  var twiml = "<Response><Message>Hi, thanks for joining my stream today!</Message></Response>";
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

module.exports = router;
