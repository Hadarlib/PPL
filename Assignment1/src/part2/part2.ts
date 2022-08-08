import { access } from "fs/promises";
import * as R from "ramda";


const stringToArray = R.split("");

/* Question 1 */
export const countLetters: (s: string) => {[index:string] : number} = (s) =>{
    let stringArr:string[] = stringToArray(s);
    return R.countBy(R.toLower)(stringArr.filter(c => c !== ' '));
}

/* Question 2 */
export const isPaired: (s: string) => boolean = (s) => {
    let stringArr : string[] = stringToArray(s);
    const filteredArr =  stringArr.filter(c =>  c === "(" || c ==="{" || c ==="[" || c === ")" || c ==="}" || c ==="]"); 
    const indicatorArr = R.reduce((acc, cur)=>{
        if ( cur === "(" || cur ==="{" || cur ==="[" )
           return acc.concat([cur]);
        else if (cur === ")" || cur ==="}" || cur ==="]"){
            if(acc[acc.length-1] === "(" && cur === ")")
                return acc.slice(0,-1);
            else if(acc[acc.length-1] === "{" && cur === "}")
                return acc.slice(0,-1);
            else if(acc[acc.length-1] === "[" && cur === "]")
                return acc.slice(0,-1);
            else
                return acc.concat([cur]);
        }     
    },[], filteredArr);
    return indicatorArr.length === 0;
}

/* Question 3 */
export interface WordTree {
    root: string;
    children: WordTree[];
}

export const treeToSentence = (t: WordTree): string =>{
    return t.root + R.reduce((acc, cur) =>  acc + " " + treeToSentence(cur), "" , t.children);   
}



