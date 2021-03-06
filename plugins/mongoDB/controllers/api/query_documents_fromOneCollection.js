
module.exports = function(pb) {
    
    //pb depdencies
    var util = pb.util;
    
    function queryDocFrom1Collec() {};
    util.inherits(queryDocFrom1Collec, pb.BaseController);

    var hostAndPort = pb.config.db.servers[0];

    queryDocFrom1Collec.prototype.render = function(cb){
    	  var self = this;
        this.getJSONPostParams(function(err, post) {
        var dbname = post.dbname;
        var collecname = post.collecname;
        var queryBox = post.queryBox;
        try{
          queryBox = JSON.parse(queryBox);
        }catch(e){
          cb({content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, 'Invalid Query')});
          return;
        }
        var skip = post.skip;
        var limit = post.limit;

        // queryBox = {"item":/goudoubi/,"qty":/1/}
        var MongoClient = require('mongodb').MongoClient;
        var assert = require('assert');
        // // var test = "111:222";
        // // cb({content: pb.BaseController.apiResponse(queryBox)});
        // // queryBox = queryBox.replace(/\"([^(\")"]+)\":/g,"$1:");
        // queryBox = queryBox.substring(1,queryBox.length - 1);
        // // for(var i = 0; i < queryBox.length; i++){

        // // }
        // // console.log(queryBox);
        // // console.log(skip);
        // var test = '{"name": 2}';
        // //test = JSON.stringify(test);
        // // test = JSON.parse(test);
        // var test2 = JSON.parse(test);
        // console.log(test2);

        MongoClient.connect(hostAndPort + dbname, function(err, db) {
           if(err) { return console.dir(err); }
           db.collection(collecname).find(queryBox, {skip:skip, limit:limit}).toArray(function(err, docs) {
              if(util.isError(err)){
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, 'Invalid Query',err)});
                return;
              }else{
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Query documents from one collection',docs)});
                db.close();
              }
              
           
            });//end find
           
           // db.close();
        });//end connect
      });//end postParams
	 };
    

    queryDocFrom1Collec.getRoutes = function(cb) {
      var routes = [
        {
          method: 'post',
          path: '/api/mongoDB/query_documents_fromOneCollection',
          auth_required: false,
          content_type: 'application/json'
        }
      ];
      cb(null, routes);
    };

    //exports
    return queryDocFrom1Collec;
};

