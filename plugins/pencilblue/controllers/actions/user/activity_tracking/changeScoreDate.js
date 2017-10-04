/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var async = require('async');
var path = require('path');
module.exports = function changeScoreDateModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;
    
    /**
     * Checks to see if the proposed username is available
     */
    function changeScoreDate(){}
    util.inherits(changeScoreDate, pb.BaseController);

    changeScoreDate.prototype.render = function(cb) {
        var self = this;
        this.getJSONPostParams(function(err, post) {
            console.log(post);
            if(self.session.authentication.user.admin == 0){//parent account
                var child_id = post.child_id;
                // var child_username = post.child_username;
                var score_date = post.score_date;
                var parentUserId = self.session.authentication.user_id;
                var dao = new pb.DAO();

                if(child_id == "All Children"){
                    var opts = {
                        where: {
                            parent_id : parentUserId
                        }
                    };
                    dao.q("member", opts, function(err, members){
                        console.log(members);
                        var childIDs = new Array();
                        for (var i = members.length - 1; i >= 0; i--) {
                            childIDs[i] = pb.DAO.getObjectId(members[i].child_id);
                        };
                        var option_score = {
                            where:{
                                user_id : { '$in': childIDs.map(String)},
                                date: score_date
                            }
                        };
                        var option = {
                            where:{
                                _id : { '$in': childIDs}
                            }
                        };
                        dao.q("user", option, function(err, children){
                            var children_info = [];
                            for (var i = children.length - 1; i >= 0; i--) {
                                children_info[i] = children[i];
                            };
                            var option_fitbitProfile = {
                                where:{
                                    userid : {'$in': childIDs}
                                }
                            };
                            dao.q("PAL", option_score, function(err, pal_score){
                                console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"+pal_score);
                                for (var i = 0; i < children_info.length; i++) {
                                   for (var j = 0; j < pal_score.length; j++) {
                                        if (children_info[i]._id+"" == pal_score[j].user_id+"") {
                                            children_info[i].pal = pal_score[j];
                                            break;
                                        };
                                   };
                                };
                                daily_scores = children_info;
                                cb({content: daily_scores});
                                
                            });//end q "PAL"
                        });//end q user
                    });//end q member
                }//end if
                else{
                    console.log(score_date);
                    var children_info = [];
                    var opt = {
                        where:{
                            _id : pb.DAO.getObjectId(child_id)
                        }
                    };

                    dao.q("user",opt,function(err, users){
                        
                        children_info.push(users[0]);
                        var option_score = {
                            where:{
                                user_id : pb.DAO.getObjectId(child_id).toString(),
                                date: score_date
                            }
                        };

                        dao.q("PAL", option_score, function(err, pal_score){
                            children_info[0].pal = pal_score[0];
                            daily_scores = children_info;
                            cb({content: daily_scores});
                            
                        });//end q "PAL"
                    });
                }//end else
            }//end if for parent
            else{
                var children_info = [];
                var child_id = self.session.authentication.user_id;
                var score_date = post.score_date;
                var dao = new pb.DAO();
                var opt = {
                    where:{
                        _id : pb.DAO.getObjectId(child_id)
                    }
                };

                dao.q("user",opt,function(err, users){
                    
                    children_info.push(users[0]);
                    var option_score = {
                        where:{
                            user_id : pb.DAO.getObjectId(child_id)+"",
                            date: score_date
                        }
                    };
                    dao.q("PAL", option_score, function(err, pal_score){
                        children_info[0].pal = pal_score[0];
                        daily_scores = children_info;
                        cb({content: daily_scores});
                        
                    });//end q "PAL"
                });

            }
            
            

        });//end getJson


    };//end render


    changeScoreDate.prototype.getDate = function(date,bias) {
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

    changeScoreDate.prototype.compareTwoDates = function(startOn, nextOn){
          var so = new Date(startOn), no = new Date(nextOn);
          
          return so.getTime() <= no.getTime();
    };
    //exports
    return changeScoreDate;
};
