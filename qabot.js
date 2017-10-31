var fs = require('fs');
var convo = JSON.parse(fs.readFileSync('./convo.json'));
var request = require('request-promise');
var Number=require('number');
function qabot(config) {
    var api = [];
    var spark = config.spark;
    var selfId = config.selfId;
    var initialized = false;
    var pending; //temporarily holds roomId while Space is being initialized
    var groupId; //the group space
    var moderatorId; // the moderator Space
    var questionArray=[];



    api.newMsg = async function (hook) {
        var msg = await spark.messages.get(hook.id)
        var text = msg.text.toLowerCase().substring(config.botName.length + 1);

        // 1. test if message is from self
        // 2. test if room is initialed
        //test if message is direct or group
        //if direct reply and post message to answer space
        // if group, is it from the answer space or the group space
        // if group space, reply with instructions
        // if answer space, does it begin with a number reply, if not instructions/commands

        // 1. test if message is from self
        if (msg.personId === selfId) {
            return;
        }

        /* 2. test if room is initialed
            a. if not initialized, check if this is a group or a direct room.
                    -- If group ask if we want to initialize it and what type (group, moderator, no)
                    -- if direct room send message that it needs to be initialized from a public space
                    -- record roomId in pending variable
                b. If pending
                    -- confirm msg.roomId===pending variable
                        -- if groupRoomId===undefined&& message===group 
                        -- if yes, take action on available options (group - reply with name of moderator room, moderator, reply with name of )
            */
            //Debug
                    /**  Space Initialization */
        if (initialized === false) {
            if (msg.roomType === "group") {
                spark.messages.create({ roomId: msg.roomId, text: convo["100"].text })
                initialized = "pending";
                pending = msg.roomId;
            } else if (msg.roomType === "direct") {
                spark.messages.create({ roomId: msg.roomId, text: convo["101"].text })

            }
        } else if (initialized === 'pending') {

            switch (text) {
                case "group": {
                    initialized = "pending2";
                    groupId = msg.roomId;
                    spark.messages.create({ roomId: msg.roomId, text: convo["102"].text })

                    break;
                }
                case "moderator": {
                    initialized = "pending2"
                    moderatorId = msg.roomId;

                    spark.messages.create({ roomId: msg.roomId, text: convo["103"].text })
                    break;
                }
                case "no": {
                    initialized = false;
                    spark.messages.create({ roomId: msg.roomId, text: convo["104"].text })
                    break;
                }
                default: {
                    spark.messages.create({ roomId: msg.roomId, text: convo["105"].text })
                    break;
                }


            }

        } else if (initialized === 'pending2') {
            var space = await spark.rooms.create({ title: text });
            var mem = await spark.memberships.create({ personId: msg.personId, roomId: space.id })
            if (moderatorId === undefined) {
                moderatorId = space.id;
            } else if (groupId === undefined) {

                groupId = space.id;
            }
            spark.messages.create({ roomId: groupId, text: convo["106"].text + config.botemail })
            spark.messages.create({ roomId: moderatorId, text: convo["107"].text })
            spark.messages.create({ roomId: moderatorId, text: convo["108"].text })

            initialized = true;
        } else if (initialized === true) {
            if (msg.roomId === moderatorId) {

                //upload users or moderators
                if (text === "users") {
                    newFile({ roomId: groupId, msg: msg })
                } else if (text === "moderators") {
                    newFile({ roomId: moderatorId, msg: msg })

                } else if (text === "help") {
                    spark.messages.create({ roomId: moderatorId, text: convo["201"].text })

                } else if (text.substring(0, text.indexOf(" ")).toLowerCase ==="show" ){
                    var text2=text.substring(0, text.indexOf(" ")+1);
                    if(text2==="unanswered"||text2.substring(0, text2.indexOf(" ")==="unanswered")){

                    }
                }else if (!isNaN(parseInt(text.substring(0, text.indexOf(" "))))){
                    var index=text.substring(0, text.indexOf(" "));
                    var resp=text.substring(text.indexOf(" ")+1);
                    spark.messages.create({ roomId: questionArray[index-1].asker, text: convo["204"].text+index+":  "+resp })
                    var person=await spark.people.get(msg.personId)
                    questionArray[index-1].answerer=person.displayName;  
                    questionArray[index-1].response=resp;
                    spark.messages.create({roomId:groupId, text: "Question "+index+" from anonymous: "+questionArray[index-1].question+"\r\nAnswer from "+person.displayName+": "+resp})
                }
            }else if(msg.roomId===groupId){

            }else if(msg.roomType==='direct'){
                //one-one question from user
                text=msg.text;
                var index=questionArray.push({index:questionArray.length+1,question:text, response:undefined, asker:msg.roomId, answerer:undefined});
                spark.messages.create({roomId:moderatorId, text:convo["203"].text+index+":  "+questionArray[index-1].question})
                
               spark.messages.create({ roomId: msg.roomId, text: convo["202"].text+index });

               
                
            }
        }
    }
    /**  End Space Initialization */
    /**  User Upload */
    newFile = async function (params) {
        var msg = params.msg;
        var text = msg.text.toLowerCase().substring(config.botName.length + 1);
        var roomId = params.roomId;

        var namesList = await request({ uri: msg.files[0], headers: { "Authorization": "Bearer " + config.token } });
        var namesArray = namesList.split(',')

        for (let i = 0; i < namesArray.length; i++) {
            spark.memberships.create({ personEmail: namesArray[i].trim(), roomId: roomId })

        }
    }


    /**  End User Upload */









    return api;
}


exports.qabot = qabot;