# 🔐 Password Manager CLI

Un password manager da riga di comando scritto in Node.js, con crittografia **AES-256-GCM** e supporto multi-utente. Le password vengono salvate localmente in forma cifrata nella cartella `~/.passmanager`.

> ⚠️ Testato su **Kali Linux**. Dovrebbe funzionare su tutti i sistemi con Node.js installato, ma non è stato verificato su Windows e Mac.

---

## ✨ Funzionalità

- 📝 Registrazione e login multi-utente
- ➕ Aggiunta di credenziali per sito (utente + password)
- 🔍 Ricerca password per sito
- ✏️ Modifica password o nome utente per un sito
- 🗑️ Cancellazione di un sito o dell'intero account
- 👁️ Visualizzazione di tutte le credenziali salvate
- 🔒 Crittografia AES-256-GCM con salt casuale per ogni utente
- 🙈 Input della chiave segreta nascosto

---

## 📦 Requisiti

- [Node.js](https://nodejs.org) v16 o superiore
- [Git](https://git-scm.com)
- npm (incluso con Node.js)

---

## 🚀 Installazione

```bash
git clone https://github.com/sburbix/password-manager.git
cd password-manager
npm install -g .
```

## ▶️ Avvio

```bash
passmanager
```

Al primo avvio scegli **Registrazione** per creare un account. Nelle sessioni successive usa **Login**.

---

## 📋 Menu

```
1) Aggiungi password
2) Cerca password
3) Cancella password
4) Cambia password
5) Guarda i tuoi dati
6) Cambia nome utente da un sito
7) Cancella utente
8) Esci
```

---

## 🔐 Come funziona la crittografia

- La chiave segreta viene derivata tramite **scrypt** con un salt casuale a 16 byte
- Le password vengono cifrate con **AES-256-GCM**, che garantisce sia riservatezza che integrità dei dati
- Ogni utente ha il proprio file `.nomeutente.json` in `~/.passmanager`, leggibile solo con la chiave corretta
- Se dimentichi la chiave segreta **non è possibile recuperare** le credenziali

---

## 📁 Struttura del progetto

```
├── Index.js            # Entry point
├── Menu.js             # Interfaccia CLI
├── GestorePassword.js  # Logica e crittografia
├── package.json
└── README.md
```

---

## 🛠️ Dipendenze

| Pacchetto        | Utilizzo                        |
|------------------|---------------------------------|
| `readline-sync`  | Input interattivo da terminale  |
| `chalk`          | Colori nel terminale            |

---

## 👤 Autore

[sburbix](https://github.com/sburbix)

---

## 📄 Licenza

ISC
