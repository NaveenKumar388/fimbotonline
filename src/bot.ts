import TelegramBot from 'node-telegram-bot-api';
import { saveUser, getUserState, setUserState, setUserData, getUserData, clearUserData } from './db.js';
import { sendEmail } from './email.js';
import { validateName, validateWhatsApp, validateGmail, validateCrypto, validatePlan, validateWallet, validateUPI, validateTransactionId } from './validators.js';

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: false });

export async function handleUpdate(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  const currentState = await getUserState(chatId);

  switch (currentState) {
    case 'START':
      await handleStart(chatId);
      break;
    case 'NAME':
      await handleName(chatId, text);
      break;
    case 'WHATSAPP':
      await handleWhatsApp(chatId, text);
      break;
    case 'GMAIL':
      await handleGmail(chatId, text);
      break;
    case 'CHOOSE_CRYPTO':
      await handleChooseCrypto(chatId, text);
      break;
    case 'SELECT_PLAN':
      await handleSelectPlan(chatId, text);
      break;
    case 'ENTER_AMOUNT':
      await handleEnterAmount(chatId, text);
      break;
    case 'WALLET':
      await handleWallet(chatId, text);
      break;
    case 'GETUPI':
      await handleGetUPI(chatId, text);
      break;
    case 'PAYMENT_CONFIRMATION':
      await handlePaymentConfirmation(chatId, text);
      break;
    case 'USERDETAILS':
      await handleUserDetails(chatId, text);
      break;
    default:
      await handleStart(chatId);
  }
}

async function handleStart(chatId: number) {
  await setUserState(chatId, 'NAME');
  await sendMessage(chatId, 'Welcome to FIM CRYPTO EXCHANGE! Please provide your name (letters only):');
}

async function handleName(chatId: number, text: string) {
  if (validateName(text)) {
    await setUserData(chatId, 'name', text);
    await setUserState(chatId, 'WHATSAPP');
    await sendMessage(chatId, 'Name saved! Please enter your WhatsApp number (10 digits):');
  } else {
    await sendMessage(chatId, 'Invalid name. Please enter only letters.');
  }
}

async function handleWhatsApp(chatId: number, text: string) {
  if (validateWhatsApp(text)) {
    await setUserData(chatId, 'whatsapp', text);
    await setUserState(chatId, 'GMAIL');
    await sendMessage(chatId, 'WhatsApp number saved! Please enter your Gmail address:');
  } else {
    await sendMessage(chatId, 'Invalid WhatsApp number. Enter a 10-digit number.');
  }
}

async function handleGmail(chatId: number, text: string) {
  if (validateGmail(text)) {
    await setUserData(chatId, 'gmail', text);
    await setUserState(chatId, 'CHOOSE_CRYPTO');
    await sendMessage(chatId, 'Gmail saved! Choose your cryptocurrency:', {
      reply_markup: {
        keyboard: [
          [{ text: 'BNB' }, { text: 'USDT' }, { text: 'TON' }],
          [{ text: 'POL' }, { text: 'SUI' }, { text: 'NEAR' }],
          [{ text: 'LTC' }, { text: 'ARB' }, { text: 'TRX' }]
        ],
        one_time_keyboard: true,
      },
    });
  } else {
    await sendMessage(chatId, 'Invalid Gmail. Enter a valid Gmail address.');
  }
}

async function handleChooseCrypto(chatId: number, text: string) {
  if (validateCrypto(text)) {
    await setUserData(chatId, 'crypto', text);
    await setUserState(chatId, 'SELECT_PLAN');
    const planDescription = text === 'USDT'
      ? "Now, choose a plan by entering the number (1-8):\n1. 1$ - 92₹\n2. 2$ - 184₹\n3. 3$ - 276₹\n4. 4$ - 368₹\n5. 5$ - 458₹\n8. Others (Enter your amount in dollars):"
      : "Now, choose a plan by entering the number (1-8):\n1. 0.5$ - 55₹\n2. 1$ - 97₹\n3. 2$ - 194₹\n4. 3$ - 291₹\n5. 4$ - 388₹\n6. 5$ - 485₹\n7. 7$ - 680₹\n8. Others (Enter your amount in dollars):";
    await sendMessage(chatId, planDescription);
  } else {
    await sendMessage(chatId, 'Invalid cryptocurrency. Please choose from the options provided.');
  }
}

