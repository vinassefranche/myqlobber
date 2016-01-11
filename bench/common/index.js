/*globals rabbitmq_test_bindings: false,
          rabbitmq_bindings_to_remove: false,
          rabbitmq_expected_results_before_remove: false,
          rabbitmq_expected_results_after_remove: false,
          options: false */
/*jslint node: true */
"use strict";

var expect = require('chai').expect;
require('../../test/rabbitmq.js');

function remove_duplicates_filter(item, index, arr)
{
    return item !== arr[index - 1];
}

exports.add_bindings = function(matcher)
{
    var i, topic_val;

    for (i = 0; i < rabbitmq_test_bindings.length; i += 1)
    {
        topic_val = rabbitmq_test_bindings[i];
        matcher.add(topic_val);
    }
};

exports.match = function(matcher)
{
    var i, test, val;

    for (i = 0; i < rabbitmq_expected_results_before_remove.length; i += 1)
    {
        test = rabbitmq_expected_results_before_remove[i];
        val = matcher.match(test[0]);

        if (options.check)
        {
            expect(val).to.eql(test[1]);
        }
    }
};

exports.remove_bindings = function(matcher)
{
    var i, r, test;

    for (i = 0; i < rabbitmq_bindings_to_remove.length; i += 1)
    {
        r = rabbitmq_test_bindings[rabbitmq_bindings_to_remove[i] - 1];
        matcher.remove(r);
    }

    if (options.check)
    {
        for (i = 0; i < rabbitmq_expected_results_after_remove.length; i += 1)
        {
            test = rabbitmq_expected_results_after_remove[i];
            expect(matcher.match(test[0])).to.eql(test[1]);
        }
    }
};

