import {  Exp, isExp, isProgram, Program, makeProgram, isLetPlusExp, LetPlusExp, isCExp, isDefineExp, makeDefineExp, CExp, isAtomicExp, isLitExp, isIfExp, makeIfExp, makeAppExp, isAppExp, isProcExp, isLetExp, makeProcExp, LetExp, AppExp, makeLetExp, makeLetPlusExp } from "./L31-ast";
import { map, pipe, zipWith } from "ramda";
import { Result, makeOk, makeFailure, bind, mapResult, mapv } from "../shared/result";

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>{
    return makeOk(rewriteAllLetPlus(exp));
}
   

const rewriteLetPlus = (e: LetPlusExp): LetExp => {
    if (e.bindings.length == 1)
        return makeLetExp(e.bindings, e.body);
    else 
        return makeLetExp([e.bindings[0]], [rewriteLetPlus(makeLetPlusExp(e.bindings.slice(1,e.bindings.length), e.body))]);  
}
    
/*
Purpose: rewrite all occurrences of let in an expression to lambda-applications.
Signature: rewriteAllLet(exp)
Type: [Program | Exp -> Program | Exp]
*/
export const rewriteAllLetPlus = (exp: Program | Exp): Program | Exp =>
    isExp(exp) ? rewriteAllLetPlusExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllLetPlusExp, exp.exps)) :
    exp;

const rewriteAllLetPlusExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllLetPlusCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllLetPlusCExp(exp.val)) :
    exp;

const rewriteAllLetPlusCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllLetPlusCExp(exp.test),
                                rewriteAllLetPlusCExp(exp.then),
                                rewriteAllLetPlusCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllLetPlusCExp(exp.rator),
                                map(rewriteAllLetPlusCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllLetPlusCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings, map(rewriteAllLetPlusCExp, exp.body)) :
    isLetPlusExp(exp) ? rewriteAllLetPlusCExp(rewriteLetPlus(exp)) :
    exp;