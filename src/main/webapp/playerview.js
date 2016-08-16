/* 
 * Copyright 2016 tan.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//join game

var PlayerID;
var gameID;
var connection = null;
var selectedCard;
$(function ()
{
    $("#createPlayer").click(function (event) {
        $.getJSON('uno/player/create/' + $('#playerName').val(), function (jd) {
            $('#loadlist').val(jd + " has been created");
            PlayerID = jd;
            alert("player created");
        });

    });
    $(".gameTemplate").on("singletap", "li", function () {
        gid = $(this).find("h3").text();
        console.log(gid);

    });
    var gameTemplate = Handlebars.compile($("#gameTemplate").html());
    var waitingRoomTemplate = Handlebars.compile($("#waitingRoomTemplate").html());
    var gameRoomTemplate = Handlebars.compile($("#gameRoomTemplate").html());
    $("#loadlist").on("singletap", function ()
    {
        $("#view-games").empty();
        var getAllGames = $.getJSON("uno/game/viewall");
        getAllGames.done(function (result)
        {
            $("#view-games").append(gameTemplate({game: result}));
        });



    });
    $("#view-games").on('singletap', 'li', function () {


        gameID = $(this).find("h3").text();
        alert(gameID);
        var data = {};
        data["gameID"] = gameID;
        data["playerID"] = PlayerID;
        $.ajax({
            type: "Post",
            url: "uno/game/joingame",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function () {

            },
            error: function () {

            }
        });

        $("#wait_game_refreshBtn").trigger('singletap');



        $(function () {
            var RoomID = gameID;
            alert(RoomID);


            connection = new WebSocket('ws://localhost:8080/unocard/gameroom/' + RoomID);

            connection.onerror = function (event) {
                onError(event);
            };

            connection.onopen = function (event) {
                onOpen(event);
            };

            connection.onmessage = function (event) {
                onMessage(event);
            };

            function onMessage(event) {
                var msg = JSON.parse(event.data);
                console.log("receive:" + JSON.stringify(event.data));
                switch (msg.cmd)
                {
                    case 'getPlayerInfo':
                        var data = {};
                        data["cmd"] = msg.cmd + "-ack";
                        data["gameID"] = gameID;
                        data["playerID"] = PlayerID;
                        connection.send(JSON.stringify(data));
                        break;
                    case 'waitingRoom-RefreshPlayer':
                        console.log("someone joined");
                        $.getJSON("uno/game/view/" + gameID).done(function (result) {
                            var players = waitingRoomTemplate({players: result});
                            $("#view-players").empty();
                            $("#view-players").append(players);
                            var keys = [];
                            for (var k in result)
                                keys.push(k);
                            $('#wait_game_player_count').html(keys.length);

                        });
                        break;
                    case 'waitingRoomClient-StartGame':
                        $.getJSON('uno/game/view/' + gameID + '/status', function (status) {

                            var gameStatus = status;

                            if (gameStatus === "started") {
                                $.UIGoToArticle("#gameRoom");
                                var data = {};
                                data["gameID"] = gameID;
                                data["playerID"] = PlayerID;
                                $.ajax({
                                    type: "Post",
                                    url: "uno/game/getplayerhand",
                                    contentType: "application/json",
                                    data: JSON.stringify(data),
                                    success: function () {
                                        alert('got cards');
                                    },
                                    error: function () {
                                        alert('cant start: game has already started or player is not created properly');
                                    }
                                }).done(function (result)
                                {
                                    $("#view-cards").append(gameRoomTemplate({card: result}));
                                });
                            }
                            $(".gameRoom").on("singletap", "li", function (event) {
                                selectedCard= $(this).find(":input").val();
                                        //($('input[cardIndex]').val());
                                 //$(this).find(":input").text();
                                
                                console.log(selectedCard);
                                alert(selectedCard);

                            });
                        });

                        break;
                }

            }

            function onOpen(event) {

            }

            function onError(event) {
                alert(event.data);
            }


        });

        $.UIGoToArticle("#wait_game");


    });

    $("#wait_game_refreshBtn").on("singletap", function getGame()
    {
        $.getJSON("uno/game/view/" + gameID).done(function (result) {
            var players = waitingRoomTemplate({players: result});
            $("#view-players").empty();
            $("#view-players").append(players);
            var keys = [];
            for (var k in result)
                keys.push(k);
            $('#wait_game_player_count').html(keys.length);

        });

        function updateGameStatus() {
            $.getJSON('uno/game/view/' + gameID + '/status', function (status) {

                var gameStatus = status;

                if (gameStatus === "started") {
                    $.UIGoToArticle("#gameRoom");
                }
            });
        }
    });

    $("#wait_game_startBtn").on("singletap", function startGame()
    {
        var data = {};
        data["gameID"] = gameID;
        data["playerID"] = PlayerID;
        $.ajax({
            type: "Post",
            url: "uno/game/startgame",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function () {
                $.UIGoToArticle("#gameRoom");
            },
            error: function () {

                alert('cant start');

            }
        });
        var sendmsg = {};
        sendmsg["cmd"] = "WaitingRoomEndPoint-StartGame";
        sendmsg["gameID"] = gameID;
        sendmsg["playerID"] = PlayerID;
        connection.send(JSON.stringify(sendmsg));
    });

    $("#gameRoom_refreshBtn").on("singletap", function startGame()
    {
        var data = {};
        data["gameID"] = gameID;
        data["playerID"] = PlayerID;
        $.ajax({
            type: "Post",
            url: "uno/game/getplayerhand",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function () {
                alert('got cards');
            },
            error: function () {

                alert('cant start');

            }
        }).done(function (result)
        {
            $("#view-cards").append(gameRoomTemplate({card: result}));
        });
    });
});

