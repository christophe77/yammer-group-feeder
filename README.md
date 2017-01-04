# yammer-group-feeder
Auto post to yammer group from rss feed

Install :
npm install

Config :
- Register an app in Yammer : https://www.yammer.com/client_applications/ 
- Generate a developer token for the app.
- Get the internal group Id where you want the messages to posted.

Edit index.js config part like this :

    var yammerGroupId = your yammer group id
    var yammerDeveloperToken = your developer token
    var RssCheckIntervalInMn = rss links poll time in minutes
    var RssFeedsList = array of rss feeds

run :
node index.js

DONE :
- Parse RSS Feeds
- Post to yammer group
- Add RSS check interval
- Add daily flat database to store the posted links
- Add item.pubDate verification

TODO :
- Organize the code!