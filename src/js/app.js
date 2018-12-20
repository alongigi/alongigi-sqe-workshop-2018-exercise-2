import $ from 'jquery';
import {substituteSymbols, substituteStatement, parseExpression, parseCode} from './symbolic-substituter';

function parseConditions(inputCode, inputVector) {
    let parsed = parseCode(inputCode);
    let conditions = [];
    let variables = {};
    substituteStatement(parsed, variables, inputVector, conditions);
    let res = [];
    for (let i = 0; i < conditions.length; i++)
        res.push([eval(parseExpression(parseCode(conditions[i][0]).body[0].expression, Object.assign(inputVector, variables))), conditions[i][1]]);
    return res;
}

function colorStatements(parsedCode, rows) {
    let conditions = ['if', 'while', 'else'];
    let color;
    for (let i = 0, rowIndex = 0; i < parsedCode.length; i++)
        if (conditions.some(el => parsedCode[i].includes(el))) {
            if(rows[rowIndex][0]) color = 'green';
            else color = 'red';
            parsedCode[i] = '<mark class="{}">{}</mark>'.format(color, parsedCode[i]);
            rowIndex++;
        }
}

function parseArguments(input) {
    let args = {};
    let array = input.indexOf('[');
    let end = input.indexOf(',');
    while(end !== -1){
        if(!(array === -1 || end < array)) end = input.indexOf(']', array) + 1;
        args[input.slice(0, end).trim().split('=')[0].trim()] = eval(input.slice(0, end).trim().split('=')[1]);
        input = input.slice(end + 1);
        array = input.indexOf('[');
        end = input.indexOf(',');
    }
    args[input.split('=')[0].trim()] = eval(input.split('=')[1]);
    return args;
}

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = substituteSymbols(codeToParse).split('\n');
        colorStatements(parsedCode, parseConditions(codeToParse, parseArguments($('#inputVector').val())));
        $('#codeParseResults').html('<div>'+ parsedCode.join('<p></p>') +'</div>');
    });
});