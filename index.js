// Config
var yammerGroupId = "";
var yammerOauth2Token = "";

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
	  // always handle errors 
	});
	feedparser.on('readable', function() {  
	  // This is where the action is! 
	  var stream = this
		, meta = this.meta // **NOTE** the “meta” is always available in the context of the feedparser instance 
		, item;

	  while (item = stream.read()) {
		var message = item.title + ' | ' + item.link;
		client.messages.create({
				group_id: yammerGroupId, 
				body: message
			}, 
		function(error, data) {
			if(error)
				console.log("There was an error retrieving the data");
			else {
				console.log("** Data was retrieved **");
				console.log(data);
			}
		})
	  }
	});
	
	
}

