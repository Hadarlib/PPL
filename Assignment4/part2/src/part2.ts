export const MISSING_KEY = '___MISSING_KEY___'
export const MISSING_TABLE_SERVICE = '___MISSING_TABLE_SERVICE___'


export type Table<T> = Readonly<Record<string, Readonly<T>>>

export type TableService<T> = {
    get(key: string): Promise<T>;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
    // optional initialization code
    return {
        get(key: string): Promise<T> {
            return sync().then((updatedTable)=> new Promise<T>((resolve, reject)=>{
                let arr = Object.entries(updatedTable);
                let val = arr.filter((rec) => rec[0] === key);
                if (val.length === 0)
                    reject(MISSING_KEY);
                else
                    resolve(val[0][1]);
            }))
        },
        set(key: string, val: T): Promise<void> {
            return sync().then((updatedTable)=> new Promise<void>((resolve, reject)=>{
                let arr = Object.entries(updatedTable);
                let flag = false;
                let arrFinal = new Array(); 
                for(let rec of arr){
                    if(rec[0] === key){
                        arrFinal.push([key, val]);
                        flag = true;
                    }
                    else
                        arrFinal.push(rec);
                }
                if (!flag){
                    arrFinal.push([key, val]);
                }
                sync(Object.fromEntries(arrFinal));
                resolve();
            }))
        },
        delete(key: string): Promise<void> {
            return sync().then((updatedTable)=>new Promise<void>((resolve, reject)=>{
                let arr = Object.entries(updatedTable);
                let len = arr.length;
                let val = arr.filter((rec) => rec[0] !== key);
                if (arr.length === len)
                    reject(MISSING_KEY);
                else{
                    sync(Object.fromEntries(val));
                    resolve();
                }
            }))
        }

}
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
    let arrFinal = new Array();
    for(let key of keys){
        arrFinal.push(store.get(key))
    }
    return Promise.all(arrFinal);
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
    return typeof obj === 'object' && 'table' in obj
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {
    async function deref(ref: Reference) {
        let tableArr = Object.entries(tables); 
        let tableSer;
        //searching for the specific table
        for (let t of tableArr){
            if(t[0] === ref.table)
                tableSer = t[1];
        }
        if(tableSer !== undefined && tableSer !== null){
            try{//searching for specific record and recursive call on record fields values
                let data : any = await tableSer.get(ref.key); 
                let dataArr : [string,any][]= Object.entries(data); 
                for(let rec of dataArr)
                    if(isReference(rec[1])){
                        data[rec[0]] = await deref(rec[1]);
                    }
                    return Promise.resolve(data);             
            }
            catch{//record wasn't found
                return Promise.reject(MISSING_KEY);
            }   
        }
        else{ //table is missing
            return Promise.reject(MISSING_TABLE_SERVICE);
        }
    }
    return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let g1Iter = g1();
        for(let x of g1Iter){
            let g2Iter = g2();
            for(let y of g2Iter){
                yield[x,y];
            }
        }
    }
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let g1Iter = g1();
        let g2Iter = g2();
        while(true){
            let x = g1Iter.next();
            let y = g2Iter.next();
            if(!x.done){
                yield[x.value,y.value];  
            }
            else
                break;
        }  
    }
}

// Q 2.4
export type ReactiveTableService<T> = {
    get(key: string): T;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
    subscribe(observer: (table: Table<T>) => void): void
}

export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean): Promise<ReactiveTableService<T>> {
    // optional initialization code
    let _table: Table<T> = await sync();
    let observerArr : ((table: Table<T>) => void)[]= new Array();
    const handleMutation = async (newTable: Table<T>) => {
        if(optimistic){
            for(let func of observerArr) //anyway call the observers
                func(newTable);
            try{ // optimistic try- sync new table
                await sync(newTable);
                _table = newTable;
            }
            catch{ // if sync fails - revert old version of the table
                for(let func of observerArr)
                    func(_table);
                throw ("__EXPECTED_FAILURE__");
            }
        }
        else{// if optimistic key is false
            try{ // first try to sync and if works - continue 
                await sync(newTable);
                for(let func of observerArr)
                    func(newTable);
                _table = newTable;
            }
            catch{
                throw ("__EXPECTED_FAILURE__");
            }
        }
    }
    return {
        get(key: string): T {
            if (key in _table) {
                return _table[key]
            } else {
                throw MISSING_KEY;
            }
        },
        set(key: string, val: T): Promise<void> { //from 2.1
            let arr = Object.entries(_table);
            let flag = false;
            let arrFinal = new Array(); 
            for(let rec of arr){
                if(rec[0] === key){
                    arrFinal.push([key, val]);
                    flag = true;
                }
                else
                    arrFinal.push(rec);
            }
            if (!flag){
                arrFinal.push([key, val]);
            }
            let updatedTable = Object.fromEntries(arrFinal);
            return handleMutation(updatedTable);
        },
        delete(key: string): Promise<void> { //from 2.1
            let arr = Object.entries(_table);
            let len = arr.length;
            let val = arr.filter((rec) => rec[0] !== key);
            let updatedTable = Object.fromEntries(val);
            return handleMutation(updatedTable);
        },
        subscribe(observer: (table: Table<T>) => void): void {
            observerArr.push(observer);
        }
    }
}