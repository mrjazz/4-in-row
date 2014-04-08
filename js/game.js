/*
 * Copyright (c) Denis Sheremetov <denis.sheremetov@gmail.com>
 * Licensed under GPL (GPL-LICENSE.txt) licenses.
 */

function AI() {

    this.movesCount = 0;
    this.board = [];

    for(var i = 0; i < 7; i++) {
        var row = [];
        for(var j = 0; j < 6; j++) {
            row.push(0);
        }
        this.board.push(row);
    }

    this.move = function(x, y, player) {
        this.board[x][y] = player;
        this.movesCount++;
    };

    this.checkWinAt = function(x, y, color) {
        var score = this.calcScoreAt(x, y, color);
        //console.log(score);
        return score > 3;

    };

    this.checkDraw = function() {
        return this.movesCount >= 6 * 7;

    };

    this._sortFunc = function(a, b) {
        return a.score < b.score ? 1 : -1;
    };

    this.getBestMove = function(color) {
        var scoresMine = [];
        var scoresEnemy = [];
        for (var x = 0; x < 7; x++) {
            for (var y = 0; y < 6; y++) {
                if (this.board[x][y] == 0) {
                    scoresEnemy.push({
                        score: this.calcScoreAt(x, y, color == 1 ? 2 : 1),
                        x: x,
                        y: y
                    });
                    scoresMine.push({
                        score: this.calcScoreAt(x, y, color),
                        x: x,
                        y: y
                    });
                }
            }
        }

        scoresMine.sort(this._sortFunc);
        scoresEnemy.sort(this._sortFunc);

        if (scoresMine[0].score > 3) {
            return scoresMine[0];
        }

        if (scoresEnemy[0].score > 2) {
            if (scoresEnemy[0].score > 3) {
                return scoresEnemy[0];
            }

            var curScoreIdx = -1;
            do {
                curScoreIdx++;
                var onTheBorder = scoresEnemy[curScoreIdx].x == 0 || scoresEnemy[curScoreIdx].x > 6 || scoresEnemy[curScoreIdx].y == 0 || scoresEnemy[curScoreIdx].y > 5;
                console.log(onTheBorder);
            } while(onTheBorder);

            if (scoresEnemy[curScoreIdx].score >= 2) {
                return scoresEnemy[curScoreIdx];
            }
        }

        if (scoresMine[0].score <= 2) {
            do {
                var x = Math.floor(Math.random() * 7);
                var y = Math.floor(Math.random() * 6);
            } while(this.board[x][y] != 0);
            return {x: x, y: y};
        }

        return {x: scoresMine[0].x, y: scoresMine[0].y};
    };

    this._calcScore = function(deltaX, deltaY, color, center, curPos, score) {
        if (score == undefined) score = 1;
        if (curPos == undefined) curPos = {x: center.x, y: center.y};

        curPos.x += deltaX;
        curPos.y += deltaY;

        if (curPos.x < 0 || curPos.x >= 7 || curPos.y < 0 || curPos.y >= 6 || Math.abs(curPos.x - center.x) > 4 || Math.abs(curPos.y - center.y) > 4) {
            return score;
        }
        if (this.board[curPos.x][curPos.y] != color) {
            return score;
        }
        return this._calcScore(deltaX, deltaY, color, center, curPos, ++score);
    }

    this.calcScoreAt = function(x, y, color) {
        var scores = [
            this._calcScore(1, 0, color, {x: x, y: y}) + this._calcScore(-1, 0, color, {x: x, y: y}) - 1,
            this._calcScore(0, 1, color, {x: x, y: y}) + this._calcScore(0, -1, color, {x: x, y: y}) - 1,
            this._calcScore(1, 1, color, {x: x, y: y}) + this._calcScore(-1, -1, color, {x: x, y: y}) - 1,
            this._calcScore(-1, 1, color, {x: x, y: y}) + this._calcScore(1, -1, color, {x: x, y: y}) - 1
        ];
        return scores.sort()[scores.length - 1];
    }

}

