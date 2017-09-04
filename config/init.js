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
	*  init.js
	**/
	
	var mongodbRe = require('mongodb')
	var MongoClient = mongodbRe.MongoClient;
	
	// Connection URL. This is where your mongodb server is running.
	var url = 'mongodb://localhost:27017/jobshout_live';
	
	module.exports = {
    	mongodb : mongodbRe,
    	MongoClient : MongoClient,
    	mongoConnUrl : url,
    	port : 3012, //default port
    	recipientStr : 'bwalia@tenthmatrix.co.uk',
    	system_name : "Dipna Anand",
    	websiteUrl : 'http://www.dipna.com',
        system_id : "599ed020ebc2325c4dd5d427"
	};