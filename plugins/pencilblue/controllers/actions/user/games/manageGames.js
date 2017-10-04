var async = require('async');
var path = require('path');
module.exports = function manageGamesModule(pb) {

	//pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Checks to see if the proposed username is available
     */
    function manageGames(){}
    util.inherits(manageGames, pb.BaseController);

    manageGames.prototype.render = function(cb) {
    	var self = this;
    	var dao = new pb.DAO();

    	this.getJSONPostParams(function(err, post) {
        	var game_data = {};
            if (post.saveScores){

                var normalized_score = 0;
                if (post.score >= 1001 && post.score <=2000) {
                    normalized_score = 0.5;
                }else if (post.score >= 2001 && post.score <=2500) {
                    normalized_score = 1;
                }else if (post.score >= 2501 && post.score <=3000) {
                    normalized_score = 1.5;
                }else if (post.score >= 3001) {
                    normalized_score = 1.5;
                }
                

                var options = {
                    user_id: post.userId
                };

                var updateDetails = {
                    $set: {
                        game_name: post.gameName,
                        score: post.score,
                        played_on: self.getDate(new Date(), 0),
                        isPlayed: true,
                        normalized_score: normalized_score
                    }
                };

                var updateOptions = {
                    multi: false
                };

                dao.updateFields('Game_Data', options, updateDetails, updateOptions, function(err, result1){});
                console.log("Game Score Saved Successfully.");
            }else {
                game_data.user_id = post.userId;
                game_data.date_saved = self.getDate(new Date(), 0);
                game_data.game_name = "";
                game_data.score = "";
                game_data.date_played_on = "";
                game_data.isPlayed = false;
                game_data.normalized_score = "";
                var collection = 'Game_Data';
                var newRecord = pb.DocumentCreator.create(collection, game_data);
                dao.save(newRecord, function(err, data){});
                cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Games Saved to Play Later')
                });
            }
        });
    };

    manageGames.prototype.getDate = function(date,bias) {
      var currDate = new Date(date);
      currDate.setDate(currDate.getDate() + bias);
      var td = currDate,
        month = '' + (td.getMonth() + 1),
        day = '' + td.getDate(),
        year = td.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    return manageGames;
};