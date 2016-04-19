var moment = require('moment');
var CronJob = require('cron').CronJob;
var config = require('../config/config');
var MongoCache = require('../util/mongo-cache');
var BerniePbClient = require('../api_clients/bernie-pb-client');
var DailyCallLogService = require('../services/daily-call-log-service');

module.exports = {
    setupJobs: () => {
        new CronJob('00 00 12 * * *', function () {
            var mongoCache = new MongoCache();
            mongoCache.getDb(config.mongo.connectionString).then((db) => {
                var berniePbClient = new BerniePbClient();
                var yesterday = moment().subtract(1, 'day').toDate();
                var dailyCallLogService = new DailyCallLogService(db, berniePbClient);
                dailyCallLogService.saveDailyCallLog(yesterday).then(() => {
                    console.log('Saved daily call log');
                }).catch((err) => {
                    console.error('Failed to save daily call log');
                    console.error(err.stack);
                })
            }).catch((err) => {
                console.error('Failed to get mongo db connection');
                console.error(err.stack);
            });
        }, null, true, 'America/Detroit', null, true);
    }
};