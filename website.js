	/**********************************************************************
	*  Author: Neha Kapoor (neha@jobshout.org)
	*  Project Lead: Balinder WALIA (bwalia@jobshout.org)
	*  Project Lead Web...: https://twitter.com/balinderwalia
	*  Name..: Jobshout Server NodeJS
	*  Desc..: Jobshout Server (part of Jobshout Suite of Apps)
	*  Web: http://jobshout.org
	*  License: http://jobshout.org/LICENSE.txt
	**/

	/**********************************************************************
	*  website.js handles the whole website
	**/
	
'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
 
// Init the express application
var app = require('./config/express')(init);

//db connection
var db;
init.MongoClient.connect(init.mongoConnUrl, function (err, database) {
	db=database;
  	if (err) {
  		console.log(init.system_name+': Unable to connect to '+ init.mongoConnUrl+'. Error : '+err+', port ' + init.port);  
  	
  		// Start the app by listening on <port>
		app.listen(init.port);
    } else {
  		db.collection('systems').findOne({_id: new init.mongodb.ObjectID(init.system_id)}, function(err, system_details) {
  			if(system_details){
   				if(system_details.port && system_details.port!=""){
   					init['port'] = system_details.port;
   				}
   				if(system_details.name && system_details.name!=""){
   					init['system_name'] = system_details.name;
   				}
   				if(system_details.website_url && system_details.website_url!=""){
   					init['websiteUrl'] = system_details.website_url;
   				}
   				if(system_details.email && system_details.email!=""){
   					init['recipientStr'] = system_details.email;
   				}
   			}  	
   			// Logging initialization
   			console.log(init.system_name+': Connection established to '+ init.mongoConnUrl+', started on port ' + init.port);  			
   			require('./controller/website_routes')(init, app, db);
   			
   			// Start the app by listening on <port>
			app.listen(init.port);
		});
  	}
});

app.locals.timeConverter = function(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = month + ' ' + date + ' ' + year + ', ' + hour + ':' + min ;
  return time;
}

app.locals.dynamicSort = function(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}