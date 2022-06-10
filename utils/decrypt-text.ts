import readline from 'readline';
import { decrypt } from './encryption';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the text for decryption: ', function (text) {
  rl.question('Password: ', function (password) {
    rl.close();
    console.log(decrypt(text, password));
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
