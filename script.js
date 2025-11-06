 // Belangrijkste cryptografische parameters
    const PBKDF2_ITERATIONS = 100000;
    const KEY_SIZE_BITS = 256;
    const IV_SIZE_BYTES = 16;
    const SALT_SIZE_BYTES = 16;

    const plaintextEl = document.getElementById("plaintext");
    const ciphertextEl = document.getElementById("ciphertext");
    const passwordEl = document.getElementById("password");
    const encryptBtn = document.getElementById("encryptBtn");
    const decryptBtn = document.getElementById("decryptBtn");
    const statusEl = document.getElementById("status");

    function setStatus(message, type = "info") {
      statusEl.textContent = message;
      statusEl.classList.remove("error", "success");
      if (type === "error") statusEl.classList.add("error");
      if (type === "success") statusEl.classList.add("success");
    }

    /**
     * Deriveert een AES-sleutel uit een wachtwoord en salt met PBKDF2.
     */
    function deriveKeyFromPassword(password, saltWordArray) {
      return CryptoJS.PBKDF2(password, saltWordArray, {
        keySize: KEY_SIZE_BITS / 32, // in woorden (32 bits per woord)
        iterations: PBKDF2_ITERATIONS
      });
    }

    /**
     * Versleutel tekst (AES-256-CBC, sleutel van wachtwoord via PBKDF2).
     * Output: JSON-string met { ct, iv, s }.
     */
    function encryptText() {
      const plaintext = plaintextEl.value;
      const password = passwordEl.value;

      if (!plaintext) {
        setStatus("Geen platte tekst om te versleutelen.", "error");
        return;
      }
      if (!password) {
        setStatus("Vul een wachtwoord in om te versleutelen.", "error");
        return;
      }

      try {
        // Genereer willekeurige salt en IV
        const salt = CryptoJS.lib.WordArray.random(SALT_SIZE_BYTES);
        const iv = CryptoJS.lib.WordArray.random(IV_SIZE_BYTES);

        // Leid sleutel af uit wachtwoord
        const key = deriveKeyFromPassword(password, salt);

        // Versleutel
        const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        // Bouw veilig, deelbaar ciphertext-formaat (JSON)
        const payload = {
          ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64), // ciphertext
          iv: iv.toString(), // hex
          s: salt.toString() // hex
        };

        const jsonString = JSON.stringify(payload);
        ciphertextEl.value = jsonString;

        setStatus(
          "Tekst succesvol versleuteld. Bewaar de JSON-ciphertext; voor ontsleuteling heb je dezelfde JSON én hetzelfde wachtwoord nodig.",
          "success"
        );
      } catch (err) {
        console.error(err);
        setStatus("Er is een fout opgetreden tijdens het versleutelen.", "error");
      }
    }

    /**
     * Ontsleutel tekst vanuit JSON-string met { ct, iv, s }.
     */
    function decryptText() {
      const ciphertextJson = ciphertextEl.value.trim();
      const password = passwordEl.value;

      if (!ciphertextJson) {
        setStatus("Geen ciphertext om te ontsleutelen.", "error");
        return;
      }
      if (!password) {
        setStatus("Vul hetzelfde wachtwoord in dat bij de versleuteling is gebruikt.", "error");
        return;
      }

      try {
        const payload = JSON.parse(ciphertextJson);

        if (!payload.ct || !payload.iv || !payload.s) {
          setStatus(
            "Ongeldig ciphertext-formaat. Verwacht JSON met velden ct, iv en s.",
            "error"
          );
          return;
        }

        const salt = CryptoJS.enc.Hex.parse(payload.s);
        const iv = CryptoJS.enc.Hex.parse(payload.iv);
        const ciphertextWordArray = CryptoJS.enc.Base64.parse(payload.ct);

        // Leid dezelfde sleutel weer af uit wachtwoord en salt
        const key = deriveKeyFromPassword(password, salt);

        // Maak CipherParams-object zodat AES.decrypt ermee kan werken
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: ciphertextWordArray
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

        if (!plaintext) {
          // Meestal betekent dit: verkeerd wachtwoord of corrupte data
          setStatus(
            "Ontsleuteling mislukt. Controleer het wachtwoord en of de ciphertext ongewijzigd is.",
            "error"
          );
          return;
        }

        plaintextEl.value = plaintext;
        setStatus("Tekst succesvol ontsleuteld.", "success");
      } catch (err) {
        console.error(err);
        setStatus(
          "Er is een fout opgetreden tijdens het ontsleutelen. Is de ciphertext geldige JSON en komt het wachtwoord overeen?",
          "error"
        );
      }
    }

    encryptBtn.addEventListener("click", encryptText);
    decryptBtn.addEventListener("click", decryptText);