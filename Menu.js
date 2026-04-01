#!/usr/bin/env node
const { Utente, UtenteNonTrovato } = require('./GestorePassword.js')
const readlineSync = require('readline-sync');
const fs = require("fs")
const chalk = require('chalk')
const os = require("os");
const path = require("path");
const baseDir = path.join(os.homedir(), ".passmanager")

function main() {
    console.log(chalk.bold.green("\n==============================="));
    console.log(chalk.bold.green("      PASSWORD MANAGER 🚀"));
    console.log(chalk.bold.green("===============================\n")); 
    console.log(chalk.yellow("1️⃣  Registrazione"));
    console.log(chalk.yellow("2️⃣  Login"));
    console.log(chalk.yellow("-------------------------------\n"));

    const scelta = readlineSync.question(chalk.cyan("Scegli un'opzione (1/2): "));
    let utente
    if (scelta == "1"){
        const nome = readlineSync.question("Inserisci nome utente: ")
        if (fs.existsSync(path.join(baseDir, `.${nome}.json`))){
            console.log(chalk.red("Utente gia esistente"))
            return
        }
        const chiave = readlineSync.question('Inserisci chiave segreta: ', { hideEchoBack: true });
        utente = new Utente(nome, chiave);
        console.log(chalk.green("Registrazione completata\n"))
    }
    else if (scelta == "2"){
        try{
            const nome = readlineSync.question("Inserisci nome utente: ")

            if (!fs.existsSync(path.join(baseDir, `.${nome}.json`))){
                throw new UtenteNonTrovato("Utente non trovato")
            }

            const chiave = readlineSync.question('Inserisci chiave segreta: ', { hideEchoBack: true });
            utente = new Utente(nome, chiave)

            console.log(chalk.magenta("Login effettuato\n"))

        } catch(e){
            console.log(chalk.redBright(e.message))
            return
        }
    }
    else{
        console.log(chalk.redBright("Scelta non valida"))
        return
    }

    while (true) {
        console.log(chalk.bold.green("\n=== Password Manager ==="));
        console.log(chalk.yellow("1) Aggiungi password"));
        console.log(chalk.yellow("2) Cerca password"));
        console.log(chalk.yellow("3) Cancella password"));
        console.log(chalk.yellow("4) Cambia password"));
        console.log(chalk.yellow("5) Guarda i tuoi dati"));
        console.log(chalk.yellow("6) Cambia nome utente da un sito"));
        console.log(chalk.yellow("7) Cancella utente"));
        console.log(chalk.yellow("8) Esci\n"));
        const scelta = readlineSync.question("Scegli un'opzione: ")
        if (scelta === "1") {
            const sito = readlineSync.question("Sito: ")
            const user = readlineSync.question("Utente: ")
            const pass = readlineSync.question("Password: ")
            try{
                utente.manager.inserisciPass(sito, user, pass)
                console.log(chalk.cyan("Password aggiunta!"))
            }catch(e){
                console.log(e.message)
            }
        } 
        else if (scelta === "2") {
            const sito = readlineSync.question("Sito da cercare: ");
            try{
                const dati = utente.manager.cercaPassSito(sito)
                console.log(`il nome utente è`,chalk.bold.blue(dati[1]), `la password è`, chalk.cyanBright(dati[0]))
            }catch(e){
                console.log(e.message)
            }
            
        }
        else if (scelta == "3"){
            const sito = readlineSync.question("Sito da cancellare: ")
            try{
                utente.manager.cancellaSito(sito)
                console.log(chalk.black("Sito cancellato \n"))
            }catch(e){
                console.log(e.message)
            }
        } 
        else if(scelta == "4"){
            const sito = readlineSync.question("Sito da cui cambiare la password: ")
            const nuovapss = readlineSync.question("Nuova password: ")
            try{
                utente.manager.cambiaPass(sito, nuovapss)
                console.log(chalk.redBright("Password cambiata! \n"))
            }catch(e){
                console.log(e.message)
            }
        }
        else if (scelta == "5"){
            const dati = utente.manager.raccolta();
            console.log(chalk.bold("\n=== Le tue password ==="));
            for (const sito in dati) {
                console.log(`sito:${chalk.blue(sito)}, user:${chalk.green(dati[sito].user)}, pass: ${chalk.cyan(dati[sito].pass)}`);
            }
        }
        else if(scelta == "6"){
            const sito = readlineSync.question("Sito da cui cambiare nome utente: ")
            const nuovoUtente = readlineSync.question("Nuovo nome utente: ") 
            try{
                utente.manager.cambiaUtente(sito,nuovoUtente)
                console.log(chalk.blueBright("Nome utente cambiato"))
            }catch(e){
                console.log(e.message)
            }
        }
        else if (scelta == "7"){
            const conferma = readlineSync.question("Sei sicuro? (y/n): ")
            if (conferma == "y"){
                try{
                    utente.cancellaUtente()
                    console.log(chalk.greenBright("Cancellazione effettuata con successo"))
                    return
                }catch(e){
                    console.log(chalk.gray(e.message))
                }
            }else if(conferma == "n"){
                continue
            }else{
                console.log(chalk.redBright("Scelta non valida"))
            }
        }
        else if (scelta === "8"){
            const dati = utente.manager.raccolta()
            if (Object.keys(dati).length == 0){
                console.log(chalk.whiteBright("Nessun sito salvato, salvane almeno uno  "))
                continue
            }
            break
        }

        else console.log(chalk.redBright("Scelta non valida."))
    }
}

if (require.main === module) {
    main();
}

module.exports = main;