import assert from 'assert';
import {parseCode, getCode, substituteSymbols} from '../src/js/symbolic-substituter';

describe('The function declaration', () => {
    it('is parsing a function declaration with arguments', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                }`))
        );
    });

    it('is parsing a function declaration without arguments', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            }`),
            getCode(parseCode(`
            function binarySearch(){
            }`))
        );
    });
});


describe('The variable declaration', () => {
    it('is parsing a variable declaration with value', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                let a = 10;
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                }`))
        );
    });

    it('is parsing a variable declaration without value', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            let a;
            }`),
            getCode(parseCode(`
            function binarySearch(){
            }`))
        );
    });
});

describe('The assignment expression', () => {
    it('is parsing a simple assignment expression', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                a = 17;
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                }`))
        );
    });

    it('is parsing a complex assignment expression', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            a = x + y + z;
            }`),
            getCode(parseCode(`
            function binarySearch(){
            }`))
        );
    });
});

describe('The if statement', () => {
    it('is parsing a simple if statement', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                if(a < b){}
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                if(a < b){}
                }`))
        );
    });

    it('is parsing a complex if statement', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            if (x < y){
            x = x + 1;
            }
            }`),
            getCode(parseCode(`
            function binarySearch(){
            if (x < y){}
            }`))
        );
    });
});

describe('The if else statement', () => {
    it('is parsing a simple if else statement', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                if (a < b){
                a = b - 1;
                }
                else if (b > a){
                b = a + 1;
                }
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                if(a < b){
                }else if (b > a){
                }
                }`))
        );
    });

    it('is parsing a complex if else statement', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            if (x > y){
            y = y * 2;
            }else if (x < y){
            x = x * 2;
            }else{
            y = x * y;
            }
            }`),
            getCode(parseCode(`
            function binarySearch(){
            if (x > y){
            }else if (x < y){
            }else{
            }
            }`))
        );
    });
});

describe('The while statement', () => {
    it('is parsing a simple while statement', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                while(a < b){
                a = a + 1;
                }
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                while(a < b){
                }
                }`))
        );
    });
    it('is parsing a complex while statement', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                while(a < b){
                a = a + 1;
                b = b - 1;
                }
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                while(a < b){
                }
                }`))
        );
    });
});

describe('The return statement', () => {
    it('is parsing a simple return statement', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                if(1 > 2){
                return 1;
                }
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                if(1 > 2){
                return 1;
                }
                }`))
        );
    });

    it('is parsing a complex return statement', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(a){
                let b = 0 + a;
                let c = b + 0;
                return c;
            }
            `),
            getCode(parseCode(`
            function binarySearch(a){
                return a;
            }
            `))
        );
    });
});

describe('The Update Expression', () => {
    it('is parsing an update expression plus', () => {
        assert.equal(
            substituteSymbols(
                `function binarySearch(X, V, n){
                let y = 3;
                y++;
                }`
            ),
            getCode(parseCode(`function binarySearch(X, V, n){
                }`))
        );
    });

    it('is parsing an update expression minus', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(){
            let z = 5;
            z--;
            }`),
            getCode(parseCode(`
            function binarySearch(){
            }`))
        );
    });
});

describe('The array expression', () => {
    it('is parsing a simple array expression', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(X, V, n){
                let a = [1,2,3];
                a[1] = 2;
                return a[1];
            }
            `, {x: 1, y: 7, z: 2}),
            getCode(parseCode(`
            function binarySearch(X, V, n){
                return 2;
            }
            `))
        );
    });

    it('is parsing a complex array expression', () => {
        assert.equal(
            substituteSymbols(`
            function binarySearch(X, V, n){
                let a = [1,2,3,4,5];
                x[1] = 3;
                return x[1];
            }
            `, {x: [1], y: 4, z: 2}),
            getCode(parseCode(`
            function binarySearch(X, V, n){
                x[1] = 3;
                return x[1];
            }
            `))
        );
    });
});

describe('The full function', () => {
    it('is parsing full function while', () => {
        assert.equal(
            substituteSymbols(`
            function foo(x, y, z){
                let a = x + 1;
                let b = a + y;
                let c = 0;
                let z;
                while (a < z) {
                    c = a + b;
                    z = c * 2;
                }
                return z;
            }
            `, {x: 1, y: 2, z: 3}),
            getCode(parseCode(`
            function foo(x, y, z){
                while (x + 1 < z) {
                    z = (x + 1 + x + 1 + y) * 2;
                }
                return z;
            }
            `))
        );
    });

    it('is parsing full function if', () => {
        assert.equal(
            substituteSymbols(
                `function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;
                    
                    if (b < z) {
                        c = c + 5;
                        return x + y + z + c;
                    } else if (b < z * 2) {
                        c = c + x + 5;
                        return x + y + z + c;
                    } else {
                        c = c + z + 5;
                        return x + y + z + c;
                    }
                }
                `, {x: 1, y: 2, z: 3}),
            getCode(parseCode(`function foo(x, y, z){
                if (x + 1 + y < z) {
                    return x + y + z + 5;
                } else if (x + 1 + y < z * 2) {
                    return x + y + z + x + 5;
                } else {
                    return x + y + z + z + 5;
                }
            }`))
        );
    });
});