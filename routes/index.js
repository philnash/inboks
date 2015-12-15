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
  return messages;
}

function numToSha(number){
  var shasum = crypto.createHash('sha256');
  shasum.update(number);
  shasum = shasum.digest('hex');
  return shasum;
}

var date_sort_asc = function (date1, date2) {
  // This is a comparison function that will result in dates being sorted in
  // ASCENDING order. As you can see, JavaScript's native comparison operators
  // can be used to compare dates. This was news to me.
  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

/* GET home page. */
router.get('/', function(req, res, next) {
  twilio.messages.list({to: process.env.TWILIO_PHONE_NUMBER}).then(function(data){
    var incomingMessages = hideNumbers(data.messages);
    res.render('index', { title: 'Inboks', messages: incomingMessages });
  });
});

router.get('/:sha', function(req, res, next){
  var number = numberMappings[req.params.sha];
  var incomingMessages;
  twilio.messages.list({from: number, to: process.env.TWILIO_PHONE_NUMBER}).then(function(data){
    incomingMessages = hideNumbers(data.messages);
    return twilio.messages.list({from: process.env.TWILIO_PHONE_NUMBER, to: number});
  }).then(function(data){
    var outgoingMessages = data.messages;

    var allMessages = incomingMessages.concat(outgoingMessages);
    allMessages.sort(function(a, b){
      return date_sort_asc(Date.parse(a.dateCreated), Date.parse(b.dateCreated));
    });
    allMessages = allMessages.map(function(message){
      message.reply = message.from !== process.env.TWILIO_PHONE_NUMBER;
      return message;
    });

    res.render('conversation', {
      title: 'Inboks',
      messages: allMessages,
      sha: data.messages[0].from
    });
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
