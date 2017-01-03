// Config
var yammerGroupId = "10215902";
var yammerOauth2Token = "4006-Ki5YBLdI8owX2XFHppo0A";
var RssCheckIntervalInMn = 5;
var RssFeedsList = [
	'http://www.alsacreations.com/rss/apprendre.xml',
	'http://web.developpez.com/index/rss'
];

// Yammer client
var YammerAPIClient = require('yammer-rest-api-client'),
    client = new YammerAPIClient({ token: yammerOauth2Token }); 
	
// Feed parser
var FeedParser = require('feedparser')  
	  , request = require('request');

// Scheduler
var schedule = require('node-schedule');
 
 
// Start the auto post scheduler
var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, RssCheckIntervalInMn);
 
var j = schedule.scheduleJob(rule, function(){	
	// Loop through RSS Feed links
    for (i = 0; i < RssFeedsList.length; i++) {
		// Parse feeds  
		var req = request(RssFeedsList[i])  
		  , feedparser = new FeedParser();

		req.on('error', function (error) {  
		  // handle any request errors 
		});
		req.on('response', function (res) {  
		  var stream = this;

		  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

		  stream.pipe(feedparser);
		});

		feedparser.on('error', function(error) {  
			console.log("There was an error parsing the data");
			console.log(error);
		});
		feedparser.on('readable', function() {  
		  var stream = this
			, meta = this.meta // **NOTE** the “meta” is always available in the context of the feedparser instance 
			, item;

		  while (item = stream.read()) {
			  
			var message = item.title + ' | ' + item.link;
			
			// send message to yammer
			client.messages.create({
					group_id: yammerGroupId, 
					body: message
				}, 
			function(error, data) {
				if(error) {
					console.log("There was an error posting the data");
					console.log(error);
				}
					
				else {
					console.log("Data posted");
					console.log(data);
				}
			})
			
		  }
		});
	}
});


	  




