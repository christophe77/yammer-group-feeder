// Config
var yammerGroupId = "yourYammerGroupId";
var yammerOauth2Token = "yourOauthToken";
var RssCheckIntervalInMn = 5;
var RssFeedsList = [
	'http://www.alsacreations.com/rss/apprendre.xml',
	'http://web.developpez.com/index/rss'
];
// flat-file-db
var flatfile = require('flat-file-db');

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

// 1 db per day

var j = schedule.scheduleJob(rule, function(){	
	// Daily database
	var db = flatfile(dayDB());
	
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
				// check if the link has already been posted
				if(db.has(item.link) === false) {
					// Add link to database
					db.on('open', function() {
						db.put('itemLink', item.link);  // store some data
					});
					// send message to yammer
					
				}
			}		
		});
	}
});

function dayDB(){
	var path = require('path');
	var appDir = path.dirname(require.main.filename);
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
		dd='0'+dd
	} 

	if(mm<10) {
		mm='0'+mm
	} 
	
	today = appDir+'\\db\\'+mm+'-'+dd+'-'+yyyy+'.db';
	console.log(today);
	return(today);
}


	  




