
module.exports = function(pb) {
    
    /**
     * Chartbeat - A chartbeat analytics plugin
     *
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2014 PencilBlue, LLC
     */
    function Chartbeat(){}
    
    //pb dependencies
    var PluginService = pb.PluginService;

    /**
     * Called when the application is being installed for the first time.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    Chartbeat.onInstall = function(cb) {
        cb(null, true);
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    Chartbeat.onUninstall = function(cb) {
        cb(null, true);
    };

    /**
     * Called when the application is starting up. The function is also called at
     * the end of a successful install. It is guaranteed that all core PB services
     * will be available including access to the core DB.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    Chartbeat.onStartup = function(cb) {
        pb.AnalyticsManager.registerProvider('chartbeat', function(req, session, ls, cb) {
            var pluginService = new PluginService();
            pluginService.getSetting('chartbeat_uid', 'chartbeat-pencilblue', function(err, chartbeatUID) {
                //TODO handle error
                if(!chartbeatUID || chartbeatUID.length === 0) {
                    return cb(err, '');
                }
                var website = pb.config.siteRoot.split('http://').join('').split('https://').join('');
                var script  = "<script type=\"text/javascript\">var _sf_startpt=(new Date()).getTime()</script><script type=\"text/javascript\">var _sf_async_config = { uid: " + chartbeatUID + ", domain: '" + website + "', useCanonical: true }; (function() { function loadChartbeat() { window._sf_endpt = (new Date()).getTime(); var e = document.createElement('script'); e.setAttribute('language', 'javascript'); e.setAttribute('type', 'text/javascript'); e.setAttribute('src','//static.chartbeat.com/js/chartbeat.js'); document.body.appendChild(e);}; var oldonload = window.onload; window.onload = (typeof window.onload != 'function') ? loadChartbeat : function() { oldonload(); loadChartbeat(); };})();</script>";

                cb(null, script);
            });
        });
        cb(null, true);
    };

    /**
     * Called when the application is gracefully shutting down.  No guarantees are
     * provided for how much time will be provided the plugin to shut down.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    Chartbeat.onShutdown = function(cb) {
        cb(null, true);
    };

    //exports
    return Chartbeat;
};
