/**
# qlobber&nbsp;&nbsp;&nbsp;[![Build Status](https://travis-ci.org/davedoesdev/qlobber.png)](https://travis-ci.org/davedoesdev/qlobber) [![Coverage Status](https://coveralls.io/repos/davedoesdev/qlobber/badge.png?branch=master)](https://coveralls.io/r/davedoesdev/qlobber?branch=master) [![NPM version](https://badge.fury.io/js/qlobber.png)](http://badge.fury.io/js/qlobber)

Node.js globbing for amqp-like topics.

Example:

```javascript
var Qlobber = require('qlobber').Qlobber;
var matcher = new Qlobber();
matcher.add('foo.*', 'it matched!');
assert.deepEqual(matcher.match('foo.bar'), ['it matched!']);
```

The API is described [here](#tableofcontents).

qlobber is implemented using a trie, as described in the RabbitMQ blog posts [here](http://www.rabbitmq.com/blog/2010/09/14/very-fast-and-scalable-topic-routing-part-1/) and [here](http://www.rabbitmq.com/blog/2011/03/28/very-fast-and-scalable-topic-routing-part-2/).

## Installation

```shell
npm install qlobber
```

## Another Example

A more advanced example using topics from the [RabbitMQ topic tutorial](http://www.rabbitmq.com/tutorials/tutorial-five-python.html):

```javascript
var matcher = new Qlobber();
matcher.add('*.orange.*', 'Q1');
matcher.add('*.*.rabbit', 'Q2');
matcher.add('lazy.#', 'Q2');
assert.deepEqual(['quick.orange.rabbit',
                  'lazy.orange.elephant',
                  'quick.orange.fox',
                  'lazy.brown.fox',
                  'lazy.pink.rabbit',
                  'quick.brown.fox',
                  'orange',
                  'quick.orange.male.rabbit',
                  'lazy.orange.male.rabbit'].map(function (topic)
                  {
                      return matcher.match(topic).sort();
                  }),
                 [['Q1', 'Q2'],
                  ['Q1', 'Q2'],
                  ['Q1'],
                  ['Q2'],
                  ['Q2', 'Q2'],
                  [],
                  [],
                  [],
                  ['Q2']]);
```

## Licence

[MIT](LICENCE)

## Tests

qlobber passes the [RabbitMQ topic tests](https://github.com/rabbitmq/rabbitmq-server/blob/master/src/rabbit_tests.erl) (I converted them from Erlang to Javascript).

To run the tests:

```shell
grunt test
```

## Lint

```shell
grunt lint
```

## Code Coverage

```shell
grunt coverage
```

[Instanbul](http://gotwarlost.github.io/istanbul/) results are available [here](http://rawgit.davedoesdev.com/davedoesdev/qlobber/master/coverage/lcov-report/index.html).

Coveralls page is [here](https://coveralls.io/r/davedoesdev/qlobber).

## Benchmarks

```shell
grunt bench
```

qlobber is also benchmarked in [ascoltatori](https://github.com/mcollina/ascoltatori).

# API
*/

/*jslint node: true, nomen: true */
"use strict";

/**
Creates a new qlobber.

@constructor
@param {Object} [options] Configures the qlobber. Use the following properties:

  - `{String} separator` The character to use for separating words in topics. Defaults to '.'. MQTT uses '/' as the separator, for example.

  - `{String} wildcard_one` The character to use for matching exactly one word in a topic. Defaults to '*'. MQTT uses '+', for example.

  - `{String} wildcard_some` The character to use for matching zero or more words in a topic. Defaults to '#'. MQTT uses '#' too.
*/
function Qlobber (options)
{
    options = options || {};

    this._separator = options.separator || '.';
    this._wildcard = options.wildcard_one || '*';
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
    // console.log(i, words)
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

Note you can match more than one value against a topic by calling `add` multiple times with the same topic and different values.

@param {String} topic The topic to match against.
@param {Any} val The value to return if the topic is matched. `undefined` is not supported.
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
@param {Any} [val] The value that's being matched. If you don't specify `val` then all matchers for `topic` are removed.
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
@return {Array} List of values that matched the topic. This may contain duplicates.
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

