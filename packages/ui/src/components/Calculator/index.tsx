import React, { useState, useEffect } from 'react';
import debug from 'denbug';
import './Calculator.css';

// Multiple trace domains for different aspects
let ui_de = false;
let calc_de = false;
let mem_de = false;

const bug_ui = debug.domain("calculator.ui", 
    () => ui_de, 
    val => { ui_de = val; console.log("UI tracing:", val); }
);
const bug_calc = debug.domain("calculator.ops", 
    () => calc_de, 
    val => { calc_de = val; console.log("Calc tracing:", val); }
);
const bug_mem = debug.domain("calculator.memory", 
    () => mem_de, 
    val => { mem_de = val; console.log("Memory tracing:", val); }
);

type NumberBase = 'dec' | 'hex' | 'bin';

export const Calculator: React.FC = () => {
  const [stack, setStack] = useState<string[]>(['0']);  // The stack
  const [input, setInput] = useState('0');              // Current input buffer
  const [base, setBase] = useState<NumberBase>('dec');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Enable calculator domains
    debug.enable("calculator.ui");
    debug.enable("calculator.ops");
    debug.enable("calculator.memory");
    // Enable console logging
    debug.enable("de&&bug.console");
    
    return () => {
        debug.disable("calculator.ui");
        debug.disable("calculator.ops");
        debug.disable("calculator.memory");
        debug.disable("de&&bug.console");
    };
}, []);

  const formatNumber = (num: number): string => {
    ui_de&&bug_ui("format", { num, base });
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
    calc_de&&bug_calc("parse", { input, base });
    if (input.startsWith('0x')) return parseInt(input.slice(2), 16);
    if (input.startsWith('0b')) return parseInt(input.slice(2), 2);
    return parseInt(input, 10);
  };

  const pushToStack = () => {
    calc_de&&bug_calc("stack.push", { value: input });
    setStack(prev => [...prev, input]);
    setInput('0');
  };

  const calculate = (op: string) => {
    calc_de&&bug_calc("operation", { op, stack, input });
    
    const newStack = [...stack];
    const b = parseInput(input);  // Current input is always the second operand

    switch(op) {
      case 'NOT':  // Unary operator
        setInput(formatNumber(~b));
        break;
        
      case 'LSH': case 'RSH':  // Unary shift operators
        setInput(formatNumber(op === 'LSH' ? b << 1 : b >> 1));
        break;

      case 'AND': case 'OR': case 'XOR':  // Binary operators
        if (newStack.length < 1) return;  // Need at least one value on stack
        const a = parseInput(newStack.pop()!);
        const result = op === 'AND' ? a & b :
                      op === 'OR'  ? a | b :
                                    a ^ b;
        setInput(formatNumber(result));
        break;

      case 'DUP':  // Duplicate top stack value
        if (input !== '0') {  // If there's input, push it
          newStack.push(input);
        } else if (newStack.length > 0) {  // Otherwise duplicate top of stack
          newStack.push(newStack[newStack.length - 1]);
        }
        break;

      case 'SWAP':  // Swap top two items
        if (input !== '0') {  // If there's input, swap with top of stack
          if (newStack.length > 0) {
            const temp = newStack.pop()!;
            newStack.push(input);
            setInput(temp);
          }
        } else if (newStack.length > 1) {  // Otherwise swap top two stack items
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

      case 'C':  // Clear all
        setStack(['0']);
        setInput('0');
        return;

      case 'ENTER':  // Push input to stack
        if (input !== '0') {
          newStack.push(input);
          setInput('0');
        }
        break;
    }
    
    setStack(newStack);
  };

  const handleBaseChange = (newBase: NumberBase) => {
    ui_de&&bug_ui("base.change", { from: base, to: newBase, input });
    setBase(newBase);
  };

  const appendDigit = (digit: string) => {
    ui_de&&bug_ui("append.digit", { digit, current: input });
    setInput(input === '0' ? digit : input + digit);
  };

  return (
    <div className="calculator">
      <div className="calc-body">
        <div className="stack-display">
          {stack.map((value, i) => (
            <div key={i} className="stack-item">
              {stack.length - 1 - i}: {value}
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