
module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Contact Form - A basic contact form plugin.
     * look like.
     *
     * @author Blake Callens <blake@pencilblue.org>
     * @copyright 2015 PencilBlue, LLC
     */
    function MongodbManage(){}

    /**
     * Called when the application is being installed for the first time.
     *
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    MongodbManage.onInstall = function(cb) {
        var self = this;
        
        var cos = new pb.CustomObjectService();
        cos.loadTypeByName('pb_mongodbManage', function(err, contactType) {
            if (util.isError(err) || contactType) {
                return cb(err, !util.isError(err));
            }
            
            var contactValues = {
                name: 'pb_mongodbManage',
                fields: {
                    name: {
                        field_type: 'text'
                    },
                    email: {
                        field_type: 'text'
                    }
                    ,comment: {
                        field_type: 'text'
                    },
                    date: {
                        field_type: 'date'
                    }
                    // oneToMany: { 
                    //     field_type: 'child_objects', object_type: 'article'

                    // }
                    // oneToOne: {
                    //     field_type: 'peer_object', object_type: 'article'
                    // }
                }
            };

            cos.saveType(contactValues, function(err, contactType) {
                cb(err, !util.isError(err));
            });
        });
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     *
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    MongodbManage.onUninstall = function(cb) {
      cb(null, true);
    };

    /**
     * Called when the application is starting up. The function is also called at
     * the end of a successful install. It is guaranteed that all core PB services
     * will be available including access to the core DB.
     *
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    MongodbManage.onStartup = function(cb) {
      cb(null, true);
    };

    /**
     * Called when the application is gracefully shutting down.  No guarantees are
     * provided for how much time will be provided the plugin to shut down.
     *
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    MongodbManage.onShutdown = function(cb) {
      cb(null, true);
    };

    //exports
    return MongodbManage;
};
