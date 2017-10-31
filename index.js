

var fs=require('fs');
var server=require('./server.js').server;
const CiscoSpark = require(`ciscospark`);

run();

async function run(){
    /**
     * run() : Main function
     *  - load config from file
     *  - create spark object
     *  - download webhooks to confirm if url matches what's in the config file, if not, drop all webhooks and create one with the config file URL
     *  - populate config object with self info based on botemail address in config file
     * - start the server and pass it the config
     */

     /* load config from file */
    var config=await JSON.parse(fs.readFileSync('./qabot.json', "utf8"));
    config.spark=new CiscoSpark({
        credentials: config.token
    });

    /*  - download webhooks to confirm if url matches what's in the config file, if not, drop all webhooks and create one with the config file URL */
    
    var webhooks=await config.spark.webhooks.list();

    var updateWebHook=true;
    for(let i=0; i<webhooks.items.length; i++){
        if(webhooks.items[i].targetUrl===config.targetUrl){
            updateWebHook=false;
        }
    }

    if(updateWebHook){

        for (let i = 0; i < webhooks.items.length; i++) {
            config.spark.webhooks.remove(webhooks.items[i].id)
        }
        config.spark.webhooks.create({
            resource: 'messages',
            event: 'created',
            targetUrl: config.targetUrl,
            name: 'QA Bot Webhook'})
    }

    /*  - populate config object with self info based on botemail address in config file */
    var selfId=await config.spark.people.list({email:config.botemail});
    config.selfId=selfId.items[0].id;

    /* Start the server and pass it config */
    server(config);

}