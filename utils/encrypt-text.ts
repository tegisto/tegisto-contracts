import readline from 'readline';
import { encrypt } from './encryption';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the text for encryption: ', function (text) {
  rl.question('Password: ', function (password) {
    rl.close();
    console.log(encrypt('envval:' + text, password));
  });
});

/*
import childProcess from 'child_process'

const displayProcessBy = () => {
  const a = childProcess.execFileSync('ps', ['o', 'pid,ppid,uid,gid,command,sess,tsess,start'])
  a.toString().split('\n').forEach(line => {
    console.log(line)
  })
}

console.log(process.pid)

displayProcessBy()
*/
