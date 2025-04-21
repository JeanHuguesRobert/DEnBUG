import React, { useState, useEffect } from 'react';
import denbug from 'denbug';
import './Calculator.css';

let ui_de = false;
let calc_de = false;
let mem_de = false;

const bug_ui = denbug.domain('ui');
const bug_calc = denbug.domain('calc');
const bug_mem = denbug.domain('mem');

denbug.flag(enabled => { ui_de = enabled })('ui');
denbug.flag(enabled => { calc_de = enabled })('calc');
denbug.flag(enabled => { mem_de = enabled })('mem');

type NumberBase = 'dec' | 'hex' | 'bin';

export const Calculator: React.FC = () => {
  const [stack, setStack] = useState<string[]>(['0']);
  const [input, setInput] = useState('0');
  const [base, setBase] = useState<NumberBase>('dec');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    denbug.enable("ui");
    denbug.enable("calc");
    denbug.enable("mem");
    denbug.enable("de&&bug.console");
    
    return () => {
        denbug.disable("ui");
        denbug.disable("calc");
        denbug.disable("mem");
        denbug.disable("de&&bug.console");
    };
  }, []);

  const formatNumber = (num: number): string => {
    ui_de && bug_ui.trace("format", { num, base });
    switch(base) {
      case 'hex':
        return '0x' + Math.floor(num).toString(16).toUpperCase();
      case 'bin':
        return '0b' + Math.floor(num).toString(2);
      default:
        return num.toString(10);
    }
  };

  const parseInput = (input: string): number => {
    calc_de && bug_calc.trace("parse", { input, base });
    if (input.startsWith('0x')) return parseInt(input.slice(2), 16);
    if (input.startsWith('0b')) return parseInt(input.slice(2), 2);
    return parseFloat(input);
  };

  const handleBaseChange = (newBase: NumberBase) => {
    calc_de && bug_calc.trace("baseChange", { from: base, to: newBase });
    setBase(newBase);
    const num = parseInput(input);
    setInput(formatNumber(num));
    setStack(stack.map(item => formatNumber(parseInput(item))));
  };

  const appendDigit = (digit: string) => {
    calc_de && bug_calc.trace("appendDigit", { digit });
    if (input === '0') {
      setInput(digit);
    } else {
      setInput(input + digit);
    }
  };

  const pushToStack = () => {
    calc_de && bug_calc.trace("push", { value: input });
    if (input !== '0') {
      setStack([...stack, input]);
      setInput('0');
    }
  };

  const calculate = (op: string) => {
    calc_de && bug_calc.trace("calculate", { op });
    const b = parseInput(input);
    const newStack = [...stack];

    switch (op) {
      case 'C':  // Clear
        setInput('0');
        setStack(['0']);
        break;

      case 'DUP':  // Duplicate top item
        if (input !== '0') {  // If there's input, push it
          pushToStack();
        } else if (newStack.length > 0) {  // Otherwise duplicate top stack item
          const top = newStack[newStack.length - 1];
          newStack.push(top);
        }
        break;

      case 'SWAP':  // Swap top two items
        if (input !== '0') {  // If there's input, push it first
          pushToStack();
        }
        if (newStack.length > 1) {
          const a = newStack.pop()!;
          const b = newStack.pop()!;
          newStack.push(a);
          newStack.push(b);
        }
        break;

      case 'DROP':  // Remove top item
        if (input !== '0') {  // If there's input, clear it
          setInput('0');
        } else if (newStack.length > 1) {  // Otherwise drop top stack item
          newStack.pop();
        }
        break;

      case '+': case '-': case '*': case '/':  // Arithmetic operators
        if (newStack.length < 1) return;  // Need at least one value on stack
        const num2 = b;
        const num1 = parseInput(newStack.pop()!);
        const calc = op === '+' ? num1 + num2 :
                    op === '-' ? num1 - num2 :
                    op === '*' ? num1 * num2 :
                    num2 !== 0 ? num1 / num2 : NaN;
        setInput(formatNumber(calc));
        break;

      // Memory operations
      case 'MS':  // Memory Store
        mem_de && bug_mem.trace('store', { value: input });
        localStorage.setItem('calc_memory', input);
        break;

      case 'MR':  // Memory Recall
        const stored = localStorage.getItem('calc_memory');
        if (stored) {
          mem_de && bug_mem.trace('recall', { value: stored });
          setInput(stored);
        }
        break;

      case 'MC':  // Memory Clear
        mem_de && bug_mem.trace('clear');
        localStorage.removeItem('calc_memory');
        break;
    }
    setStack(newStack);
  };

  if (!isVisible) return null;

  return (
    <div className="calculator">
      <div className="calculator-inner">
        <div className="stack">
          {stack.map((item, i) => (
            <div key={i} className="stack-item">
              {item}
            </div>
          ))}
          <div className="stack-item input">
            &gt; {input}
          </div>
        </div>
        
        <div className="base-buttons">
          <button 
            className={base === 'dec' ? 'active' : ''} 
            onClick={() => handleBaseChange('dec')}
          >DEC</button>
          <button 
            className={base === 'hex' ? 'active' : ''} 
            onClick={() => handleBaseChange('hex')}
          >HEX</button>
          <button 
            className={base === 'bin' ? 'active' : ''} 
            onClick={() => handleBaseChange('bin')}
          >BIN</button>
        </div>

        <div className="keypad">
          <div className="digits">
            {[
              '7', '8', '9',
              '4', '5', '6',
              '1', '2', '3',
              'C', '0', 'ENT'
            ].map(key => (
              <button 
                key={key}
                className={`${key === 'ENT' ? 'enter-key' : ''} ${key === 'C' ? 'clear-key' : ''}`}
                onClick={() => {
                  if (key === 'ENT') pushToStack();
                  else if (key === 'C') calculate('C');
                  else appendDigit(key);
                }}
              >{key === 'ENT' ? '↵' : key}</button>
            ))}
          </div>
          <div className="arith-ops">
            <button onClick={() => calculate('+')}>+</button>
            <button onClick={() => calculate('-')}>-</button>
            <button onClick={() => calculate('*')}>×</button>
            <button onClick={() => calculate('/')}>/</button>
          </div>
          <div className="stack-ops">
            <button onClick={() => calculate('DUP')}>DUP</button>
            <button onClick={() => calculate('SWAP')}>SWAP</button>
            <button onClick={() => calculate('DROP')}>DROP</button>
          </div>
          <div className="bit-ops">
            <button onClick={() => calculate('NOT')}>NOT</button>
            <button onClick={() => calculate('AND')}>AND</button>
            <button onClick={() => calculate('OR')}>OR</button>
            <button onClick={() => calculate('XOR')}>XOR</button>
            <button onClick={() => calculate('LSH')}>LSH</button>
            <button onClick={() => calculate('RSH')}>RSH</button>
          </div>
          
          <div className="memory">
            <button onClick={() => calculate('MS')}>MS</button>
            <button onClick={() => calculate('MR')}>MR</button>
            <button onClick={() => calculate('MC')}>MC</button>
            <button onClick={() => calculate('C')}>C</button>
          </div>
        </div>
      </div>
    </div>
  );
};