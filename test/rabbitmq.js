/*globals global */

global.rabbitmq_test_bindings = [
    "a.b.c",
    "a.*.c",
    "a.b.b.c",
    "*.*",
    "a.*",
    "*.b.c",
    "b.b.c",
    "a.b.b",
    "a.b",
    "b.c",
    "",
    "*.*.*",
    "vodka.martini",
    "a.b.c",
    "*"
];

global.rabbitmq_expected_results_before_remove = [
    ["a.b.c",                               true],
    ["a.b",                                 true],
    ["a.c",                                 true],
    ["a.b.b",                               true],
    ["",                                    true],
    ["b.c.c",                               true],
    ["a.a.a.a.a",                           false],
    ["vodka.gin",                           true],
    ["vodka.martini",                       true],
    ["b.b.c",                               true],
    ["nothing.here.at.all",                 false],
    ["oneword",                             true],
    ["one.two.three.four",                  false],
    ["a.b.b.*",                             true],
    ["a.b.*.c",                             true],
    ["a.b.*.d",                             false]
];

global.rabbitmq_bindings_to_remove = [1, 2, 5, 6, 12];

global.rabbitmq_expected_results_after_remove = [
    ["a.b.c",                               false],
    ["a.b",                                 true],
    ["a.c",                                 true],
    ["a.b.b",                               true],
    ["",                                    true],
    ["b.c.c",                               false],
    ["a.a.a.a.a",                           false],
    ["vodka.gin",                           true],
    ["vodka.martini",                       true],
    ["b.b.c",                               true],
    ["nothing.here.at.all",                 false],
    ["oneword",                             true],
    ["one.two.three.four",                  false],
    ["a.b.b.*",                             true],
    ["a.b.*.c",                             true],
    ["a.b.*.d",                             false]
];

global.rabbitmq_expected_results_after_clear = [
    ["a.b.c",                               false],
    ["a.b",                                 false],
    ["a.c",                                 false],
    ["a.b.b",                               false],
    ["",                                    false],
    ["b.c.c",                               false],
    ["a.a.a.a.a",                           false],
    ["vodka.gin",                           false],
    ["vodka.martini",                       false],
    ["b.b.c",                               false],
    ["nothing.here.at.all",                 false],
    ["oneword",                             false],
    ["one.two.three.four",                  false],
    ["a.b.b.*",                             false],
    ["a.b.*.c",                             false],
    ["a.b.*.d",                             false]
];