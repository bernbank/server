'use strict';
var precond = require('precond');
var validator = require('validator');
var moment = require('moment');

class PledgeService {

    constructor(db) {
        this.pledges = db.collection('pledges');
    }


    /**
     * Creates a new pledge in the Database
     **/
    createPledge(pledge) {
        return new Promise((resolve, reject) => {

            precond.checkArgument(pledge, 'Pledge cannot be null or undefined');
            precond.checkArgument(typeof pledge === 'object' && !Array.isArray(pledge), 'Pledge must be an object');
            precond.checkArgument(Object.keys(pledge).length > 0, 'Pledge cannot be empty');
            precond.checkArgument(pledge.email, 'Pledge must have an associated email property');
            precond.checkArgument(validator.isEmail(pledge.email), 'Pledge must have a valid formatted email address');
            precond.checkArgument(pledge.amount, 'Pledge amount must be present');
            precond.checkArgument(validator.isInt(pledge.amount + "", {min:1, max:10000}), 'Pledge amout must be an integer between 1 and 10000');
           
	    pledge.added = new Date();

            var query = {
                'email' : pledge.email,
            }
            this.pledges.update(query, pledge,  {upsert:true} ).then((record) => {
                var prom = this.getPledge(pledge.email);
                prom.then((data) => {
                    resolve(data);
                }).catch((e) => {
                    reject(e);
                });
            }).catch((err) => {
                reject(err);
            });

        });
    }

    getPledge(id) {
        return new Promise((resolve, reject) => {
            this.pledges.find({"email": id}).limit(1).next().then(function (doc) {
                resolve(doc);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Gets the total number of pledges from yesterday.
     **/
    getPledgesByDay(strDate) {
      return new Promise((resolve, reject) => {
        var desiredDateStart = moment(strDate, "YYYYMMDD").startOf('day').toDate();
        var desiredDateEnd = moment(strDate, "YYYYMMDD").endOf('day').toDate();
        var query = {
          'added' : {"$gte" : desiredDateStart, '$lte' : desiredDateEnd  }
        };
	var pledges = [];
        var totalPledges = 0;

        this.pledges.find(query, (err,thing) => {
            thing.each( (err, doc) => {
              if (doc != null) {
                pledges.push(doc);
		totalPledges += 1;
              } else {
                resolve( {"total": totalPledges}  );
              }
          });
        });
      });
    }


    /**
     * Gets the total number of pledges from all time
     **/
    getTotalPledges() {
      return new Promise((resolve, reject) => {
          this.pledges.count().then((data) => {
            resolve( {"total": data}  );
          }).catch( (e) => {
            reject(e);
          });
        
      });
    }



    deletePledge(id) {
        return new Promise((resolve, reject) => {
            this.pledges.deleteOne({"email": id}).then(function (result) {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }
}

module.exports = PledgeService;
