// Config
var yammerGroupId = '11111111';
var yammerDeveloperToken = '1111-abC123';
var RssCheckIntervalInMn = 1;
var RssFeedsList = [
    'http://blog.soat.fr/feed/',
    'http://blog.eleven-labs.com/feed/',
    'http://feeds2.feedburner.com/kgaut',
    'http://wodric.com/feed/',
    'http://gkueny.fr/feed.xml',
    'http://javaetmoi.com/feed/',
    'http://www.tiger-222.fr/rss.php',
    'http://blog.nicolashachet.com/feed/'
];

// FS
var fs = require('fs');

// Usefull functions
function getTodayDbName() {
    var pieces = (new Date())
        .toISOString()
        .split('T'),
        parts = [
            pieces[0] + '.db'
        ];
    return parts;
}

function getTodayDbPath() {
    var path = require('path');
    var appDir = path.dirname(require.main.filename);
    var dbFullPath = appDir + '\\db\\' + getTodayDbName();
    if (!fs.existsSync(dbFullPath)) {
        fs.writeFile(dbFullPath, getTodayDbName() + '\n', function(error) {
            if (error){
				console.log('There was an error creating the database');
				console.log(error);	
			}
			else{
				console.log('New database created : ' + dbFullPath);
			}
        });
    }
    return dbFullPath;
}

function getDbNameFromPubDate(pubDate) {
        var pieces = pubDate
            .split('T'),
            parts = [
            pieces[0] + '.db'
        ];
        return parts;
}
// Yammer client
var YammerAPIClient = require('yammer-rest-api-client');
var client = new YammerAPIClient({
    token: yammerDeveloperToken
});
// Feed parser
var FeedParser = require('feedparser');
var request = require('request');
// Scheduler
var schedule = require('node-schedule');
// Start the auto post scheduler
var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, RssCheckIntervalInMn);
var j = schedule.scheduleJob(rule, function() {
    // Loop through RSS Feed links
    RssFeedsList.forEach(function(link) {
        // Parse feeds  
        var req = request(link, {
            timeout: 5000,
            pool: false
        });
        req.setMaxListeners(100);
        // Some feeds do not respond without user-agent and accept headers.
        req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
        req.setHeader('accept', 'text/html,application/xhtml+xml');
        var feedparser = new FeedParser();
        req.on('error', function(error) {
            console.log('There was an error requesting the datas');
            console.log(error);
        });
        req.on('response', function(res) {
            var stream = this;
            if (res.statusCode != 200)
                return this.emit('error', new Error('Bad status code'));
            stream.pipe(feedparser);
        });
        feedparser.on('error', function(error) {
            console.log('There was an error parsing the data');
            console.log(error);
        });
        feedparser.on('readable', function() {
            var stream = this,
                meta = this.meta,
                item;
            while (item = stream.read()) {
				// check if item infos are not null	
                if (item.link && item.pubdate && item.title) {
					// Format pubDate
					var pubDateIso = item.pubdate.toISOString();
                    // check if the news is from today
                    if (getDbNameFromPubDate(pubDateIso) == getTodayDbName()) {
                        // We open our daily db and check if the link is inside
                        var content = fs.readFileSync(getTodayDbPath(), 'utf8');
                        if (content.indexOf(item.link) < 0) {
                            // Link is not inside so we add it
                            fs.appendFile(getTodayDbPath(), item.link + '\n', function(error) {
                                if (error) {
                                    console.log('There was an error writing the data');
                                    console.log(error);
                                }
                            });
                            // We send the message to our yammer group
                            var message = item.title + '\r\n' + item.link;
                            client.messages.create({
                                group_id: yammerGroupId,
                                body: message
                            }, function(error, data) {
                                if (error) {
                                    console.log('There was an error posting the data');
                                    console.log(error);
                                } else {
                                    console.log('Data posted');
                                    // Optional
                                    //console.log(data);
                                }
                            });
                        }
                    }
                }
            }
        });
    });
});
