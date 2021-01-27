'use strict';
const { spawn } = require('child_process');


const getLambdas = (profile) => new Promise((resolve, reject) => {
    try {
        const child = spawn('aws', [
            '--profile', profile,
            `lambda`, 
            'list-functions',
            '--no-paginate',
            '--max-items', '50' // max/default is 50 :/
        ]);

        const rawStrings = [];
        
        const onChildStdout = data => {
            rawStrings.push(data.toString('utf8'));
        };

        const onChildClose = close => {
            try {
                const fullString = rawStrings.join('');
                const resultParsed = JSON.parse(fullString);
                const { Functions } = resultParsed;
                resolve(Functions);
            } catch(error) {
                reject(error);
            }
        };

        child.stdout.on('data', onChildStdout);
        child.stderr.on('data', data => console.log(data.toString('utf8')));
        child.on('error', error => reject(error));
        child.on('close', onChildClose);
    } catch(error) {
        reject(error);
    }
});

const deleteLambda = (profile, functionName) => new Promise((resolve, reject) => {
    try {
        const child = spawn('aws', [
            '--profile', profile,
            `lambda`, 
            'delete-function',
            '--function-name', functionName
        ]);

        const rawStrings = [];
        
        const onChildStdout = data => {
            rawStrings.push(data.toString('utf8'));
        };

        const onChildClose = close => {
            try {
                const fullString = rawStrings.join('');
                resolve(fullString);
            } catch(error) {
                reject(error);
            }
        };

        child.stdout.on('data', onChildStdout);
        child.stderr.on('data', data => console.log(data.toString('utf8')));
        child.on('error', error => reject(error));
        child.on('close', onChildClose);
    } catch(error) {
        reject(error);
    }
});

const main = async () => {
    try {
        const profile = process.argv[2];
        if(!profile) throw 'Error: please provide an AWS profile';

        console.log(`Using AWS profile ${profile}`); 

        console.log(`Retrieving list of lambda from AWS profile ${profile}...`);
        const lambdas = await getLambdas(profile);
        const onlyNames = lambdas.map( fun => fun.FunctionName);

        console.log(`Lambdas retrieved: ${lambdas.length}`); 

        for(const [index, lambdaName] of Object.entries(onlyNames)) {
            console.log(`${Number(index) + 1}/${lambdas.length} deleting lambda ${lambdaName}...`)
            await deleteLambda(profile, lambdaName); // We could Promise.all but let's do it slowly
        }
        console.log(`All completed`);
    } catch(error) {
        console.log(error);
    }
};

main();