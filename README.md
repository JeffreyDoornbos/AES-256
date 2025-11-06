# Symmetrische Encryptie Webapp – AES-256 met crypto-js

## 1. Hoe de applicatie werkt

Deze applicatie is een eenvoudige webapp (HTML/CSS/JavaScript) waarmee gebruikers tekst kunnen versleutelen en ontsleutelen met behulp van symmetrische encryptie.

- De gebruiker voert gewone tekst in in het veld **"Platte tekst"**.
- De gebruiker kiest een **wachtwoord**.
- Bij het klikken op **"Versleutel"**:
  - wordt de tekst versleuteld;
  - verschijnt er in het veld **"Ciphertext"** een JSON-structuur met de velden `ct`, `iv` en `s`.
- Om te ontsleutelen plakt de gebruiker dezelfde JSON-ciphertext in het ciphertext-veld, voert hetzelfde wachtwoord in en klikt op **"Ontsleutel"**. De oorspronkelijke tekst verschijnt dan weer in het plaintext-veld.

De hele applicatie draait in de browser en gebruikt een bestaande cryptografische library: **crypto-js**.

---

## 2. Gebruik van encryptiemethoden en gekozen algoritme

De applicatie gebruikt:

- **Symmetrische encryptie**:
  - Algoritme: **AES-256** (Advanced Encryption Standard met 256-bits sleutel)
  - Modus: **CBC (Cipher Block Chaining)**
  - Padding: **PKCS#7**

- **Sleutelafleiding**:
  - Algoritme: **PBKDF2 (Password-Based Key Derivation Function 2)**
  - Sleutelgrootte: 256 bits
  - Iteraties: 100.000
  - Input: wachtwoord van de gebruiker + willekeurige salt

### Motivatie voor AES-256 (CBC)

- AES is een **internationaal gestandaardiseerd en goed geanalyseerd** algoritme, dat algemeen wordt aanbevolen voor symmetrische encryptie.
- 256-bit sleutels bieden een hoge veiligheidsmarge.
- De implementatie via `crypto-js` is breed gebruikt en getest.
- De CBC-modus is niet de meest moderne (zoals GCM), maar in combinatie met:
  - een **random IV per versleuteling**,
  - een goed gekozen sleutel,
  - en een veilige sleutelafleiding via PBKDF2,
  
  is dit voor een leerproject een goede en veilige keuze, zolang de ciphertext niet wordt aangepast (geen expliciete authenticatie).

---

## 3. Sleutelbeheer: generatie, opslag en uitwisseling

In deze applicatie wordt geen symmetrische sleutel direct opgeslagen of gedeeld. In plaats daarvan:

1. **Wachtwoord**  
   De gebruiker kiest een wachtwoord. Dit wachtwoord wordt nergens opgeslagen door de applicatie; het wordt alleen lokaal in de browser gebruikt tijdens de sessie.

2. **Salt en key derivation**  
   - Bij elke versleuteling wordt een **willekeurige salt** gegenereerd.
   - Met PBKDF2 wordt uit het wachtwoord + salt een 256-bits sleutel gemaakt.
   - Het aantal iteraties (100.000) maakt brute-force-aanvallen op het wachtwoord langzamer.

3. **IV (initialization vector)**  
   - Voor elke versleuteling wordt een **random IV** gegenereerd.
   - De IV zorgt ervoor dat dezelfde plaintext met hetzelfde wachtwoord toch een andere ciphertext oplevert.

4. **Opslag en uitwisseling**  
   De applicatie produceert een JSON-structuur van de vorm:

   ```json
   {
     "ct": "<ciphertext in Base64>",
     "iv": "<IV in hex>",
     "s": "<salt in hex>"
   }
