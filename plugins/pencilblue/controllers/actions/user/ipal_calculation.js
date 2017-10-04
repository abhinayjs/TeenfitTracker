var async = require('async');
var request = require('simple-oauth2/node_modules/request');
var later = require('later');
var oauth2 = require('simple-oauth2');
var schedule = require('node-schedule');
var ObjectID = require('mongodb').ObjectID;
var path = require('path');
module.exports = function IpalCalculationModule(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var UrlService = pb.UrlService;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;
    var path = require('path');

    /**
     * Edits the logged in user's information
     */
    function IpalCalculation() {}
    util.inherits(IpalCalculation, FormController);

    IpalCalculation.prototype.render = function(cb) {
        var self = this;


        this.getJSONPostParams(function(err, post) {
            var dao = new pb.DAO();
            console.log("Inside IPAL Module");
            if (post.calculateIpal) {
                self.updateScore(post, cb);
            } else {
                var cbInterval = setTimeout(cbTimer, 10000);

                function cbTimer() {
                    self.updateActivity(post, cb);
                }

                var cbInterval1 = setTimeout(cbTimer1, 20000);

                function cbTimer1() {
                    self.updateScore(post, cb);
                }
            }




        });
    };

    IpalCalculation.prototype.updateActivity = function(post, cb) {
        console.log("start to update activity");
        var self = this;
        var dao = new pb.DAO();
        var registered_children = post.register_children;
        console.log(post.dateRange.start_date + " : " + post.dateRange.end_date);
        var days = self.calDays(post.dateRange.start_date, post.dateRange.end_date) + 1;
        for (var i = 0; i < registered_children.length; i++) {
            console.log(registered_children[i]._id);
            var day = 1;
            for (; day <= days; day++) {
                var currDate = self.getDate(post.dateRange.start_date, day);
                console.log(currDate);
                // self.sleep(10000);
                self.updateActivityWithUserID(registered_children[i]._id, currDate, cb);
            }
        }
        // var option_user = {
        //     where: {
        //         admin: 1
        //     }
        // };
        // dao.q("user", option_user, function(err, users) {
        //     for (var i = 0; i < users.length; i++) {
        //       console.log(users[i]._id);
        //         //self.updateActivityWithUserID(users[i]._id);
        //     };
        // });
    }

    IpalCalculation.prototype.updateActivityWithUserID = function(userID, currDate, cb) {
        var self = this;
        var yesterday = self.getYesterday();
        var dao = new pb.DAO();
        var option_fitbit = {
            where: {
                date: currDate,
                userId: self.getObjectId(userID)
            }
        };
        dao.q("fitbit_data", option_fitbit, function(err, fitbitData) {
            console.log("oooooooooooooooooooooooooooooooo:::::" + fitbitData.length);

            if (err) {
                return;
            };
            if (fitbitData == null || fitbitData.length == 0) {
                return;
            };
            var METPath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
            pb.users.loadJSONFile(METPath, function(err, eventsList) {
                if (util.isError(err)) {
                    return cb(err);
                }
                var option_events = {
                    where: {
                        end_date: { '$regex': currDate },
                        user_id: userID + ""
                    }
                };
                console.log(option_events);
                dao.q("events", option_events, function(err, eventsData) {
                    if (fitbitData[0].fitbit_activityListData) {
                        //遍历当前child的activity in Fitbit
                        for (var j = 0; j < fitbitData[0].fitbit_activityListData.activities.length; j++) {
                            //然后根据当前activity 去json文件中找对应的METS 和 name
                            for (var n = 0; n < eventsList.length; n++) {
                                if (eventsList[n].adult_code) {
                                    //if (fitbitData[0].fitbit_activityListData.activities[j].activityTypeId == eventsList[n].adult_code) {
                                    if (fitbitData[0].fitbit_activityListData.activities[j].activityId == eventsList[n].adult_code) {
                                        //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                        var m = 0;
                                        for (; m < eventsData.length; m++) {
                                            if (eventsList[n].eventName.substring(0, eventsData[m].event_name.length) == eventsData[m].event_name) {
                                                if (fitbitData[0].fitbit_activityListData.activities[j].duration / 60000 >= eventsData[m].durationTime) {
                                                    eventsData[m].durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                                    eventsData[m].finished = "true";
                                                    eventsData[m].durationMETS = eventsList[n].METS;
                                                    eventsData[m].event_name = eventsList[n].eventName.split("-")[0].trim();
                                                    dao.save(eventsData[m], function(err, events) {});
                                                    break;
                                                };
                                            }
                                        };
                                        if (m == eventsData.length) {
                                            var activity = {};
                                            activity.event_name = eventsList[n].eventName.split("-")[0].trim(); //eventsList[n].eventName;
                                            activity.user_id = userID + "";
                                            activity.scheduledMETS = 0;
                                            activity.start_date = currDate + " 00:00"; // no specific time for the start time
                                            activity.end_date = currDate + " 00:00"; //no specific time for the start time
                                            activity.durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                            activity.durationMETS = eventsList[n].METS;
                                            activity.finished = "true";
                                            var activity_save = pb.DocumentCreator.create('events', activity);
                                            dao.save(activity_save, function(err1, result) {});
                                        };
                                    };
                                } else if (eventsList[n].young_code) {
                                    //if (fitbitData[0].fitbit_activityListData.activities[j].activityTypeId == eventsList[n].young_code) {
                                    if (fitbitData[0].fitbit_activityListData.activities[j].activityId == eventsList[n].young_code) {
                                        //根据json文件中的activity 来比较 child 在pencil blue中的activity
                                        var m = 0;
                                        for (; m < eventsData.length; m++) {
                                            if (eventsList[n].eventName.substring(0, eventsData[m].event_name.length) == eventsData[m].event_name) {
                                                if (fitbitData[0].fitbit_activityListData.activities[j].duration / 60000 >= eventsData[m].durationTime) {
                                                    eventsData[m].durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                                    eventsData[m].finished = "true";
                                                    eventsData[m].durationMETS = eventsList[n].METS;
                                                    eventsData[m].event_name = eventsList[n].eventName.split("-")[0].trim();
                                                    dao.save(eventsData[m], function(err, events) {});
                                                    break;
                                                };
                                            }
                                        };
                                        if (m == eventsData.length) {
                                            var activity = {};
                                            activity.event_name = eventsList[n].eventName.split("-")[0].trim(); //eventsList[n].eventName;
                                            activity.user_id = userID + "";
                                            activity.scheduledMETS = 0;
                                            activity.start_date = currDate + " 00:00"; // no specific time for the start time
                                            activity.end_date = currDate + " 00:00"; //no specific time for the start time
                                            activity.durationTime = fitbitData[0].fitbit_activityListData.activities[j].duration / 60000;
                                            activity.durationMETS = eventsList[n].METS;
                                            activity.finished = "true";
                                            var activity_save = pb.DocumentCreator.create('events', activity);
                                            dao.save(activity_save, function(err1, result) {});
                                        };
                                    };
                                };
                            }; //end loop for n
                        }; //end loop for j
                    }; // if fitbitData.fitbit_activityListData
                }); //end dao.q events

            }); //end loadJSONFile

        });
    };


    IpalCalculation.prototype.updateScore = function(post, cb) {
        console.log("start to update score");
        var self = this;
        var dao = new pb.DAO();
        var registered_children = post.register_children;
        console.log(post.calculateIpal);
        console.log(new Date());

        if (post.calculateIpal) {
            var days = self.calDays(post.start_date, post.end_date) + 1;
            self.saveScores(post.register_children, post.start_date, cb);
        } else {
            var days = self.calDays(post.dateRange.start_date, post.dateRange.end_date) + 1;
            var option_fitbitProfile = {
                where: {
                    updateTime: post.dateRange.start_date + ""
                }
            };

            console.log(option_fitbitProfile);
            console.log(registered_children.length);
            for (var j = 0; j < registered_children.length; j++) {

                var day = 1;
                for (; day <= days; day++) {
                    var currDate = self.getDate(post.dateRange.start_date, day);
                    console.log(currDate);
                    // self.sleep(10000);
                    console.log("<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>" + registered_children[j]._id + "::" + currDate);
                    self.saveScores(registered_children[j]._id, currDate, cb);
                }
            }
        }
        cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'IPAL Calculation Successful')
        });
        return;
    };

    IpalCalculation.prototype.saveScores = function(userId, currDate, cb) {
        var self = this;
        var dao = new pb.DAO();
        var option_fitbitProfile = {
            where: {
                userid: self.getObjectId(userId)
            }
        };
        var children_info = {};
        // children_info[0] = self.session.authentication.user;
        console.log("-------------------------------------------->>>>>>>>>>..." + self.session.authentication.user);
        dao.q("userFitbitProfile", option_fitbitProfile, function(err, userFitbitProfile) {
            // children_info[0]._id = userId;
            // children_info[0].age = userFitbitProfile[0].age;
            // children_info[0]['height'] = userFitbitProfile[0]['height'] / 100;
            // children_info[0].weight = userFitbitProfile[0].weight;
            // children_info[0].gender = userFitbitProfile[0].gender;
            // children_info[0].BMI = (children_info[0].weight) / (children_info[0]['height'] * children_info[0]['height']);
            // if (children_info[0].gender == 'MALE') {
            //     if (children_info[0].BMI < 25) {
            //         children_info[0].BEE = 68 - 43.3 * children_info[0].age + 712 * children_info[0]['height'] + 19.2 * children_info[0].weight;
            //     } else {
            //         children_info[0].BEE = 419.9 - 33.5 * children_info[0].age + 418.9 * children_info[0]['height'] + 16.7 * children_info[0].weight;
            //     }
            // } else {
            //     if (children_info[0].BMI < 25) {
            //         children_info[0].BEE = 189 - 17.6 * children_info[0].age + 625 * children_info[0]['height'] + 7.9 * children_info[0].weight;
            //     } else {
            //         children_info[0].BEE = 515.8 - 26.8 * children_info[0].age + 347 * children_info[0]['height'] + 12.4 * children_info[0].weight;
            //     }
            // }

            var option_events = {
                where: {
                    finished: 'true',
                    end_date: { $regex: ".*" + currDate + "." },
                    // end_date: { $lte: activity_end_date + " 23:59" },
                    user_id: userId
                }
            };

            console.log(option_events);

            dao.q("events", option_events, function(err, eventsData) {
                // console.log(eventsData.length + "::" + children_info.length);
                console.log(eventsData);
                children_info._id = userId;
                children_info.age = userFitbitProfile[0].age;
                children_info.height = userFitbitProfile[0]['height'] / 100;
                children_info.weight = userFitbitProfile[0].weight;
                children_info.gender = userFitbitProfile[0].gender;
                children_info.BMI = (children_info.weight) / (children_info.height * children_info.height);


                if (children_info.gender == 'MALE') {
                    if (children_info.BMI < 25) {
                        children_info.BEE = 68 - 43.3 * children_info.age + 712 * children_info.height + 19.2 * children_info.weight;
                    } else {
                        children_info.BEE = 419.9 - 33.5 * children_info.age + 418.9 * children_info.height + 16.7 * children_info.weight;
                    }
                } else {
                    if (children_info.BMI < 25) {
                        children_info.BEE = 189 - 17.6 * children_info.age + 625 * children_info.height + 7.9 * children_info.weight;
                    } else {
                        children_info.BEE = 515.8 - 26.8 * children_info.age + 347 * children_info.height + 12.4 * children_info.weight;
                    }
                }


                // for (var i = 0; i < children_info.length; i++) {
                children_info.PAL = 0;
                children_info.PA = 0;
                for (var j = 0; j < eventsData.length; j++) {
                    if (eventsData[j].user_id == userId) {
                        children_info.PAL += ((eventsData[j].durationMETS - 1) * ((1.15 / 0.9) * eventsData[j].durationTime) / 1440) / (children_info.BEE / (0.0175 * 1440 * children_info.weight));
                    }
                };
                if (children_info.PAL != 0) {
                    children_info.PAL += 1.1;
                };
                if (children_info.PAL >= 1.9) {
                    children_info.PA = 1.42;
                } else if (children_info.PAL >= 1.6) {
                    children_info.PA = 1.26;
                } else if (children_info.PAL >= 1.4) {
                    children_info.PA = 1.13;
                } else if (children_info.PAL >= 1) {
                    children_info.PA = 1;
                }
                if (children_info.gender == 'MALE') {
                    if (children_info.BMI < 25) {
                        children_info.TEE = 88.5 - 61.9 * children_info.age + children_info.PA * (26.7 * children_info.weight + 903 * children_info.height);
                    } else {
                        children_info.TEE = 114 - 50.9 * children_info.age + children_info.PA * (19.5 * children_info.weight + 1161.4 * children_info.height);
                    }
                } else {
                    if (children_info.BMI < 25) {
                        children_info.TEE = 135.3 - 30.8 * children_info.age + children_info.PA * (10 * children_info.weight + 934 * children_info.height);
                    } else {
                        children_info.TEE = 389 - 41.2 * children_info.age + children_info.PA * (15 * children_info.weight + 701.6 * children_info.height);
                    }
                }
                // }; //end of for

                var pal_score = {};
                pal_score.user_id = userId;
                pal_score.BEE = children_info.BEE.toFixed(2);
                pal_score.PAL = children_info.PAL.toFixed(2);
                pal_score.PA = children_info.PA.toFixed(2);
                pal_score.TEE = Math.max(children_info.TEE, 0).toFixed(2);
                pal_score.activity_coefficient = (pal_score.TEE / pal_score.BEE).toFixed(2);
                pal_score.ipal_daily = 0;
                pal_score.weekly_bonus = 0;
                pal_score.date = currDate;
                pal_score.ipal_cumulative = 0;
                pal_score.playGame = false;

                if (pal_score.activity_coefficient <= 0) {
                    pal_score.activity_coefficient = 0;
                };
                if (pal_score.activity_coefficient >= 1.4 && pal_score.activity_coefficient < 1.6) {
                    pal_score.ipal_daily += 1;
                } else if (pal_score.activity_coefficient >= 1.6 && pal_score.activity_coefficient <= 1.9) {
                    pal_score.ipal_daily += 2;
                } else if (pal_score.activity_coefficient > 1.9) {
                    pal_score.ipal_daily += 3;
                };

                console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.user_id);
                console.log("^^^^^^^^^^^^^^BEE^^^^^^^^^^^^^^^:" + pal_score.BEE);
                console.log("^^^^^^^^^^^^^^^PAL^^^^^^^^^^^^^^:" + pal_score.PAL);
                console.log("^^^^^^^^^^^^^^^^PA^^^^^^^^^^^^^:" + pal_score.PA);
                console.log("^^^^^^^^^^^^^^^^TEE^^^^^^^^^^^^^:" + pal_score.TEE);
                console.log("^^^^^^^^^^^^^^^^^activity_coefficient^^^^^^^^^^^^:" + pal_score.activity_coefficient);
                console.log("^^^^^^^^^^^^^^^^ipal_daily^^^^^^^^^^^^^:" + pal_score.ipal_daily);

                if (pal_score.ipal_daily != 0) {
                    console.log("Entered IPAL not zero");
                    pal_score.ipal_daily += 1;
                    var options_socre = {
                        where: {
                            date: self.getDate(currDate, 0), //self.getDate(new Date(), -2),
                            user_id: userId
                        }
                    };
                    console.log("Insode If:" + self.getDate(currDate, 0));
                    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.ipal_daily);
                    dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday) {
                        // console.log("pal_socre_before_yesterday:" + pal_socre_before_yesterday[0].ipal_daily);
                        if (err || pal_socre_before_yesterday.length == 0 || pal_socre_before_yesterday[0].ipal_daily <= 0) {
                            pal_score.ipal_cumulative = 0;
                        } else {
                            pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                        }
                        console.log("Ipal_cumulative:" + pal_score.ipal_cumulative);

                        var todayDate = new Date(self.getDate(currDate, 2)); //this gets the date for whihc the PAL score is calculated
                        // todayDate.setDate(todayDate.getDate() - 1);

                        if (todayDate.getDay() == 0) {
                            console.log("Running for Sunday");
                            var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                            pal_score.mysteryStep = randomInt;
                            // pal_score.showMysteryStep = false;
                            var option_score_week_ago = {
                                where: {
                                    date: self.getDate(new Date(), -8),
                                    user_id: userId
                                }
                            };
                            console.log("--------------:" + self.getDate(new Date(), -8));
                            dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                console.log("PAL score before a week::length:" + pal_socre_before_week.length);
                                if (pal_socre_before_week.length == 0) {
                                    pal_score.ipal_cumulative += pal_score.ipal_daily;
                                    if (pal_score.prev_ipal == undefined) {
                                        pal_score.prev_ipal = 0;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    } else {
                                        // pal_score.ipal_cumulative = 10;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    }
                                    // var collection = 'PAL';
                                    // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    // dao.save(newScore, function(err, data) {});
                                } else {
                                    console.log("pal score before week found");
                                    pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week.ipal_daily;
                                    pal_score.ipal_cumulative += pal_score.weekly_bonus + pal_score.ipal_daily;
                                    console.log("Weekly bonus:" + pal_score.weekly_bonus);
                                    console.log("ipal_cumu:" + pal_score.ipal_cumulative);
                                    if (pal_score.prev_ipal == undefined) {
                                        pal_score.prev_ipal = 0;
                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    } else {

                                        if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                            pal_score.prev_ipal = pal_score.ipal_cumulative;
                                            pal_score.playGame = true;
                                        }
                                    }
                                    // var collection = 'PAL';
                                    // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                    // dao.save(newScore, function(err, data) {});
                                }
                            });
                        } else {
                            console.log("NOt sunday");
                            pal_score.ipal_cumulative += pal_score.ipal_daily;
                            // pal_score.ipal_cumulative = 10;
                            if (pal_score.prev_ipal == undefined) {
                                pal_score.prev_ipal = 0;
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            } else {
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            }
                            console.log("CUmu:" + pal_score.ipal_cumulative);
                            console.log("Prev" + pal_score.prev_ipal);
                            // var collection = 'PAL';
                            // var newScore = pb.DocumentCreator.create(collection, pal_score);
                            // dao.save(newScore, function(err, data) {});
                        }
                    }); //end for the dao.q PAL

                } else {
                    console.log("IPAL is zero");
                    var options_socre = {
                        where: {
                            date: self.getDate(currDate, 0),
                            user_id: userId
                        }
                    };
                    console.log(currDate);
                    console.log(self.getDate(currDate, 0));
                    console.log(options_socre);
                    pal_score.ipal_daily += 1;
                    dao.q("PAL", options_socre, function(err, pal_socre_before_yesterday) {
                        //                 // ipal in the day before yesterday is  0
                        // console.log("pal_socre_before_yesterday:" + pal_socre_before_yesterday[0].ipal_daily);
                        // console.log(pal_socre_before_yesterday.length);
                        if (err || pal_socre_before_yesterday.length == 0) {
                            pal_score.ipal_cumulative = 0;
                            if (pal_score.prev_ipal == undefined) {
                                pal_score.prev_ipal = 0;
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            } else {
                                if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                    pal_score.prev_ipal = pal_score.ipal_cumulative;
                                    pal_score.playGame = true;
                                }
                            }
                            // var collection = 'PAL';
                            // var newScore = pb.DocumentCreator.create(collection, pal_score);
                            // dao.save(newScore, function(err, data) {});
                            return;
                        } else if (pal_socre_before_yesterday[0].ipal_daily <= 0) {
                            console.log("^^^^^^^^^^^^^pal_socre_before_yesterday is less than or equal zero^^^^^^^^^^^^^^^^^^^^");
                            // pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                            var options_score_before = {
                                where: {
                                    date: self.getDate(new Date(), -3),
                                    user_id: userId
                                }
                            };
                            dao.q("PAL", options_socre, function(err, pal_socre_before_before_yesterday) {
                                console.log("PAL score 3 days ago");
                                // ipal in the day before before yesterday is  0
                                if (pal_socre_before_before_yesterday.length == 0 || pal_socre_before_before_yesterday[0].ipal_daily <= 0) {
                                    console.log("IPAL is zero or less or no records found");
                                    pal_score.ipal_daily--;
                                    var todayDate = new Date();
                                    todayDate.setDate(todayDate.getDate() - 1);
                                    if (todayDate.getDay() == 0) {
                                        console.log("running for sunday");
                                        var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                        pal_score.mysteryStep = randomInt;
                                        var option_score_week_ago = {
                                            where: {
                                                date: self.getDate(new Date(), -8),
                                                user_id: userId
                                            }
                                        };
                                        dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                            console.log("pal score before week");
                                            if (pal_socre_before_week == null || pal_socre_before_week.length == 0) {
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                // var collection = 'PAL';
                                                // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                // dao.save(newScore, function(err, data) {});
                                            } else {
                                                pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {

                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                // var collection = 'PAL';
                                                // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                // dao.save(newScore, function(err, data) {});
                                            }
                                        });
                                        // ipal in the day before before yesterday is not  0
                                    } else {
                                        console.log("running for other day");
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {

                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        // var collection = 'PAL';
                                        // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        // dao.save(newScore, function(err, data) {});
                                    }
                                } else {
                                    console.log("PAL score 3 days ago found");
                                    pal_score.ipal_cumulative = pal_socre_before_yesterday[0].ipal_cumulative;
                                    var todayDate = new Date();
                                    todayDate.setDate(todayDate.getDate() - 1);
                                    if (todayDate.getDay() == 0) {
                                        var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                        pal_score.mysteryStep = randomInt;
                                        var option_score_week_ago = {
                                            where: {
                                                date: self.getDate(new Date(), -8),
                                                user_id: userId
                                            }
                                        };
                                        dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                            console.log("pal score before week found");
                                            if (pal_socre_before_week == null || pal_socre_before_week.length == 0) {
                                                pal_score.ipal_cumulative += pal_score.ipal_daily;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                // var collection = 'PAL';
                                                // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                // dao.save(newScore, function(err, data) {});
                                            } else {
                                                pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                                pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                                if (pal_score.prev_ipal == undefined) {
                                                    pal_score.prev_ipal = 0;
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                } else {
                                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                        pal_score.playGame = true;
                                                    }
                                                }
                                                // var collection = 'PAL';
                                                // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                                // dao.save(newScore, function(err, data) {});
                                            }
                                        });
                                    } else {
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {

                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        var collection = 'PAL';
                                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        dao.save(newScore, function(err, data) {});
                                    }
                                }
                            }); //end dao.q PAL
                        } else {
                            console.log("pal score before yesterday is not zero or less");
                            var todayDate = new Date();
                            todayDate.setDate(todayDate.getDate() - 1);
                            if (todayDate.getDay() == 0) {
                                var randomInt = Math.floor(Math.random() * (0 - 6 + 1) + 0);
                                pal_score.mysteryStep = randomInt;
                                var option_score_week_ago = {
                                    where: {
                                        date: self.getDate(new Date(), -8),
                                        user_id: userId
                                    }
                                };
                                console.log("***************************:" + self.getDate(new Date(), -8));
                                dao.q("PAL", option_score_week_ago, function(err, pal_socre_before_week) {
                                    if (pal_socre_before_week == null || pal_socre_before_week.length == 0) {
                                        pal_score.ipal_cumulative += pal_score.ipal_daily;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        // var collection = 'PAL';
                                        // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        // dao.save(newScore, function(err, data) {});
                                    } else {
                                        pal_score.weekly_bonus = pal_score.ipal_daily - 10 - pal_socre_before_week[0].ipal_daily;
                                        pal_score.ipal_cumulative += pal_score.ipal_daily + pal_score.weekly_bonus;
                                        if (pal_score.prev_ipal == undefined) {
                                            pal_score.prev_ipal = 0;
                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        } else {

                                            if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                                pal_score.prev_ipal = pal_score.ipal_cumulative;
                                                pal_score.playGame = true;
                                            }
                                        }
                                        // var collection = 'PAL';
                                        // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                        // dao.save(newScore, function(err, data) {});
                                    }
                                });
                            } else {
                                pal_score.ipal_cumulative += pal_socre_before_yesterday[0].ipal_cumulative + pal_score.ipal_daily;
                                if (pal_score.prev_ipal == undefined) {
                                    pal_score.prev_ipal = 0;
                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                        pal_score.playGame = true;
                                    }
                                } else {

                                    if (pal_score.ipal_cumulative - pal_score.prev_ipal >= 10) {
                                        pal_score.prev_ipal = pal_score.ipal_cumulative;
                                        pal_score.playGame = true;
                                    }
                                }
                                // var collection = 'PAL';
                                // var newScore = pb.DocumentCreator.create(collection, pal_score);
                                // dao.save(newScore, function(err, data) {});
                            }
                        }
                    }); //end dao.q pal_socre_before_yesterday
                }
                console.log("After calculation::::::::::::::::::::::::::::::::::::::::::");
                console.log(pal_score);
                var criteria = {
                    where: {
                        date: currDate,
                        user_id: userId
                    }
                };
                console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:::" + criteria);
                dao.q("PAL", criteria, function(err, pal_score_today) {
                    if (pal_score_today == null || pal_score_today.length == 0) {
                        console.log("Insert PAL document");
                        var collection = 'PAL';
                        var newScore = pb.DocumentCreator.create(collection, pal_score);
                        dao.save(newScore, function(err, data) {
                            if (util.isError(err)) {
                                cb({
                                    code: 500,
                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                                });
                                return;
                            }
                        });
                    } else {
                        console.log("Update PAL document");

                        console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:" + pal_score.user_id);
                        console.log("^^^^^^^^^^^^^^BEE^^^^^^^^^^^^^^^:" + pal_score.BEE);
                        console.log("^^^^^^^^^^^^^^^PAL^^^^^^^^^^^^^^:" + pal_score.PAL);
                        console.log("^^^^^^^^^^^^^^^^PA^^^^^^^^^^^^^:" + pal_score.PA);
                        console.log("^^^^^^^^^^^^^^^^TEE^^^^^^^^^^^^^:" + pal_score.TEE);
                        console.log("^^^^^^^^^^^^^^^^^activity_coefficient^^^^^^^^^^^^:" + pal_score.activity_coefficient);
                        console.log("^^^^^^^^^^^^^^^^ipal_daily^^^^^^^^^^^^^:" + pal_score.ipal_daily);

                        var updateCriteria = {
                            date: currDate,
                            user_id: userId
                        };
                        var updatePal = {
                            $set: {
                                BEE: pal_score.BEE,
                                PAL: pal_score.PAL,
                                PA: pal_score.PA,
                                TEE: pal_score.TEE,
                                activity_coefficient: pal_score.activity_coefficient,
                                ipal_daily: pal_score.ipal_daily,
                                weekly_bonus: pal_score.weekly_bonus,
                                ipal_cumulative: pal_score.ipal_cumulative,
                                playGame: pal_score.playGame,
                                mysteryStep: pal_score.mysteryStep
                            }
                        };
                        var updatePalOptions = {
                            multi: false
                        };
                        dao.updateFields("PAL", updateCriteria, updatePal, updatePalOptions, function(err1, result1) {
                            if (util.isError(err1)) {
                                cb({
                                    code: 400,
                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, "wrong")
                                });
                                return;
                            }
                        });
                    }
                });

            }); //end dao.q events
        });
    };

    IpalCalculation.prototype.getObjectId = function(oid) {
        try {
            return new ObjectID(oid + '');
        } catch (err) {
            return oid;
        }
    };

    IpalCalculation.prototype.getDate = function(date, bias) {
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

    IpalCalculation.prototype.getYesterday = function() {
        var today = new Date();
        today.setDate(today.getDate() - 1);
        var yd = today,
            month = '' + (yd.getMonth() + 1),
            day = '' + yd.getDate(),
            year = yd.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;


        return [year, month, day].join('-');
    };

    IpalCalculation.prototype.calDays = function(date1, date2) {
        var d1 = new Date(date1);
        var d2 = new Date(date2);
        var oneDay = 24 * 60 * 60 * 1000;
        // console.log(d1.getDate());
        // console.log(d2.getDate());
        return Math.round(Math.abs((d1.getTime() - d2.getTime()) / (oneDay)));;
    };

    IpalCalculation.prototype.sleep = function(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    };

    //exports
    return IpalCalculation;
};
