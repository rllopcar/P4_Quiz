
const readline = require('readline');
const figlet = require('figlet');
const chalk = require('chalk');

const cmds = require('./cmds')
const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');

//Mensaje inicial
biglog('CORE Quiz', 'green');

const rl = readline.createInterface({
  //Leo del teclado
  input: process.stdin,
  //Saco por la pantalla
  output: process.stdout,
  //Le doy nombre a la consola
  prompt: colorize("quiz > ", 'blue'),
  completer: (line) => {
    const completions = 'h help add list show delete edit credits test p play quit '.split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    // show all completions if none found
    return [hits.length ? hits : completions, line];
  }
});

rl.prompt();

//Manejadores de eventos, dependiendo de lo que me ponga en la linea hago una cosa u otra
// en este caso hay dos eventos, el evento line y el evento close
rl.on('line', (line) => {

    let args =  line.split(" ");
    let cmd = args[0].toLowerCase().trim();

    switch (cmd) {
        case '':
            rl.prompt();
            break;
        case 'h':
        case 'help':
            cmds.helpCmd(rl);
            break;
        case 'quit':
        case 'q':
            cmds.quitCmd(rl);
            break;
        case 'add':
            cmds.addCmd(rl);
            break;
        case 'list':
            cmds.listCmd(rl);
            break;
        case 'show':
            cmds.showCmd(rl, args[1]);
            break;
        case 'test':
            cmds.testCmd(rl, args[1]);
            break;
        case 'play':
        case 'p':
            cmds.playCmd(rl);
            break;
        case 'delete':
            cmds.deleteCmd(rl, args[1]);
            break;
        case 'edit':
            cmds.editCmd(rl, args[1]);
            break;
        case 'credits':
            cmds.creditsCmd(rl);
            break;
        default:
        console.log(`Comando desconocido: '${colorize(cmd, 'red')}'`);
        console.log(`Use 'help' para ver todos los comandos disponibles`)
        rl.prompt();
        break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Adios!');
  process.exit(0);
});


