/*
  Скрипт генерации bcrypt-хэша для вставки в Supabase.
  Использование:
    node scripts/hash-password.js "plainPassword"
  Если пароль не передан как аргумент, скрипт запросит ввод в терминале (скрыто).
*/

const bcrypt = require('bcryptjs');
const readline = require('readline');

async function promptPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.stdoutMuted = true;

    rl.question('Введите пароль: ', (password) => {
      rl.close();
      resolve(password);
    });

    rl._writeToOutput = function _writeToOutput() {
      if (rl.stdoutMuted) rl.output.write('*');
    };
  });
}

(async () => {
  let password = process.argv[2];
  if (!password) {
    password = await promptPassword();
  }

  if (!password) {
    console.error('Пароль не может быть пустым');
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('bcrypt-хэш:', hash);
})(); 