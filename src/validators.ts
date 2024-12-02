export function validateName(name: string): boolean {
  return /^[a-zA-Z\s]+$/.test(name);
}

export function validateWhatsApp(number: string): boolean {
  return /^\d{10}$/.test(number);
}

export function validateGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

export function validateCrypto(crypto: string): boolean {
  const validCryptos = ['BNB', 'USDT', 'TON', 'POL', 'SUI', 'NEAR', 'LTC', 'ARB', 'TRX'];
  return validCryptos.includes(crypto);
}

export interface PlanValidationResult {
  valid: boolean;
  amount?: number;
  message?: string;
}

export function validatePlan(plan: string, crypto: string): PlanValidationResult {
  const usdtPlans: { [key: string]: number } = { '1': 92, '2': 184, '3': 276, '4': 368, '5': 458 };
  const otherPlans: { [key: string]: number } = { '1': 55, '2': 97, '3': 194, '4': 291, '5': 388, '6': 485, '7': 680 };

  const plans = crypto === 'USDT' ? usdtPlans : otherPlans;

  if (plan in plans) {
    return { valid: true, amount: plans[plan] };
  } else if (plan === '8') {
    const amount = parseFloat(plan);
    if (isNaN(amount)) {
      return { valid: false, message: 'Invalid amount. Please enter a valid number.' };
    }
    if (crypto === 'USDT' && amount < 5) {
      return { valid: false, message: 'For USDT, the amount should be at least 5 USD.' };
    }
    return { valid: true, amount: crypto === 'USDT' ? amount * 92 : amount * 97 };
  }
  return { valid: false, message: 'Invalid choice. Please choose a valid option (1-7 or 8 for Others).' };
}

export function validateWallet(wallet: string): boolean {
  // This is a basic check. You might want to implement more specific validation based on the cryptocurrency
  return wallet.length > 0;
}

export function validateUPI(upi: string): boolean {
  // Basic UPI ID validation
  return /^[\w.-]+@[\w.-]+$/.test(upi);
}

export function validateTransactionId(transactionId: string): boolean {
  // Basic transaction ID validation
  return transactionId.length > 0;
}

