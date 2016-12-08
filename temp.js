// # simplest compiler

// ## Parsing

// ### *Lexical Analysis*
function tokenizer(input) {
    var current = 0;
    var tokens = [];
    while (current < input.length) {
        var char = input[current];
        if (char === '(' || char === ')') {
            tokens.push({
                type: 'paren',
                value: char
            });

            current++;
            continue;
        }

        var WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        var NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            var value = '';
            while(NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }

            tokens.push({
                type: 'number',
                value: value
            });
            continue;
        }

        var LETTERS = /[a-z]/i;
        if (LETTERS.test(char)) {
          var value = '';

          // Again we're just going to loop through all the letters pushing them to
          // a value.
          while (LETTERS.test(char)) {
            value += char;
            char = input[++current];
          }

          // And pushing that value as a token with the type `name` and continuing.
          tokens.push({
            type: 'name',
            value: value
          });

          continue;
        }

        throw new TypeError('I dont know what this character is: ' + char);

    }
    return tokens;
}

// ### *Syntactic Analysis* 
function parser(tokens) {
    var current = 0;

    function walk() {
        var token = tokens[current];
        if (token.type === 'number') {
            current++;
            return {
                type: 'NumberLiteral',
                value: token.value
            };
        }

        if (token.type === 'paren' && token.value === '(') {
            token = tokens[++current];

            var node = {
                type: 'CallExpression',
                name: token.value,
                params: []
            };

            token = tokens[++current];
            while ((token.type !== 'paren') ||
                (token.type === 'paren' && token.value !== ')')
            ) {
                node.params.push(walk());
                token = tokens[current];
            } 

            current++;
            return node;
        }

        throw new TypeError(token.type + token.value);
    }

    var ast = {
        type: 'Program',
        body: []
    }

    while (current < tokens.length) {
        ast.body.push(walk());
    }

    return ast;
}

// ## Transformation
function traverser(ast, visitor) {
    
    function traverseArray(array, parent) {
        array.forEach((child) => {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {
        var method = visitor[node.type];
        if (method) {
            method(node, parent);
        }

        switch (node.type) {
            case 'Program':
                traverseArray(node.body, node);
                break;
            case 'CallExpression':
                traverseArray(node.params, node);
                break;
            case 'NumberLiteral':
                break;

            default:
                throw new TypeError(node.type);
        }
    }
    traverseNode(ast, null);
}

function transformer(ast) {
    var newAst = {
        type: 'Program',
        body: []
    };

    ast._context = newAst.body;

    newAst.body.push(1);
    console.log(ast._context);
    process.exit();

    traverser(ast, {
        NumberLiteral: (node, parent) => {
            parent._context.push({
                type: 'NumberLiteral',
                value: node.value
            })
        },

        CallExpression: (node, parent) => {
            var expression = {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: node.name
                },
                arguments: []
            };

            node._context = expression.arguments;

            if (parent.type !== 'CallExpression') {
                expression = {
                    type: 'ExpressionStatement',
                    expression: expression
                };
            }

            parent._context.push(expression);
        }
    });

    return newAst;
}

let input = '(add 2 (substract 40 2))';
let tokens = tokenizer(input);
let ast = parser(tokens);
let newAst = transformer(ast, null);
// console.dir(newAst);