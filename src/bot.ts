import { validateName, validateWhatsApp, validateGmail, validateCrypto, validatePlan, validateWallet, validateUPI, validateTransactionId } from './validators';

// rest of the code will go here.  This is a placeholder.  The prompt did not provide any existing code.
const name = "John Doe";
const isValidName = validateName(name);

const whatsapp = "+15551234567";
const isValidWhatsapp = validateWhatsApp(whatsapp);

const gmail = "john.doe@gmail.com";
const isValidGmail = validateGmail(gmail);

const crypto = "BTC";
const isValidCrypto = validateCrypto(crypto);

const plan = "premium";
const isValidPlan = validatePlan(plan);

const wallet = "0x1234567890abcdef";
const isValidWallet = validateWallet(wallet);

const upi = "john.doe@upi";
const isValidUPI = validateUPI(upi);

const transactionId = "1234567890";
const isValidTransactionId = validateTransactionId(transactionId);


console.log("Is Name Valid?", isValidName);
console.log("Is WhatsApp Valid?", isValidWhatsapp);
console.log("Is Gmail Valid?", isValidGmail);
console.log("Is Crypto Valid?", isValidCrypto);
console.log("Is Plan Valid?", isValidPlan);
console.log("Is Wallet Valid?", isValidWallet);
console.log("Is UPI Valid?", isValidUPI);
console.log("Is Transaction ID Valid?", isValidTransactionId);

