// Config
var yammerGroupId = "10215902";
var yammerOauth2Token = "4006-Ki5YBLdI8owX2XFHppo0A";
var RssCheckIntervalInMn = 1;
var RssFeedsList = [
	'http://www.alsacreations.com/rss/apprendre.xml',
	'http://web.developpez.com/index/rss'
];

//Fix the maxlisteners bug
require('events').EventEmitter.defaultMaxListeners = Infinity;

// flat-file-db
var flatfile = require('flat-file-db');
// we create a daily database
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
	// Daily database
	var db = flatfile.sync(dayDB());
	
	// Loop through RSS Feed links
    for (i = 0; i < RssFeedsList.length; i++) {
		// Parse feeds  
		var req = request(RssFeedsList[i]) 
		  , feedparser = new FeedParser();
		  
		
		req.on('error', function (error) {  
		  // handle any request errors 
			console.log("There was an error requesting the datas");
			console.log(error);
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
			db.on('open', function() {
				if(db.has(item.link) === false) {
					// Add link to database
					db.put('itemLink', item.link);  // store some data
					// send message to yammer  
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
								//console.log(data);
							}
					})
				}
			});
			db.close();
		  }
		});
	}
});


	  




