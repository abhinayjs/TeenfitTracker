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

//dependencies
var async = require('async');

module.exports = function ManageMongodbModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for the admin dashboard
     * @class ManageMongodb
     * @constructor
     */
    function ManageMongodb(){}
    util.inherits(ManageMongodb, pb.BaseController);

    /**
     * @see BaseController#render
     */
    ManageMongodb.prototype.render = function(cb) {
        var self = this;

        self.ts.load('admin/manage_mongodb', function(error, result) {
            cb({content: result});
        });
    };

    /**
     * Gather all necessary data for rendering the dashboard.
     * <ul>
     * <li>Article count</li>
     * <li>Page Count</li>
     * <li>Cluster Status</li>
     * </ul>
     * @method gatherData
     * @param {Function} cb A callback that provides two parameters: cb(Error, Object)
     */
    ManageMongodb.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

        };
        async.parallel(tasks, cb);
    };

    //exports
    return ManageMongodb;
};
