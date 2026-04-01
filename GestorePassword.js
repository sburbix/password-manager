const fs = require("fs");
const crypto =  require("crypto");
const os = require("os");
const path = require("path");

const baseDir = path.join(os.homedir(), ".passmanager");
// crea la cartella se non esiste
if (!fs.existsSync(baseDir)){
    fs.mkdirSync(baseDir, { recursive: true });
}

class CredenzialiEsistenti extends Error{
    constructor(mss){
        super(mss)
        this.name = "CredenzialiEsistenti"
    }
}

class SitoNonTrovato extends Error{
    constructor(mss) {
        super (mss)
        this.name = "SitoNonTrovato"
    }
}

class UtenteNonTrovato extends Error{
    constructor(mss){
        super(mss)
        this.name = "UtenteNonTrovato"
    }
}

class ChiaveSbagliata extends Error{
    constructor(mss){
        super(mss)
        this.name = "ChiaveSbagliata"
    }
}

class PasswordManager { 
    #passwords
    #key
    #file
    #salt
    constructor(chiave, nome) {
        this.#passwords = {};
        this.#file = path.join(baseDir, `.${nome}.json`);

        if (fs.existsSync(this.#file)) {
            const raw = fs.readFileSync(this.#file, "utf-8");
            const parsed = JSON.parse(raw);

            this.#salt = Buffer.from(parsed.salt, 'hex');
            this.#key = crypto.scryptSync(chiave, this.#salt, 32);

            try {
                const decrypted = this.#decrypt(parsed.data);
                this.#passwords = JSON.parse(decrypted);
            }catch {
                throw new ChiaveSbagliata("Chiave sbagliata");
            }

        } else {
            this.#salt = crypto.randomBytes(16);
            this.#key = crypto.scryptSync(chiave, this.#salt, 32);
            this.#passwords = {};
        }
        this.#salvaFile()
    }

    inserisciPass(sitox, userx, passx) {
        if (this.#passwords[sitox]){
            throw new CredenzialiEsistenti("ATTENZIONE Credenziali gia inserite")
        }
        this.#passwords[sitox] = { user: userx, pass: passx }
        this.#salvaFile()
    }
    cercaPassSito(sitox){
        if (!this.#check_sito(sitox)){
            throw new SitoNonTrovato("Sito non trovato")
        }
        let decifra = this.#passwords[sitox].pass
        return [decifra, this.#passwords[sitox].user]
    }
    cancellaSito(sitox){
        if (!this.#check_sito(sitox)){
            throw new SitoNonTrovato("Sito non trovato")
        }
        delete this.#passwords[sitox]
        this.#salvaFile()
    }
    cambiaPass(sitox, passx){
        if (!this.#check_sito(sitox)){
            throw new SitoNonTrovato("Sito non trovato")
        }
        this.#passwords[sitox].pass = passx
        this.#salvaFile()
        return true
    }
    cambiaUtente(sitox,userx){
        if (!this.#check_sito(sitox)){
            throw new SitoNonTrovato("Sito non trovato")
        }
        this.#passwords[sitox].user = userx
        this.#salvaFile()
        return true
    }
    raccolta(){
        return JSON.parse(JSON.stringify(this.#passwords))
    }

    #check_sito(sitox){
        return  typeof sitox == "string" && sitox != "" && this.#passwords[sitox] != undefined
    }

    #salvaFile() {
        const encrypted = this.#encrypt(this.#passwords);

        const payload = {
            salt: this.#salt.toString('hex'),
            data: encrypted
        };

        fs.writeFileSync(this.#file, JSON.stringify(payload));
    }

    #encrypt(data){
        if (typeof data !== "string") data = JSON.stringify(data);

        const iv = crypto.randomBytes(12); // GCM usa 12 byte
        const cipher = crypto.createCipheriv('aes-256-gcm', this.#key, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return JSON.stringify({
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            data: encrypted
        })
    }

    #decrypt(payload){
        let parsed;

        try {
            parsed = JSON.parse(payload);
        } catch {
            throw new Error("Formato dati non valido");
        }

        const iv = Buffer.from(parsed.iv, 'hex');
        const tag = Buffer.from(parsed.tag, 'hex');
        const encrypted = parsed.data;

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.#key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
    
class Utente {
    constructor(nome, chiave) {
        if (typeof nome !== "string" || nome == ""){
            throw new Error
        }
        this._utente = nome;
        this.manager = new PasswordManager(chiave, nome)
    }
    get utente(){
        return this._utente
    }

    cancellaUtente(){
        const file = path.join(baseDir, `.${this._utente}.json`);
        if (!fs.existsSync(file))
            throw new UtenteNonTrovato("Utente inesistente")
        fs.unlinkSync(file)
        this.manager = null
    }

}

module.exports = { Utente, PasswordManager, CredenzialiEsistenti, SitoNonTrovato, UtenteNonTrovato, ChiaveSbagliata };

