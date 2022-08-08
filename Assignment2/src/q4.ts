import { Exp, Program, isProgram, isDefineExp, makeDefineExp, CExp, isAtomicExp, isLitExp, isIfExp, makeIfExp, makeAppExp, isAppExp, isProcExp, isLetExp, makeProcExp, LetExp, AppExp, makeLetExp, LitExp, Binding, ProcExp, VarDecl, isBoolExp, isNumExp, isStrExp, isVarRef, isPrimOp, isVarDecl} from '../imp/L3-ast';
import { Result, makeFailure, makeOk , bind, mapResult, safe2} from '../shared/result';
import { isSymbolSExp, isEmptySExp, valueToString } from '../imp/L3-value';
import { map } from 'ramda';

/*
Purpose: Transform L3 AST to JavaScript program string
Signature: l30ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l30ToJS = (exp: Exp | Program): Result<string>  => 
    unparseL30(exp);

    
const unparseLitExp = (le: LitExp): string =>
    isEmptySExp(le.val) ? `'()` :
    isSymbolSExp(le.val) ? `Symbol.for("${valueToString(le.val)}")` :
    `${le.val}`;

const unparseLetExp = (le: LetExp) : Result<string> => { 
    const vars = map((b) => b.var, le.bindings);
    const vals = map((b) => b.val, le.bindings);
    return unparseL30(makeAppExp(
        makeProcExp(vars, le.body),
        vals));
}

export const unparseL30 = (exp: Program | Exp): Result<string> =>
    isBoolExp(exp) ? makeOk(exp.val ? 'true' : 'false') :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isStrExp(exp) ? makeOk(`"${exp.val}"`) :
    isLitExp(exp) ? makeOk(unparseLitExp(exp)) :
    isVarRef(exp) ? makeOk(exp.var) :
    isProcExp(exp) ? bind(unparseL30(exp.body[0]), body => makeOk("("  + "(" + 
    map((p) => p.var, exp.args).join(",") +")" + " => " + body + ")")) :
    isIfExp(exp) ? safe3((test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`))
        (unparseL30(exp.test), unparseL30(exp.then), unparseL30(exp.alt)) :        
    isAppExp(exp) ?  unparseAppExp(exp) :
    isPrimOp(exp) ? unparseOp(exp.op) :
    isLetExp(exp) ? unparseLetExp(exp) :
    isDefineExp(exp) ? bind(unparseL30(exp.val), val => makeOk(`const ${exp.var.var} = ${val}`)) :
    isProgram(exp) ?  bind(mapResult(unparseL30, exp.exps), exps => makeOk(exps.join(";\n"))): 
    makeFailure("Error");

const unparseAppExp = (pe: AppExp): Result<string> => 
    isPrimOp(pe.rator) ?
        (
        pe.rator.op === "not" ?  bind(mapResult(unparseL30,pe.rands), rands => makeOk(`(!${rands[0]})`)) :      
        pe.rator.op === "number?" || pe.rator.op === "boolean?"  || pe.rator.op === "symbol?" ? bind(unparseL30(pe.rands[0]), rands => makeOk(`${unparseL30(pe.rator)}(${pe.rands[0]})`)) :

        safe2((rator: string, rands: string[]) => makeOk("(" + rands.join(" " + (rator) + " ") + ")")) //the last rator without unparse
        (unparseL30(pe.rator), mapResult(unparseL30, pe.rands))
        ):
    safe2((rator: string, rands: string[]) =>
    makeOk(`${rator}(${rands.join(",")})`))
    (unparseL30(pe.rator), mapResult(unparseL30, pe.rands));
     

const unparseOp = (op : string) : Result<string> =>
    op === "=" || op === "eq?" || op === "string=?" ? makeOk("===") :
    op === "number?" ? makeOk("((x) => (typeof (x) ===  number))") : 
    op === "boolean?" ? makeOk("((x) => (typeof (x) === boolean))") :
    op === "string?" ? makeOk("((x) => (typeof (x) === string))") :
    op === "symbol?" ? makeOk("((x) => (typeof (x) === symbol))") :
    op === "and" ? makeOk("&&") :
    op === "or" ? makeOk("||") :
    op === "not" ? makeOk("!") :
    makeOk(op);

const safe3 = <T1, T2, T3, T4>(f: (x: T1, y: T2, z: T3) => Result<T4>): (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => Result<T4> =>
    (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) =>
        bind(xr, (x: T1) => bind(yr, (y: T2) => bind(zr, (z: T3) => f(x, y, z))));