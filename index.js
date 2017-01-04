// Config
var yammerGroupId = "10215902";
var yammerOauth2Token = "4006-Ki5YBLdI8owX2XFHppo0A";
var RssCheckIntervalInMn = 1;
var RssFeedsList = [
	'http://feeds2.feedburner.com/kgaut',
	'http://www.magazineduwebdesign.com/feed.xml'
];

//Fix the maxlisteners bug
require('events').EventEmitter.defaultMaxListeners = Infinity;

// FS
var fs = require('fs');	

// Usefull functions
function getTodayDbName(){ 
	var date = new Date();
	var pieces = date.toString().split(' '),
		parts = [
			pieces[0],
			pieces[2],
			pieces[1],
			pieces[3] + '.db',
		];
  return parts.join('-');
}
function getTodayDbPath(){
	var path = require('path');
	var appDir = path.dirname(require.main.filename);
	var dbFullPath = appDir+'\\db\\'+ getTodayDbName();
	if(!fs.existsSync(dbFullPath)){
		fs.writeFile(dbFullPath, getTodayDbName() + '\n', function (err) {
			if (err) throw err;
		});
	}
	return(dbFullPath);
}
function getDbNameFromPubDate(pubDate){ 
	var pieces = pubDate.toString().split(' '),
		parts = [
			pieces[0].replace(",", ""),
			pieces[2],
			pieces[1],
			pieces[3] + '.db',
		];
  return parts.join('-');
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
	
	// Loop through RSS Feed links
    for (i = 0; i < RssFeedsList.length; i++) {
		// Parse feeds  
		var req = request(RssFeedsList[i]) 
		  , feedparser = new FeedParser();
		  		
		req.on('error', function (error) {  
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
			, meta = this.meta
			, item;

		  while (item = stream.read()) {
			// check if feed is valid			
			if(item.link && item.pubDate && item.title){
				var cLink = item.link;
				var cTitle = item.title;
				var cDate = item.pubDate;
				// if feed is new then we post it
				if(getDbNameFromPubDate(cDate) === getTodayDbName()){
					var content = fs.readFileSync(getTodayDbPath(),'utf8')
					if(content.indexOf(cLink) < 0){
						// Insert into our flat db
						fs.appendFile(getTodayDbPath(), cLink + '\n', function (err) {
							if (err) throw err;
						});
						// Send to yammer
						var message = cTitle + '\r\n' + cLink;
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
				}
			}
		  }		  
		});
	}
});


	  




