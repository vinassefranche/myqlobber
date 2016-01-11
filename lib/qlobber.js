/**
this is a fork of : https://github.com/davedoesdev/qlobber

This version does not handle values attached to topics. 
You define topics that can match and a boolean if got from match() function.
Does not support wildcard on multiple level (#).

It handles a wildcard single level on both the topics add and the topic to match.

Examples : 

var matcher = new Qlobber();
matcher.add('*.orange.*');
matcher.add('*.*.rabbit');
matcher.add('foo.one.bar');
assert.deepEqual(
    [
        'quick.orange.rabbit',
        'lazy.orange.elephant',
        'lazy.pink.rabbit',
        'lazy.brown.fox',
        'orange',
        'foo.one.bar',
        'foo.two.bar',
        'foo.*.bar'
    ].map(function (topic)
    {
        return matcher.match(topic);
    }),
    [
        true,
        true,
        true,
        false,
        false,
        true,
        false,
        true
    ]
);

# API
*/

/*jslint node: true, nomen: true */
"use strict";

/**
Creates a new qlobber.

@constructor
@param {Object} [options] Configures the qlobber. Use the following properties:

  - `{String} separator` The character to use for separating words in topics. Defaults to '.'. MQTT uses '/' as the separator, for example.

  - `{String} wildcard` The character to use for matching exactly one word in a topic. Defaults to '*'. MQTT uses '+', for example.
*/
function Qlobber (options)
{
    options = options || {};

    this._separator = options.separator || '.';
    this._wildcard = options.wildcard || '*';
    this._trie = {};
}

Qlobber.prototype._add = function (i, words, sub_trie)
{
    var st, word;

    if (i === words.length)
    {
        st = sub_trie[this._separator];
        
        if (!st)
        {
            sub_trie[this._separator] = true;
        }
        
        return;
    }

    word = words[i];
    st = sub_trie[word];
    
    if (!st)
    {
        st = sub_trie[word] = {};
    }
    
    this._add(i + 1, words, st);
};

Qlobber.prototype._remove = function (i, words, sub_trie)
{
    var st, word;

    if (i === words.length)
    {
        delete sub_trie[this._separator];
        return;
    }
    
    word = words[i];
    st = sub_trie[word];

    if (!st)
    {
        return;
    }

    this._remove(i + 1, words, st);

    /*jslint forin: true */
    for (word in st)
    {
        return;
    }
    /*jslint forin: false */

    delete sub_trie[word];
};

Qlobber.prototype._match = function (i, words, sub_trie)
{
    var word, st, j, keys, w;


    if (i === words.length)
    {
        st = sub_trie[this._separator];

        return st !== undefined;
    }

    word = words[i];

    /* istanbul ignore if */
    if( word === undefined ) {
        return false;
    }

    st = sub_trie[word];

    if(st && this._match(i + 1, words, st)) {
        return true;
    }

    st = sub_trie[this._wildcard];

    if( st && word !== this._wildcard && this._match(i + 1, words, st)) {
        return true;
    }

    if( word === this._wildcard ) {
        keys = Object.keys(sub_trie);
        for (j = 0; j < keys.length; j += 1)
        {
            w = keys[j];
            if (w !== this._separator && w !== this._wildcard && this._match(i + 1, words, sub_trie[w])) {
                return true;
            }
        }
    }

    return false;
};

/**
Add a topic matcher to the qlobber.

@param {String} topic The topic to match against.
@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.add = function (topic)
{
    this._add(0, topic.split(this._separator), this._trie);
    return this;
};

/**
Remove a topic matcher from the qlobber.

@param {String} topic The topic that's being matched against.
@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.remove = function (topic)
{
    this._remove(0, topic.split(this._separator), this._trie);
    return this;
};

/**
Match a topic.

@param {String} topic The topic to match against.
@return {Boolean} True if topic matches. False otherwise
*/
Qlobber.prototype.match = function (topic)
{
    return this._match(0, topic.split(this._separator), this._trie);
};

/**
Reset the qlobber.

Removes all topic matchers from the qlobber.

@return {Qlobber} The qlobber (for chaining).
*/
Qlobber.prototype.clear = function ()
{
    this._trie = {};
    return this;
};

// for debugging
Qlobber.prototype.get_trie = function ()
{
    return this._trie;
};

exports.Qlobber = Qlobber;

