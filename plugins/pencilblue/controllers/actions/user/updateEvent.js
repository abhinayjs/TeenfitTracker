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

module.exports = function UpdateEventModule(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;
    var path = require('path');

    /**
     * Edits the logged in user's information
     */
    function UpdateEvent() {}
    util.inherits(UpdateEvent, FormController);

    UpdateEvent.prototype.render = function(cb) {
        var self = this;


        this.getJSONPostParams(function(err, post) {
            //sanitize
            post._id = BaseController.sanitize(post._id);
            post.start_date = BaseController.sanitize(post.start_date);
            post.end_date = BaseController.sanitize(post.end_date);
            post.user_id = BaseController.sanitize(post.user_id);
            post.finished = BaseController.sanitize(post.finished);
            post.durationTime = BaseController.sanitize(post.durationTime);

            var parsedDate = new Date(Date.parse(post.start_date))
            var newDate = new Date(parsedDate.getTime() + (60000 * post.durationTime))


            var month = '' + (newDate.getMonth() + 1);
            var day = '' + newDate.getDate();
            var year = newDate.getFullYear();
            var hour = newDate.getHours() + '';
            var minutes = newDate.getMinutes() + '';
            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;
            if (hour.length < 2)
                hour = '0' + hour;
            if (minutes.length < 2)
                minutes = '0' + minutes;

            var currEndDate = year + "-" + month + "-" + day + " " + hour + ":" + minutes;
            var dao = new pb.DAO();

            var filePath = path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'data', 'events.json');
            pb.users.loadJSONFile(filePath, function(err, eventsList) {
                if (post.finished == 'false') {
                    post.durationTime = 0;
                    for (var i = eventsList.length - 1; i >= 0; i--) {
                        if (eventsList[i].eventName == post.event_name) {
                            post.scheduledMETS = eventsList[i].METS;
                        }
                    };
                } else {
                    var i = eventsList.length - 1;
                    for (; i >= 0; i--) {
                        if (eventsList[i].eventName.indexOf(post.event_name) != -1) {
                            if (eventsList[i].eventName == post.event_name) {
                                post.durationMETS = eventsList[i].METS;
                                break;
                            } else {
                                var event_name = post.event_name;
                                if (post.durationTime > 30) {
                                    event_name = event_name + " - hard effort";
                                } else if (post.durationTime > 15) {
                                    event_name = event_name + " - moderate effort";
                                } else {
                                    event_name = event_name + " - light effort";
                                }
                                var j = i;
                                for (; j >= 0; j--) {
                                    if (eventsList[j].eventName == event_name) {
                                        post.durationMETS = eventsList[j].METS;
                                        break;
                                    }
                                };
                            }
                        }
                    };
                }

                dao.loadById(post._id, 'events', function(err, events) {
                    if (util.isError(err) || events === null) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }

                    delete post._id;
                    pb.DocumentCreator.update(post, events);
                    dao.save(events, function(err, result) {
                        if (util.isError(err)) {
                            cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                            });
                            return;
                        }
                        cb({
                            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'EVENT' + ' ' + self.ls.get('EDITED'))
                        });
                    });
                });
            });

        });
    };

    //exports
    return UpdateEvent;
};
