import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let parseDataType = {
    'FunctionDeclaration': parseFunctionDeclaration,
    'VariableDeclaration': parseVariableDeclaration,
    'ExpressionStatement': parseExpressionStatement,
    'MemberExpression': parseMemberExpression,
    'WhileStatement': parseWhileStatement,
    'ReturnStatement': parseReturnStatement,
    'BlockStatement': parseBlockStatement,
    'Program': parseBlockStatement,
    'VariableDeclarator': parseVariable,
    'IfStatement': parseIfStatement,
    'Literal': parseLiteral,
    'BinaryExpression': parseBinaryExpression,
    'Identifier': parseIdentifier,
    'LogicalExpression': parseBinaryExpression,
    'ArrayExpression': parseArrayExpression,
    'AssignmentExpression': parseAssignmentExpression,
    'UnaryExpression': parseUnaryExpression,
};

function parseCode(codeToParse) {
    return esprima.parseScript(codeToParse, {loc: true});
}

function getCode(json) {
    return escodegen.generate(json);
}

String.prototype.format = function () {
    let i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return args[i++];
    });
};

function parseExpression(expression, variables) {
    if (expression !== null)
        if (expression.type in parseDataType)
            return parseDataType[expression.type](expression, variables);
        else return '';
    else return '';
}

function parseFunctionDeclaration(parsedCode, variables, inputVector, evaluatedConditions) {
    parsedCode.body = substituteStatement(parsedCode.body, variables, inputVector, evaluatedConditions);
    return parsedCode;
}

function parseVariableDeclaration(parsedCode, variables, evaluatedConditions) {
    parsedCode.declarations = parseStatementList(parsedCode.declarations, variables, evaluatedConditions);
    return null;
}

function parseExpressionStatement(parsedCode, variables, inputVector) {
    let tokens = parseExpression(parsedCode.expression, variables).split(' ');
    if (tokens.length > 1 && (tokens[0] in inputVector || tokens[0].split('[')[0] in inputVector))
        parsedCode.expression = parseCode(parseExpression(parsedCode.expression, variables)).body[0].expression;
    else parsedCode.expression = undefined;
    return parsedCode;
}


function parseMemberExpression(expression, variables) {
    let member = parseExpression(expression.object, variables);
    if (member.indexOf('[') !== -1)
        return '' + eval(member)[parseExpression(expression.property, variables)];
    else return member + '[' + parseExpression(expression.property, variables) + ']';
}

function parseWhileStatement(parsedCode, variables, inputVector, evaluatedConditions, preIfConditions) {
    let condition = parseExpression(parsedCode.test, variables);
    parsedCode.test = parseCode(condition).body[0].expression;
    evaluatedConditions.push([condition, parsedCode.loc.start.line]);
    parsedCode.body = substituteStatement(parsedCode.body, variables, inputVector, evaluatedConditions, preIfConditions);
    return parsedCode;
}

function parseReturnStatement(parsedCode, variables, inputVector) {
    parsedCode.argument = parseCode(parseExpression(parsedCode.argument, variables, inputVector)).body[0].expression;
    return parsedCode;
}

function parseBlockStatement(parsedCode, varMap, inputVector, evaluatedConditions) {
    let varMapCopy = JSON.parse(JSON.stringify(varMap));
    parsedCode.body = parseStatementList(parsedCode.body, varMapCopy, inputVector, evaluatedConditions);
    return parsedCode;
}

function parseVariable(parsedCode, variables) {
    let value = parseExpression(parsedCode.init, variables);
    if (value !== '') variables[parseExpression(parsedCode.id, variables)] = value;
    return parsedCode;
}

function parseLiteral(expression) {
    return expression.raw;
}

function parseUnaryExpression(expression, variables) {
    return ''+ expression.operator +'('+ parseExpression(expression.argument, variables) +')';
}

function parseArrayExpression(expression, variables) {
    let args = [];
    for (let i = 0; i < expression.elements.length; i++)
        args.push(parseExpression(expression.elements[i], variables));
    return '['+ args.join(',') +']';
}

function parseOperatorExpression(expression, right, left){
    if (['/', '*'].includes(expression.operator)) {
        left = left.toString();
        right = right.toString();
        if (left.split(' ').length > 1) left = '('+ left +')';
    }
    return '' + left + ' ' + expression.operator + ' ' + right;
}

function parseBinaryExpression(expression, variables) {
    let left = parseExpression(expression.left, variables);
    let right = parseExpression(expression.right, variables);
    if (left === '0') return right;
    else if (right === '0') return left;
    return parseOperatorExpression(expression, right, left);
}

function parseElements(left, variables, right) {
    let element = left.split('[')[0];
    if (element in variables) {
        let array = eval(variables[element]);
        array[left.split('[')[1].split(']')[0]] = eval(right);
        left = element;
        right = '['+array+']';
    }
    variables[left] = right;
}

function parseAssignmentExpression(parsedCode, variables) {
    let left = parseExpression(parsedCode.left, {});
    let right = parseExpression(parsedCode.right, variables);
    if (left.indexOf('[') !== -1)
        parseElements(left, variables, right);
    variables[left] = right;
    return '' + left + ' ' + parsedCode.operator + ' ' + right;
}

function parseIdentifier(expression, variables) {
    if (expression.name in variables)
        expression.name = variables[expression.name];
    return expression.name;
}

function parseStatementList(statementList, variables, inputVector, evaluatedConditions) {
    let filteredStatements = [];
    for (let i = 0; i < statementList.length; i++) {
        statementList[i] = substituteStatement(statementList[i], variables, inputVector, evaluatedConditions);
        if (statementList[i] !== null && !(statementList[i].type === 'ExpressionStatement' && statementList[i].expression === undefined))
            filteredStatements.push(statementList[i]);
    }
    return filteredStatements;
}

function parseConditions(preConditions, condition, evaluatedConditions, allCondition, parsedCode, variables, inputVector) {
    preConditions.push(condition);
    evaluatedConditions.push([allCondition, parsedCode.loc.start.line]);
    parsedCode.consequent = substituteStatement(parsedCode.consequent, variables, inputVector, evaluatedConditions,preConditions);
    parsedCode.alternate = substituteStatement(parsedCode.alternate, variables, inputVector, evaluatedConditions, preConditions);
    if(parsedCode.alternate && parsedCode.alternate.type !== 'IfStatement') evaluatedConditions.push(['!({})'.format(preConditions.join(' || ')), parsedCode.alternate.loc.start.line]);
    return parsedCode;
}

function parseIfStatement(parsedCode, variables, inputVector, evaluatedConditions, preConditions) {
    let condition = parseExpression(parsedCode.test, variables, false);
    parsedCode.test = parseCode(condition).body[0].expression;
    let allCondition = condition;
    if(preConditions.length > 0)
        allCondition = '!(' + preConditions.join(' || ') + ')' + ' && ' + condition;
    return parseConditions(preConditions, condition, evaluatedConditions, allCondition, parsedCode, variables, inputVector);
}

function substituteStatement(parsedCode, variables, inputVector, evaluatedConditions = [], preIfConditions = []) {
    if (parsedCode !== null && parsedCode.type in parseDataType) {
        parsedCode = parseDataType[parsedCode.type](parsedCode, variables, inputVector, evaluatedConditions, preIfConditions);
        return parsedCode;
    }
    else return parsedCode;
}

function substituteSymbols(inputCode, inputVector = {}) {
    let parsed = parseCode(inputCode);
    substituteStatement(parsed, {}, inputVector);
    return getCode(parsed);
}

export {substituteSymbols, parseCode, getCode, substituteStatement, parseExpression};