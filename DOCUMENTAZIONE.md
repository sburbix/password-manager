# 📖 Documentazione — GestorePassword.js

---

## Panoramica

`GestorePassword.js` è il cuore del progetto. Contiene tutta la logica per:
- Cifrare e decifrare le password
- Salvare e leggere i dati dal disco
- Gestire gli utenti

Il file è composto da **4 classi di errore**, una classe **PasswordManager** e una classe **Utente**.

---

## 📁 Dove vengono salvati i dati

I dati vengono salvati nella cartella nascosta `~/.passmanager` nella home dell'utente del sistema operativo. Ogni utente del password manager ha il proprio file:

```
~/.passmanager/.nomeutente.json
```

Il file è nascosto (inizia con `.`) e contiene i dati cifrati. Se la cartella non esiste, viene creata automaticamente all'avvio.

---

## ⚠️ Classi di errore

Sono classi personalizzate che estendono `Error`, usate per identificare con precisione cosa è andato storto.

| Classe | Quando viene lanciata |
|---|---|
| `CredenzialiEsistenti` | Si tenta di aggiungere un sito già presente |
| `SitoNonTrovato` | Si cerca/modifica/cancella un sito che non esiste |
| `UtenteNonTrovato` | Si tenta di cancellare un utente il cui file non esiste |
| `ChiaveSbagliata` | La chiave segreta inserita al login è errata |

---

## 🔐 Classe PasswordManager

Gestisce le password di un singolo utente. Tutti i campi interni sono **privati** (usando `#`) per impedire l'accesso diretto dall'esterno.

### Campi privati

| Campo | Descrizione |
|---|---|
| `#passwords` | Oggetto JavaScript con tutte le credenziali in memoria |
| `#key` | Chiave derivata di 32 byte usata per cifrare/decifrare |
| `#file` | Percorso del file `.json` dell'utente |
| `#salt` | Valore casuale usato nella derivazione della chiave |

---

### Costruttore `constructor(chiave, nome)`

È il punto di ingresso della classe. Riceve la chiave segreta e il nome utente.

**Se il file esiste (login):**
1. Legge il file `.json` e lo analizza
2. Recupera il salt salvato
3. Deriva la chiave con `scrypt` usando il salt
4. Tenta di decifrare i dati — se fallisce lancia `ChiaveSbagliata`
5. Carica le password in memoria in `#passwords`

**Se il file non esiste (registrazione):**
1. Genera un salt casuale da 16 byte
2. Deriva la chiave con `scrypt`
3. Inizializza `#passwords` come oggetto vuoto
4. Salva subito il file (così il login funziona anche prima di aggiungere siti)

---

### Metodi pubblici

#### `inserisciPass(sito, user, pass)`
Aggiunge una nuova credenziale. Lancia `CredenzialiEsistenti` se il sito è già presente. Salva il file dopo l'inserimento.

#### `cercaPassSito(sito)`
Cerca le credenziali di un sito. Restituisce un array `[password, utente]`. Lancia `SitoNonTrovato` se il sito non esiste.

#### `cancellaSito(sito)`
Elimina le credenziali di un sito. Lancia `SitoNonTrovato` se il sito non esiste. Salva il file dopo la cancellazione.

#### `cambiaPass(sito, nuovaPassword)`
Modifica la password di un sito esistente. Lancia `SitoNonTrovato` se il sito non esiste. Salva il file e restituisce `true`.

#### `cambiaUtente(sito, nuovoUtente)`
Modifica il nome utente di un sito esistente. Lancia `SitoNonTrovato` se il sito non esiste. Salva il file e restituisce `true`.

#### `raccolta()`
Restituisce una copia profonda di tutte le password in memoria. Usa `JSON.parse(JSON.stringify(...))` per evitare che l'oggetto restituito sia una referenza diretta ai dati interni.

---

### Metodi privati

#### `#check_sito(sito)`
Verifica che il sito sia una stringa non vuota e che esista in `#passwords`. Usato internamente prima di ogni operazione su un sito.

#### `#salvaFile()`
Cifra l'oggetto `#passwords` e lo scrive nel file `.json` in questo formato:
```json
{
  "salt": "valore hex del salt",
  "data": "{ iv, tag, data } cifrati"
}
```

#### `#encrypt(data)`
Cifra i dati con **AES-256-GCM**:
1. Genera un IV casuale da 12 byte (obbligatorio per GCM)
2. Cifra i dati
3. Recupera il tag di autenticazione (garantisce l'integrità)
4. Restituisce un JSON con `iv`, `tag` e `data` in formato hex

#### `#decrypt(payload)`
Decifra i dati:
1. Analizza il JSON con `iv`, `tag` e `data`
2. Ricrea il decifratore con la stessa chiave e IV
3. Imposta il tag di autenticazione — se i dati sono stati manomessi, fallisce
4. Restituisce i dati in chiaro

---

## 👤 Classe Utente

Rappresenta un utente del sistema. È il punto di accesso principale usato dal menu.

### Costruttore `constructor(nome, chiave)`
Valida che il nome sia una stringa non vuota, poi crea un'istanza di `PasswordManager` e la espone tramite `this.manager`.

### Proprietà `utente` (getter)
Restituisce il nome dell'utente tramite un getter, proteggendo il campo interno `_utente`.

### Metodo `cancellaUtente()`
Elimina il file `.json` dell'utente dal disco e imposta `this.manager = null`. Lancia `UtenteNonTrovato` se il file non esiste.

---

## 🔑 Come funziona la crittografia

### Derivazione della chiave con scrypt
La chiave segreta inserita dall'utente non viene usata direttamente per cifrare. Viene prima trasformata in una chiave da 32 byte tramite **scrypt**, un algoritmo appositamente lento e costoso per rendere difficili gli attacchi a forza bruta.

```
chiave_utente + salt → scrypt → chiave_32_byte
```

Il **salt** è casuale e unico per ogni utente, quindi due utenti con la stessa chiave avranno chiavi derivate diverse.

### Cifratura con AES-256-GCM
- **AES-256**: algoritmo di cifratura simmetrica con chiave da 256 bit, considerato inviolabile con la tecnologia attuale
- **GCM** (Galois/Counter Mode): modalità che aggiunge un **tag di autenticazione** — se qualcuno modifica il file cifrato, la decifratura fallisce immediatamente
- **IV** (Initialization Vector): valore casuale da 12 byte generato ad ogni salvataggio, garantisce che lo stesso dato cifrato due volte produca risultati diversi

### Struttura del file salvato
```json
{
  "salt": "abc123...",
  "data": "{\"iv\":\"...\",\"tag\":\"...\",\"data\":\"...\"}"
}
```

Senza la chiave segreta dell'utente, il file è illeggibile.

---

## 📤 Esportazioni

```js
module.exports = { 
  Utente, 
  PasswordManager, 
  CredenzialiEsistenti, 
  SitoNonTrovato, 
  UtenteNonTrovato,
  ChiaveSbagliata
};
```
