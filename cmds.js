const {models} = require('./model');
const Sequelize = require('sequelize');
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
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introductorio para hacer una pregunta
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 *         .then(answer => {....})
 * @param {*} rl Objeto readline usado para implementar el CLI.
 * @param {*} text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
}; 

/**
 * Añade un  nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y la repuesta.
 */
exports.addCmd = (rl) => {
    makeQuestion(rl, ' Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/** 
 * Lista todos los quizzes existentes en el modelo
*/
exports.listCmd = (rl) => {
    
    models.quiz.findAll()
    .each( quiz => {
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
   .then(() => {
        rl.prompt();
    });
};

/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parametro.
 *  - Convierte el parametro en un numero entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar
 * @param {*} id Parametro con el índice a validar.
 */
const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro ${id}`));
        } else {
            id = parseInt(id); // coger la parte entera y descartar lo demas
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro ${id} no es un número válido`))
            } else {
                resolve(id);
            } 
        }
    });
};
/** 
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 * @param  id Clave del quiz a mostrar
*/
exports.showCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Función auxiliar 
 */

const auxiliar = (rl, quiz) => {
    return new Promise((resolve, reject) => {
        rl.question(colorize(quiz.question+' => ', 'red'), answer => {
            resolve(answer);
        });
    });
};
/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar
 * @param id Clave del quiz a probar
 */
exports.testCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id ${id}.`);
        }
        auxiliar(rl, quiz)
        .then(answer => {
            if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                log('Correcto', 'green');
            } else {
                log('Incorrecto', 'red');
            }
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
    });
};

/**
 * Auxiliar playOne()
 */
const playOne = (rl, toBeResolved, score) => {
    return new Promise( () => {
        if (toBeResolved.length == 0) {
            log('RESULTADO : '+ score, 'red');
            log('Fin');
            rl.prompt();
        } else {
            let idAux = Math.random();
            let id = Math.trunc(idAux*(toBeResolved.length));
            models.quiz.findById(toBeResolved[id])
            .then(quizAux => {
                auxiliar(rl, quizAux)
                .then(answer => {
                    if(answer.toLowerCase().trim() === quizAux.answer.toLowerCase().trim()) {
                        score++;
                        log(`Lleva ${score} aciertos`, 'blue');
                        log('Correcto', 'green');
                        toBeResolved.splice(id, 1);
                        playOne(rl, toBeResolved, score);
                        rl.prompt();
                    } else {
                        log('Incorrecto', 'red');
                        log('Fin');
                        rl.prompt();
                    }
                })
            })
        }
    })     
    .then(() => {
       rl.prompt();
    })
};
/**
 * Pregunta todos los quizzes existentes del módelo en orden aleatorio.
 * Se gana si contesta a todos satisfactoriamente.
 */
exports.playCmd = (rl) => {
    let score = 0;
    let toBeResolved = [];

    models.quiz.findAll()
    .each( quiz => {
        toBeResolved.push(quiz.id);
    })
    .then( () => {
        playOne(rl , toBeResolved, score);
    });
};


/**
 * Edita un modelo del quiz
 * @param id Clave del quiz que queremos editar 
 */
exports.editCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id ${id}.`);
        }
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() =>{rl.write(quiz.answer)}, 0);
            return makeQuestion(rl, ' Introduzca la respuesta ')
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por ${colorize(quiz.answer, 'magenta')}`)
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt()
    });
};

/**
 * Borra un quiz del modelo
 * @param id Clave del quiz que queremos borrar 
 */
exports.deleteCmd = (rl, id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    })    
}

exports.creditsCmd = (rl) => {
    log('Autores de la práctica:');
    log('Roberto Llop Cardenal');
    rl.prompt();
}