function Game() {

    this.players = [];

    this.initSinglePlayer = function() {
        this.init({
                name: "Player",
                type: "Human"
            },
            {
                name: "Computer",
                type: "Computer"
            }
        );
    };

    this.initMultiPlayer = function() {
        this.init({
                name: "Player1",
                type: "Human"
            },
            {
                name: "Player2",
                type: "Human"
            }
        );
    };

    this.restart = function() {
        this.init(this.players[0], this.players[1]);
    };

    this.init = function(player1, player2) {
        this.stopped = false;
        this.players = [player1, player2];
        this.curMove = this.players[0];
        this.ai = new AI();

        $("#player1 img").remove();
        $("#player2 img").remove();

        $("#start").hide();
        $("#game").show();
        $("#board").remove();

        $("#player1 h1").text(player1.name);
        $("#player2 h1").text(player2.name);

        var board = document.createElement("table");
        board.id = "board";
        $("#bordBlock").append(board);
        for(var i = 0; i < 6; i++) {
            var trElem = document.createElement("tr");
            for (var j = 0; j < 7; j++) {
                var tdElem = document.createElement("td");
                tdElem.onclick = $delegate(this, "onHumanMove");
                tdElem.setAttribute("id", this.getCellId(j, i));
                tdElem.setAttribute("x", j);
                tdElem.setAttribute("y", i);
                trElem.appendChild(tdElem);
            }
            board.appendChild(trElem);
        }
        this.update();
    };

    this.getCellId = function(x, y) {
        return "pos" + x + "_" + y;
    };

    this.updateStatus = function(status) {
        $("#gameStatus").text(status);
    };

    this.getPlayerId = function() {
        return this.curMove == this.players[0] ? 1 : 2;
    };

    this.onHumanMove = function(event) {
        if (this.stopped) {
            return;
        }
        if (this.curMove.type == "Human") {
            var curElem = event.srcElement;
            var x = Number(curElem.getAttribute("x"));
            var y = Number(curElem.getAttribute("y"));
            if (this.ai.board[x][y] != 0) return;
            $(curElem).append(this.getCoinImg(this.curMove));
            this.afterMove(x, y);
            if (this.curMove.type == "Computer") {
                var pos = this.ai.getBestMove(this.getPlayerId());
                $("#" + this.getCellId(pos.x, pos.y)).append(this.getCoinImg(this.curMove));
                this.afterMove(pos.x, pos.y);
            }
        }
    };

    this.nextMove = function() {
        this.curMove = this.curMove == this.players[0] ? this.players[1] : this.players[0];
    };

    this.afterMove = function(x, y) {
        this.ai.move(x, y, this.getPlayerId());
        if (this.ai.checkWinAt(x, y, this.ai.board[x][y])) {
            this.stopped = true;
            this.updateStatus(this.curMove.name + " Wins!");
            return;
        }
        if (this.ai.checkDraw()) {
            this.stopped = true;
            this.updateStatus("Draw");
            return;
        }
        this.nextMove();
        this.update();
    };

    this.update = function() {
        this.updateStatus("Waiting for move " + this.curMove.name);
        if (this.curMove == this.players[0]) {
            var prev = $("#player2 img");
            var next = $("#player1");
        } else {
            var prev = $("#player1 img");
            var next = $("#player2");
        }
        prev.remove();
        next.append(this.getCoinImg(this.curMove));
    };

    this.getCoinImg = function(curMove) {
        if(curMove == this.players[0]) {
            return "<img src=\"imgs/coin1.png\">";
        } else {
            return "<img src=\"imgs/coin2.png\">";
        }
    };

    this.exit = function() {
        $("#start").show();
        $("#game").hide();
    }
}

function $delegate(caller, method) {
    return function(e) {
        caller[method](e);
    };
}

var app;

$(document).ready(function(){
    app = new Game();
    app.exit();
    //app.initSinglePlayer();
});