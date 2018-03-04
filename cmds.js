const model = require('./model');
const quizzes = require('./quizzes')
const {log, biglog, errorlog, colorize} = require('./out');

/**
 * Muestra la ayuda
 */
exports.helpCmd = (rl) => {
    log('Comandos:');
    log(' h|help - Muestra esta ayuda.');
    log(' list - Muesta los quizzes existentes.');
    log(' show <id> - Muestra la pregunta y la repuesta del quiz indicado.');
    log(' add - Añadir un nuevo quiz interactivamente.');
    log(' delete <id> - Borrar el quiz indicado.');
    log(' edit <id> - Editar el quiz indicado');
    log(' test <id> - Probar el quiz indicado');
    log(' p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log(' credits -  Créditos.');
    log(' q|quit - Salir del programa.');
    rl.prompt();
}


/** 
 * Terminar programa
*/
exports.quitCmd = (rl) => {
    rl.close();
    rl.prompt();
}

/**
 * Añade un  nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y la repuesta.
 */
exports.addCmd = (rl) => {
    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
        })
    })
    rl.prompt();
}

/** 
 * Lista todos los quizzes existentes en el modelo
*/
exports.listCmd = (rl) => {
    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
}

/** 
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 * @param  id Clave del quiz a mostrar
*/
exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try{
        const quiz = model.getByIndex(id);
        log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    } catch(error) {
        errorlog(error.message);
    }
    rl.prompt();
    }
}

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar
 * @param id Clave del quiz a probar
 */
exports.testCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize('¿'+quiz.question+'?'+' => ', 'red'), resp => {
                if(resp.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                    log('CORRECTO', 'green');
                    rl.prompt();
                } else {
                    log('INCORRECTO', 'red')
                    rl.prompt();
                }
            });
            } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();
}

/**
 * Pregunta todos los quizzes existentes del módelo en orden aleatorio.
 * Se gana si contesta a todos satisfactoriamente.
 */
exports.playCmd = (rl) => {
    let score = 0;
    let toBeResolve = [];
    //console.log('El modelo es', Object.keys(quizzes).length);
    l = Object.keys(quizzes).length;
    for (i = 0; i < l; i++) {
        toBeResolve.push(quizzes[i]);
    }
    const playOne = () => {
        if (toBeResolve.length == 0) {
            log('FIN', 'red');
            log('RESULTADO : '+score, 'red');
            rl.prompt();
        } else {
            let idAux = Math.random();
            let id = Math.trunc(idAux*(toBeResolve.length));
            let quiz = toBeResolve[id];
            rl.question(colorize('¿'+quiz.question+'?'+' => ', 'red'), resp => {
                if(resp.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                    score++;
                    log('CORRECTO', 'green');
                    log(`Lleva ${score} aciertos`, 'blue');
                    toBeResolve.splice(id, 1);
                    playOne();
                    rl.prompt();
                } else {
                    log('Incorrecto', 'red');
                    log('FIN', 'red');
                    rl.prompt();
                }
            });
        }
        rl.prompt();
    }
    playOne();
}

/**
 * Edita un modelo del quiz
 * @param id Clave del quiz que queremos editar 
 */
exports.editCmd = (rl, id) => {
    const quiz = model.getByIndex(id);
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);

            rl.question(colorize( 'Introduzca una pregunta: ', 'red'), question =>{

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);

                rl.question(colorize( 'Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question}`);
                    rl.prompt();
                });
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }  
    }
};

/**
 * Borra un quiz del modelo
 * @param id Clave del quiz que queremos borrar 
 */
exports.deleteCmd = (rl, id) => {
    if (typeof id === "undefined") {
        throw new Error(`Falta el parámetro id.`);
    } else {
        try{
        model.deleteByIndex(id);
    } catch(error) {
        errorlog(error.message);
    }
    rl.prompt();
    }
}

exports.creditsCmd = (rl) => {
    console.log('Autores de la práctica:');
    console.log('Roberto Llop Cardenal');
    rl.prompt();
}