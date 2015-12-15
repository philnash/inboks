var express = require('express');
var router = express.Router();
var twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

/* GET home page. */
router.get('/', function(req, res, next) {
  twilio.messages.list({to: process.env.TWILIO_PHONE_NUMBER}).then(function(data){
    res.render('index', { title: 'Inboks', messages: data.messages });
  });
});

router.post('/messages', function(req, res, next){
  var twiml = "<Response><Message>Hi, thanks for joining my stream today!</Message></Response>";
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

module.exports = router;
