import TelegramBot from 'node-telegram-bot-api';
import { saveUser, getUserState, setUserState, setUserData, getUserData, clearUserData } from './db.js';
import { sendEmail } from './email.js';
import { validateName, validateWhatsApp, validateGmail, validateCrypto, validatePlan, validateWallet, validateUPI, validateTransactionId } from './validators.js';

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: false });

export async function handleUpdate(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const currentState = await getUserState(chatId);

    switch (currentState) {
      case 'START':
        await handleStart(bot, chatId);
        break;
      case 'NAME':
        await handleName(bot, chatId, text);
        break;
      case 'WHATSAPP':
        await handleWhatsApp(bot, chatId, text);
        break;
      case 'GMAIL':
        await handleGmail(bot, chatId, text);
        break;
      case 'CHOOSE_CRYPTO':
        await handleChooseCrypto(bot, chatId, text);
        break;
      case 'SELECT_PLAN':
        await handleSelectPlan(bot, chatId, text);
        break;
      case 'ENTER_AMOUNT':
        await handleEnterAmount(bot, chatId, text);
        break;
      case 'WALLET':
        await handleWallet(bot, chatId, text);
        break;
      case 'GETUPI':
        await handleGetUPI(bot, chatId, text);
        break;
      case 'PAYMENT_CONFIRMATION':
        await handlePaymentConfirmation(bot, chatId, text);
        break;
      case 'USERDETAILS':
        await handleUserDetails(bot, chatId, text);
        break;
      default:
        await handleStart(bot, chatId);
    }
  } catch (error) {
    console.error('Error handling update:', error);
    await sendMessage(bot, chatId, 'An error occurred. Please try again later.');
  }
}

async function handleStart(bot: TelegramBot, chatId: number) {
  await setUserState(chatId, 'NAME');
  await sendMessage(bot, chatId, 'Welcome to FIM CRYPTO EXCHANGE! Please provide your name (letters only):');
}

async function handleName(bot: TelegramBot, chatId: number, text: string) {
  if (validateName(text)) {
    await setUserData(chatId, 'name', text);
    await setUserState(chatId, 'WHATSAPP');
    await sendMessage(bot, chatId, 'Name saved! Please enter your WhatsApp number (10 digits):');
  } else {
    await sendMessage(bot, chatId, 'Invalid name. Please enter only letters.');
  }
}

async function handleWhatsApp(bot: TelegramBot, chatId: number, text: string) {
  if (validateWhatsApp(text)) {
    await setUserData(chatId, 'whatsapp', text);
    await setUserState(chatId, 'GMAIL');
    await sendMessage(bot, chatId, 'WhatsApp number saved! Please enter your Gmail address:');
  } else {
    await sendMessage(bot, chatId, 'Invalid WhatsApp number. Enter a 10-digit number.');
  }
}

