/*globals rabbitmq_test_bindings : false,
          rabbitmq_bindings_to_remove : false,
          rabbitmq_expected_results_before_remove: false,
          rabbitmq_expected_results_after_remove : false,
          rabbitmq_expected_results_after_clear : false,
          describe: false,
          beforeEach: false,
          it: false */
/*jslint node: true */
"use strict";

var expect = require('chai').expect,
    qlobber = require('..');

describe('qlobber', function ()
{
    var matcher;

    beforeEach(function (done)
    {
        matcher = new qlobber.Qlobber();
        done();
    });

    function add_bindings(bindings, mapper)
    {
        mapper = mapper || function (topic) { return topic; };

        bindings.forEach(function (topic_val)
        {
            matcher.add(mapper(topic_val));
        });
    }

    it('should support adding bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        expect(matcher.get_trie()).to.eql({
            "a":{
                "b":{
                    "c":{
                        ".":true
                    },
                    "b":{
                        "c":{
                            ".":true
                        },
                        ".":true
                    },
                    ".":true
                },
                "*":{
                    "c":{
                        ".":true
                    },
                    ".":true
                }
            },
            "*":{
                "*":{
                    ".":true,
                    "*":{
                        ".":true
                    }
                },
                "b":{
                    "c":{
                        ".":true
                    }
                },
                ".":true
            },
            "b":{
                "b":{
                    "c":{
                        ".":true
                    }
                },
                "c":{
                    ".":true
                }
            },
            "":{
                ".":true
            },
            "vodka":{
                "martini":{
                    ".":true
                }
            }
        });
    });

    it('should pass rabbitmq test', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        rabbitmq_expected_results_before_remove.forEach(function (test)
        {
            expect(matcher.match(test[0])).to.eql(test[1]);
        });
    });

    it('should support removing bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        rabbitmq_bindings_to_remove.forEach(function (i)
        {
            matcher.remove(rabbitmq_test_bindings[i-1]);
        });

        expect(matcher.get_trie()).to.eql({
            "a":{
                "b":{
                    "b":{
                        "c":{
                            ".":true
                        },
                        ".":true
                    },
                    ".":true
                }
            },
            "*":{
                "*":{
                    ".":true
                },
                ".":true
            },
            "b":{
                "b":{
                    "c":{
                        ".":true
                    }
                },
                "c":{
                    ".":true
                }
            },
            "":{
                ".":true
            },
            "vodka":{
                "martini":{
                    ".":true
                }
            }
        });

        rabbitmq_expected_results_after_remove.forEach(function (test)
        {
            expect(matcher.match(test[0])).to.eql(test[1]);
        });
        
        /*jslint unparam: true */
        var remaining = rabbitmq_test_bindings.filter(function (topic_val, i)
        {
            return rabbitmq_bindings_to_remove.indexOf(i + 1) < 0;
        });
        /*jslint unparam: false */

        remaining.forEach(function (topic_val)
        {
            matcher.remove(topic_val);
        });
            
        expect(matcher.get_trie()).to.eql({});

        rabbitmq_expected_results_after_clear.forEach(function (test)
        {
            expect(matcher.match(test[0])).to.eql(test[1]);
        });
    });

    it('should support clearing the bindings', function ()
    {
        add_bindings(rabbitmq_test_bindings);

        matcher.clear();

        rabbitmq_expected_results_after_clear.forEach(function (test)
        {
            expect(matcher.match(test[0])).to.eql(test[1]);
        });
    });

    it('should pass example in README', function ()
    {
        matcher.add('foo.*');
        expect(matcher.match('foo.bar')).to.eql(true);
    });

    it.skip('should pass example in rabbitmq topic tutorial', function ()
    {
	    matcher.add('*.orange.*', 'Q1');
        matcher.add('*.*.rabbit', 'Q2');
        matcher.add('lazy.#', 'Q2');
        expect(['quick.orange.rabbit',
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
                })).to.eql(
               [['Q1', 'Q2'],
                ['Q1', 'Q2'],
                ['Q1'],
                ['Q2'],
                ['Q2', 'Q2'],
                [],
                [],
                [],
                ['Q2']]);
    });

    it('should not remove anything if not remove twice', function ()
    {
        matcher.add('foo.*');
        matcher.add('foo.bar');
        matcher.remove('foo');
        matcher.remove('foo.*');
        matcher.remove('bar.*');
        expect(matcher.match('foo.bar')).to.eql(true);
        expect(matcher.match('foo.blabla')).to.eql(false);
    });

    it('should be configurable', function ()
    {
        matcher = new qlobber.Qlobber({
            separator: '/',
            wildcard_one: '+'
        });

        matcher.add('foo/+');
        expect(matcher.match('foo/bar')).to.eql(true);

    });
});

