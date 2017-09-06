function timeConverter(UNIX_timestamp, dateformat){
	var a = new Date(UNIX_timestamp * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	if(dateformat=="date"){
  		return  date;
  	} else if(dateformat=="month"){
  		return  month;
  	} else {
  		return  date+' '+month+' '+year;
  	}
}
	
function fetch_token_content(val)	{
	var jsonRow="/fetch_tokens_content?code="+val;
	$.getJSON(jsonRow,function(html){
		if(html.aaData){
			$.each(html.aaData, function(i,row){
				if(row.code=="contact_footer"){
					$("#contact_footer").html(row.token_content);
				} else if (row.code=="book-description"){
					$("#book-description").html(row.token_content);
				}	else if(row.code=="sidebar-recipes"){
					$("#sidebar_recipes").html(row.token_content);
				}
			});
		}
	});
}
$(document).ready(function() {
	fetch_token_content("['contact_footer']");
	
	$.getJSON("/search-results?start=0&s=&type=blog&limit=5",function(html){
			if(html.error){
				$("#latestfooterblogs").before('<div class="alert">No blogs found!</div>');
			}else{
				var contentHtml='';
				$.each(html.aaData, function(i,row){
					if(row.Code!=""){
						contentHtml+='<li><a href="/'+row.Code+'" title="'+row.Document+'">'+row.Document+'</a></li>';
					}
				});
				$("#latestfooterblogs").html(contentHtml);
			}
	});
	$.getJSON("/search-results?start=0&s=&tags=recipes&limit=2",function(html){
			if(html.error){
				$("#sidebar_recipes").hide();
			}else{
				var contentHtml='<div><h1><img src="images/receipe_heading.png" alt="Receipe" class="img-responsive"></h1></div>';
				$.each(html.aaData, function(i,row){
					if(row.Code!=""){
						var bodyStr=$(row.Body).text();
						contentHtml+='<div class="receipebx"><div class="row "><div class="col-sm-9 col-xs-8 col-lg-12 col-md-7" style="margin-right:0px; padding-right:0px;"><h4><a href="/'+row.Code+'" title="'+row.Document+'">'+row.Document+'</a></h4><p>'+bodyStr.substr(0,75)+'...</p></div></div></div>';
                	}
				});
				$("#sidebar_recipes").html(contentHtml);
				$("#sidebar_recipes").show();
			}
	});
	$.getJSON("/fetch_blog_archives",function(response){
		if(response && response.aaData && response.aaData.length>0){
			var contentHtml='';
			$.each(response.aaData, function(i,row){
				contentHtml+='<li><a href="/blog?month='+row.monthNum+'&year='+row.year+'" title="'+row.monthStr+' '+row.year+'">'+row.monthStr+' '+row.year+'</a></li>';
			});
			$("#blog_archives_id").html(contentHtml);
		}
	});
});

function getUrlVars(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function dynamicSort(property) {
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