async function handleSelectPlan(chatId: number, text: string) {
  const userData = await getUserData(chatId);
  const crypto = userData.crypto;
  const planResult = validatePlan(text, crypto);

  if (planResult.valid) {
    if (text === '8') {
      await setUserState(chatId, 'ENTER_AMOUNT');
      await sendMessage(chatId, planResult.message || 'Enter the amount:');
    } else if (planResult.amount !== undefined) {
      await setUserData(chatId, 'amount', planResult.amount.toString());
      await setUserState(chatId, 'WALLET');
      await sendMessage(chatId, `Plan selected: ${planResult.amount}₹\nNow, enter your wallet address:`);
    }
  } else {
    await sendMessage(chatId, planResult.message || 'Invalid plan selection.');
  }
}

async function handleEnterAmount(chatId: number, text: string) {
  const userData = await getUserData(chatId);
  const crypto = userData.crypto;
  const inputAmount = parseFloat(text);

  if (isNaN(inputAmount)) {
    await sendMessage(chatId, 'Please enter a valid number.');
    return;
  }

  let calculatedAmount: number;
  if (crypto === 'USDT') {
    if (inputAmount < 5) {
      await sendMessage(chatId, 'Please enter an amount of at least 5$.');
      return;
    }
    calculatedAmount = inputAmount * 92;
  } else {
    calculatedAmount = inputAmount * 97;
  }

  const maxAmount = 999999999999.99; // Maximum value for DECIMAL(16,2)

  if (calculatedAmount > maxAmount) {
    await sendMessage(chatId, 'Amount too large. Please enter a smaller amount.');
    return;
  }

  await setUserData(chatId, 'amount', calculatedAmount.toString());
  await setUserState(chatId, 'WALLET');
  await sendMessage(chatId, `Amount set to ${calculatedAmount.toFixed(2)}₹\nNow, enter your wallet address:`);
}

async function handleWallet(chatId: number, text: string) {
  if (validateWallet(text)) {
    await setUserData(chatId, 'wallet', text);
    await setUserState(chatId, 'GETUPI');
    const amount = (await getUserData(chatId)).amount;
    await sendMessage(chatId, `Wallet address saved! Proceed to payment: Pay ${amount} to UPI ID: ${process.env.OWNER_UPI_ID}.`);
    await sendMessage(chatId, 'Please enter your UPI ID:');
  } else {
    await sendMessage(chatId, 'Invalid wallet address. Please enter a valid address.');
  }
}

async function handleGetUPI(chatId: number, text: string) {
  if (validateUPI(text)) {
    await setUserData(chatId, 'upi', text);
    await setUserState(chatId, 'PAYMENT_CONFIRMATION');
    await sendMessage(chatId, 'UPI ID Saved! Enter your Transaction ID:');
  } else {
    await sendMessage(chatId, 'Invalid UPI ID. Please enter a valid UPI ID.');
  }
}

async function handlePaymentConfirmation(chatId: number, text: string) {
  if (validateTransactionId(text)) {
    await setUserData(chatId, 'transaction_id', text);
    await setUserState(chatId, 'USERDETAILS');
    const userData = await getUserData(chatId);
    const userDetails = getUserDetails(userData);
    await sendMessage(chatId, userDetails);
    await sendMessage(chatId, 'Confirm your details (yes/no):');
  } else {
    await sendMessage(chatId, 'Invalid Transaction ID. Please enter a valid Transaction ID.');
  }
}

async function handleUserDetails(chatId: number, text: string) {
  if (text.toLowerCase() === 'yes') {
    const userData = await getUserData(chatId);
    await saveUser(userData);
    await sendEmail(userData);
    await clearUserData(chatId);
    await sendMessage(chatId, `Thank you, ${userData.name}! Your information has been saved.`);
    await sendMessage(chatId, 'For any issues, contact: @Praveenkumar157. For more inquiries, send an email to: fimcryptobot@gmail.com');
    await sendMessage(chatId, 'THANK YOU! VISIT AGAIN...');
  } else {
    await sendMessage(chatId, 'Please restart the bot and re-enter your details.');
  }
  await setUserState(chatId, 'START');
}

function getUserDetails(userData: any): string {
  return `
Name: ${userData.name}
WhatsApp: ${userData.whatsapp}
Gmail: ${userData.gmail}
Cryptocurrency: ${userData.crypto}
Plan: ${userData.amount}₹
Wallet Address: ${userData.wallet}
UPI ID: ${userData.upi}
Transaction ID: ${userData.transaction_id}
`;
}

async function sendMessage(chatId: number, text: string, options?: any) {
  await bot.sendMessage(chatId, text, options);
}

