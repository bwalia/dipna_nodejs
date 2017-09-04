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
	*  website_routes.js handles the http requests
	**/
	
var initFunctions = require('../config/functions');	
var Grid = require('gridfs-stream');

module.exports = function(init, app, db){
	var mongodb=init.mongodb;
	var gfs = Grid(db, mongodb);
	
	var navigationCategoriesArr = new Array('footer-nav', 'top-navigation');
//collection_details
app.get('/collection_details', function(req, res) {
	var outputObj = new Object();
	
	if(req.query.code){
		db.collection('documents').findOne({Code: req.query.code, uuid_system : init.system_id}, function(err, document) {
			if(document){
				outputObj["aaData"]   = document;
			}else{
				outputObj["error"]   = "No such record found";
			}
			res.send(outputObj);
			
		});
	}else{
		outputObj["error"]   = "Pass the required parameter!";
		res.send(outputObj);
	}
}); 

//search results page
app.get('/search-results', function(req, res) {
	var myObj = new Object();
	var itemsPerPage = 10, pageNum=1;
	if(req.query.start){
		pageNum=parseInt(req.query.start);
	}
	if(req.query.limit){
		itemsPerPage=parseInt(req.query.limit);
	}
	if(pageNum==0){
		pageNum=1;
	}
	var type = req.query.type, tags = req.query.tags, data='', truncate = 250;
	var query='{ "status": { $in: [ 1, "1" ]}', fetchFieldsObj="{}";
	if(type=="blog" || type=="news"){
		query= '{ "Type" : "'+type+'", "status": { $in: [ 1, "1" ] } ';
	}
	
	if(tags!="" && tags!="undefined" && tags!==undefined) {
		var tagsArr = tags.split(","), tempTagsStr='';
		for(var i=0; i<tagsArr.length; i++){
			if(tempTagsStr!=""){
				tempTagsStr = ",'"+tagsArr[i]+"'";
			} else {
				tempTagsStr = "'"+tagsArr[i]+"'";
			}
		}
		query+= ', "tags": { $in: ['+tempTagsStr+'] } ';
	}
	if(req.query.s){
		var searchStr = req.query.s;
		var regex = new RegExp(searchStr, "i");
		query+=", '$text': { '$search': '"+req.query.s+"' } ";
		fetchFieldsObj='{"Document" : 1, "Code" : 1, "Body" : 1}';
	}
		
		query+=", $or: [ { 'uuid_system' : { $in: ['"+init.system_id+"'] } }, { 'shared_systems': { $in: ['"+init.system_id+"'] } } ] ";
		query+='}';
		
		eval('var obj='+query);
		eval('var fetchFieldsobj='+fetchFieldsObj);
		db.collection('documents').find(obj, fetchFieldsobj).sort({Published_timestamp : -1}).skip(pageNum-1).limit(itemsPerPage).toArray(function(err, document) {
			if (document) {
      			db.collection('documents').find(obj).count(function (e, count) {
      				myObj["total"]   = count;
      				myObj["aaData"]   = document;
					res.send(myObj);
     			});
			}else{
      			myObj["total"]   = 0;
      			myObj["error"]   = 'not found';
				res.send(myObj);
			}
      	});
});

//404 page
	app.get('/not_found', returnNavigation, function(req, res) {
		res.render('not_found', {
      	 	navigation : req.navigation  
       	});
	});

//save contact
app.post('/savecontact', (req, res) => {
	var responseObj = new Object();
	var postJson=req.body;
	postJson.created=initFunctions.nowTimestamp();
	postJson.uuid_system=init.system_id;
    db.collection("website_enquiries").save(postJson, (err, result) => {
		if (err){
    		responseObj['error']="Sorry, some problem occurred while submitting your request!";
    		res.send(responseObj);
    	}else{ 
    		responseObj['success']="Thanks, your request has been sent successfully!";
    		var	subjectStr = init.system_name+" has new enquiry";
    		if(req.body.subject){
    			var subjectStr=req.body.subject
    		}
    		var insertEmail=new Object();
			insertEmail["uuid_system"]=init.system_id;
			insertEmail["sender_name"]=req.body.name;
			insertEmail["sender_email"]=req.body.email;
			insertEmail["subject"]=subjectStr;
			insertEmail["body"]=req.body.message;
			insertEmail["created"]=initFunctions.nowTimestamp();
			insertEmail["modified"]=initFunctions.nowTimestamp();
			insertEmail["recipient"]=init.recipientStr;
			insertEmail["status"]=0;
			db.collection("email_queue").save(insertEmail, (err, e_result) => {
				res.send(responseObj);
			})
    	} 	
  	});	
})

//save blog comment
app.post('/saveblogcomment', (req, res) => {
	var postJson=req.body;
	postJson.created=init.nowTimestamp;
	postJson.modified=init.nowTimestamp;
	postJson.status=0;
	postJson.uuid=initFunctions.guid();
	var blogID= req.body.blog_uuid;
	if(blogID!=""){
		var mongoIDField= new mongodb.ObjectID(blogID);
		var table_nameStr="documents";
		initFunctions.returnFindOneByMongoID(db, table_nameStr, blogID, function(resultObject) {
			var myObj = new Object();
			if(resultObject.aaData){
				var documentData=resultObject.aaData;
				var insertEmail=new Object();
    			var nameStr=req.body.name;
    			postJson.uuid_system=init.system_id;
    			insertEmail["uuid_system"]=init.system_id;
				insertEmail["sender_name"]=nameStr;
				insertEmail["sender_email"]=req.body.email;
				insertEmail["subject"]=nameStr+" has posted a comment";;
				insertEmail["body"]=req.body.comment;
				insertEmail["created"]=initFunctions.nowTimestamp();
				insertEmail["modified"]=initFunctions.nowTimestamp();
				insertEmail["recipient"]=init.recipientStr;
				insertEmail["status"]=0;
				if(typeof(documentData.BlogComments)=="string"){
	            	db.collection(table_nameStr).update({_id:mongoIDField}, { $set: { "BlogComments": new Array(postJson) } }, (err, result) => {
    	                if(result){
                    	    db.collection("email_queue").save(insertEmail, (err, e_result) => {
                        		myObj["success"]   = "Thanks your comment has been posted OK and will be visible soon!";
                                res.send(myObj);
                            });
                        }else{
                        	myObj["error"]   = "Error posting comment. Please try again later!!!";
                            res.send(myObj);
                        }
                    });
        		} else {
					db.collection(table_nameStr).update({_id:mongoIDField}, { $push: { "BlogComments": postJson } }, (err, result) => {
                    	if(result){
                        	db.collection("email_queue").save(insertEmail, (err, e_result) => {
                            	myObj["success"]   = "Thanks your comment has been posted OK and will be visible soon!";
                                res.send(myObj);
                            })
                        }else{
                            myObj["error"]   = "Error posting comment. Please try again later!!!";
                            res.send(myObj);
                        }
                    });
                }
			}else{
				myObj["error"]   = "Error posting comment. Please try again later!!!";
				res.send(myObj);
			}	
  		});	
  	}
})

// fetch blog archives
app.get('/fetch_videos', function(req, res) {
	var myObj = new Object();
	db.collection('categories').find({status: { $in: [ 1, "1" ] }, $or: [ { uuid_system : { $in: [init.system_id] } }, { shared_systems: { $in: [init.system_id] } } ] }, {name :1, order_by_num : 1}).sort({order_by_num : -1}).toArray(function(avaErr, documents) {
		if(documents && documents.length>0){
			myObj["categories"]   = documents;
			var categoriesArr= new Array();
			for(var i=0; i<documents.length; i++){
      			categoriesArr.push(documents[i]._id.toString());
      		}		
      		db.collection('videos').find({status: { $in: [ 1, "1" ] }, categories: { $in: categoriesArr } }).sort({order_by_num : -1}).toArray(function(videos_err, videos_content) {
				if(videos_content){
					myObj["aaData"]   = videos_content;
					res.send(myObj);
				} else {
					myObj["error"]   = "Sorry, no videos found!";
					res.send(myObj);
				}
			});
		} else {
			myObj["error"]   = "Sorry, no videos found!";
			res.send(myObj);
		}
   	});
});
// fetch blog archives
app.get('/fetch_blog_archives', function(req, res) {
	var myObj = new Object();
	db.collection('documents').find({ Type:"blog" ,status: { $in: [ 1, "1" ] }, $or: [ { uuid_system : { $in: [init.system_id] } }, { shared_systems: { $in: [init.system_id] } } ] }, {Published_timestamp : 1}).sort({Published_timestamp : -1}).toArray(function(avaErr, documents) {
		if(documents && documents.length>0){
			var loopMonthStr='', loopYearStr='', countNum = 0, responseArr= new Array();
			for (var i=0; i < documents.length; i++) {
				var publishedTimeStamp= documents[i].Published_timestamp;
				var tempMonthStr = initFunctions.dateParameters(publishedTimeStamp, 'month'), tempYearStr = initFunctions.dateParameters(publishedTimeStamp, 'year');
				
				if(tempMonthStr !== loopMonthStr || tempYearStr !== loopYearStr){
					var tempObj = {};
					var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		
					tempObj['monthNum'] = tempMonthStr; tempObj['year'] = tempYearStr; tempObj['monthStr'] = months[tempMonthStr];
					responseArr[countNum] = tempObj;
					loopMonthStr = tempMonthStr;
					loopYearStr = tempYearStr;
					countNum++;
				}
				if(countNum>=10){
					break;
				}
			}
			myObj["aaData"]   = responseArr;
			res.send(myObj);		
		} else {
			res.send(myObj);
		}
   	});
});
// fetch_tokens_content : to fetch tokens content
app.get('/fetch_tokens_content', function(req, res) {
	var myObj = new Object();
	if(req.query.code && req.query.code!=""){
		var obj = req.query.code;
		obj = obj.replace(/'/g, '"');
		obj = JSON.parse(obj);
		db.collection('tokens').find({ 'code': { $in: obj }, status: { $in: [ 1, "1" ] } }, {'code' : 1,'token_content' : 1}).toArray(function(avaErr, documents) {
			myObj["aaData"]   = documents;
      		res.send(myObj);
   		});
    }	else{
    	myObj["error"]   = 'Please pass the parameter!';
      	res.send(myObj);
    }
});

//api_fetch_navigation
app.get('/api_fetch_navigation', returnNavigation, function(req, res) {
	res.send(req.navigation);
});

//index page
app.get('/', function(req, res) {
	initFunctions.searchForTemplate(db, 'index', res, navigationCategoriesArr);
});

//fetch uploaded file content
app.get('/file/:filename', function(req, res){
        /** First check if file exists */
        gfs.files.find({'metadata.uuid': req.params.filename}).toArray(function(err, files){
            if(!files || files.length === 0){
                return res.status(404).json({
                    responseCode: 1,
                    responseMessage: "error"
                });
            }

            /** create read stream */
            var readstream = gfs.createReadStream({
            	filename: files[0].filename
            });

            /** set the proper content type */
            res.set('Content-Type', files[0].contentType)                                                                                                                      

            /** return response */
            return readstream.pipe(res);
        });
});

//display video details
app.get('/video-:id', function(req, res) {
	db.collection('videos').findOne({code: req.params.id, uuid_system : init.system_id}, function(video_err, video_content) {
		if(video_content){
	 		initFunctions.returnBookmarks(db, navigationCategoriesArr, new Array(), true, function(resultNav) {
				res.render('video', {
       				document_details: video_content,
       				navigation : resultNav 
    			});
    		});
	 	}else{
      		res.redirect('/not_found');
   		}
	});
});

//content page or template
app.get('/:id', function(req, res) {
	db.collection('documents').findOne({Code: req.params.id, uuid_system : init.system_id}, function(err, document) {
		if (document) {
			initFunctions.returnBookmarks(db, navigationCategoriesArr, new Array(), true, function(resultNav) {
				res.render('content', {
       				document_details: document,
       				navigation : resultNav 
    			});
    		});
    	} else {
    		db.collection('documents').findOne({Code: req.params.id, shared_systems : { $in: [init.system_id] }}, function(err, document) {
				if (document) {
					initFunctions.returnBookmarks(db, navigationCategoriesArr, new Array(), true, function(resultNav) {
						res.render('content', {
       						document_details: document,
       						navigation : resultNav 
       					});
    				});
    			} else {
       				initFunctions.searchForTemplate(db, req.params.id, res, navigationCategoriesArr);
    			}
    		});
    	}
    });
});

function returnNavigation (req, res, next) {
	initFunctions.returnBookmarks(db, navigationCategoriesArr, new Array(), true, function(resultNav) {
		req.navigation=resultNav;
		next();
   	});
}

}