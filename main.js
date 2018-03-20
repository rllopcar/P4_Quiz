
const readline = require('readline');
const figlet = require('figlet');
const chalk = require('chalk');

const cmds = require('./cmds')
const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');

const net = require("net");

net.createServer(socket => {

console.log("Se ha conectado un cliente desde " + socket.remoteAddress);

//Mensaje inicial
biglog(socket, 'CORE Quiz', 'green');

const rl = readline.createInterface({
  //Leo del teclado
  input: socket,
  //Saco por la pantalla
  output: socket,
  //Le doy nombre a la consola
  prompt: colorize("quiz > ", 'blue'),
  completer: (line) => {
    const completions = 'h help add list show delete edit credits test p play quit '.split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    // show all completions if none found
    return [hits.length ? hits : completions, line];
  }
});
//atender los eventos de los socket
socket.
on("end", () => {rl.close}).
on("error", () => {rl.close});



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
            cmds.helpCmd(socket, rl);
            break;
        case 'quit':
        case 'q':
            cmds.quitCmd(socket, rl);
            break;
        case 'add':
            cmds.addCmd(socket, rl);
            break;
        case 'list':
            cmds.listCmd(socket, rl);
            break;
        case 'show':
            cmds.showCmd(socket, rl, args[1]);
            break;
        case 'test':
            cmds.testCmd(socket, rl, args[1]);
            break;
        case 'play':
        case 'p':
            cmds.playCmd(socket, rl);
            break;
        case 'delete':
            cmds.deleteCmd(socket, rl, args[1]);
            break;
        case 'edit':
            cmds.editCmd(socket, rl, args[1]);
            break;
        case 'credits':
            cmds.creditsCmd(socket, rl);
            break;
        default:
        log(socket, `Comando desconocido: '${colorize(cmd, 'red')}'`);
        log(socket, `Use 'help' para ver todos los comandos disponibles`)
        rl.prompt();
        break;
  }
  //rl.prompt();
}).on('close', () => {
  log(socket, 'Adios!');
  // process.exit(0);
});


}).listen(3030);