async function handleGmail(bot: TelegramBot, chatId: number, text: string) {
  if (validateGmail(text)) {
    await setUserData(chatId, 'gmail', text);
    await setUserState(chatId, 'CHOOSE_CRYPTO');
    await sendMessage(bot, chatId, 'Gmail saved! Choose your cryptocurrency:', {
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
    await sendMessage(bot, chatId, 'Invalid Gmail. Enter a valid Gmail address.');
  }
}

async function handleChooseCrypto(bot: TelegramBot, chatId: number, text: string) {
  if (validateCrypto(text)) {
    await setUserData(chatId, 'crypto', text);
    await setUserState(chatId, 'SELECT_PLAN');
    const planDescription = text === 'USDT'
      ? "Now, choose a plan by entering the number (1-8):\n1. 1$ - 92₹\n2. 2$ - 184₹\n3. 3$ - 276₹\n4. 4$ - 368₹\n5. 5$ - 458₹\n8. Others (Enter your amount in dollars):"
      : "Now, choose a plan by entering the number (1-8):\n1. 0.5$ - 55₹\n2. 1$ - 97₹\n3. 2$ - 194₹\n4. 3$ - 291₹\n5. 4$ - 388₹\n6. 5$ - 485₹\n7. 7$ - 680₹\n8. Others (Enter your amount in dollars):";
    await sendMessage(bot, chatId, planDescription);
  } else {
    await sendMessage(bot, chatId, 'Invalid cryptocurrency. Please choose from the options provided.');
  }
}

async function handleSelectPlan(bot: TelegramBot, chatId: number, text: string) {
  const userData = await getUserData(chatId);
  const crypto = userData.crypto || ''; 
  const planResult = validatePlan(text, crypto);

  if (planResult.valid) {
    if (text === '8') {
      await setUserState(chatId, 'ENTER_AMOUNT');
      const message = planResult.message || 'Enter the amount:';
      await sendMessage(bot, chatId, message);
    } else if (planResult.amount !== undefined) {
      await setUserData(chatId, 'amount', planResult.amount.toString());
      await setUserState(chatId, 'WALLET');
      await sendMessage(bot, chatId, `Plan selected: ${planResult.amount}₹\nNow, enter your wallet address:`);
    }
  } else {
    await sendMessage(bot, chatId, planResult.message || 'Invalid plan selection.');
  }
}

async function handleEnterAmount(bot: TelegramBot, chatId: number, text: string) {
  const userData = await getUserData(chatId);
  const crypto = userData.crypto;
  const inputAmount = parseFloat(text);

  if (isNaN(inputAmount)) {
    await sendMessage(bot, chatId, 'Please enter a valid number.');
    return;
  }

  let calculatedAmount: number;
  if (crypto === 'USDT') {
    if (inputAmount < 5) {
      await sendMessage(bot, chatId, 'Please enter an amount of at least 5$.');
      return;
    }
    calculatedAmount = inputAmount * 92;
  } else {
    calculatedAmount = inputAmount * 97;
  }

  const maxAmount = 999999999999.99; 

  if (calculatedAmount > maxAmount) {
    await sendMessage(bot, chatId, 'Amount too large. Please enter a smaller amount.');
    return;
  }

  await setUserData(chatId, 'amount', calculatedAmount.toString());
  await setUserState(chatId, 'WALLET');
  await sendMessage(bot, chatId, `Amount set to ${calculatedAmount.toFixed(2)}₹\nNow, enter your wallet address:`);
}

async function handleWallet(bot: TelegramBot, chatId: number, text: string) {
  if (validateWallet(text)) {
    await setUserData(chatId, 'wallet', text);
    await setUserState(chatId, 'GETUPI');
    const amount = (await getUserData(chatId)).amount;
    const ownerUpiId = process.env.OWNER_UPI_ID || 'Default UPI ID';
    await sendMessage(bot, chatId, `Wallet address saved! Proceed to payment: Pay ${amount} to UPI ID: ${ownerUpiId}.`);
    
    await bot.sendPhoto(chatId, 'owner_upi_qrcode.jpg', { caption: 'Scan this QR code to pay' });
    
    await sendMessage(bot, chatId, 'Please enter your UPI ID:');
  } else {
    await sendMessage(bot, chatId, 'Invalid wallet address. Please enter a valid address.');
  }
}

async function handleGetUPI(bot: TelegramBot, chatId: number, text: string) {
  if (validateUPI(text)) {
    await setUserData(chatId, 'upi', text);
    await setUserState(chatId, 'PAYMENT_CONFIRMATION');
    await sendMessage(bot, chatId, 'UPI ID Saved! Enter your Transaction ID:');
  } else {
    await sendMessage(bot, chatId, 'Invalid UPI ID. Please enter a valid UPI ID.');
  }
}

async function handlePaymentConfirmation(bot: TelegramBot, chatId: number, text: string) {
  if (validateTransactionId(text)) {
    await setUserData(chatId, 'transaction_id', text);
    await setUserState(chatId, 'USERDETAILS');
    const userData = await getUserData(chatId);
    const userDetails = getUserDetails(userData);
    await sendMessage(bot, chatId, userDetails);
    await sendMessage(bot, chatId, 'Confirm your details (yes/no):');
  } else {
    await sendMessage(bot, chatId, 'Invalid Transaction ID. Please enter a valid Transaction ID.');
  }
}

interface UserData {
  name: string;
  whatsapp: string;
  gmail: string;
  crypto: string;
  amount: string;
  wallet: string;
  upi: string;
  transaction_id: string;
}

async function handleUserDetails(bot: TelegramBot, chatId: number, text: string) {
  if (text.toLowerCase() === 'yes') {
    const userData = await getUserData(chatId);
    if (isValidUserData(userData)) {
      await saveUser(userData);
      await sendEmail(userData);
      await clearUserData(chatId);
      await sendMessage(bot, chatId, `Thank you, ${userData.name}! Your information has been saved.`);
      await sendMessage(bot, chatId, 'For any issues, contact: @Praveenkumar157. For more inquiries, send an email to: fimcryptobot@gmail.com');
      await sendMessage(bot, chatId, 'THANK YOU! VISIT AGAIN...');
    } else {
      await sendMessage(bot, chatId, 'Error: Incomplete user data. Please restart the bot and re-enter your details.');
    }
  } else {
    await sendMessage(bot, chatId, 'Please restart the bot and re-enter your details.');
  }
  await setUserState(chatId, 'START');
}

function isValidUserData(userData: Partial<UserData>): userData is UserData {
  return !!(userData.name && userData.whatsapp && userData.gmail && userData.crypto && 
            userData.amount && userData.wallet && userData.upi && userData.transaction_id);
}

function getUserDetails(userData: Partial<UserData>): string {
  return `
Name: ${userData.name || 'N/A'}
WhatsApp: ${userData.whatsapp || 'N/A'}
Gmail: ${userData.gmail || 'N/A'}
Cryptocurrency: ${userData.crypto || 'N/A'}
Plan: ${userData.amount || 'N/A'}₹
Wallet Address: ${userData.wallet || 'N/A'}
UPI ID: ${userData.upi || 'N/A'}
Transaction ID: ${userData.transaction_id || 'N/A'}
`;
}

async function sendMessage(bot: TelegramBot, chatId: number, text: string, options?: any) {
  await bot.sendMessage(chatId, text, options);
}

