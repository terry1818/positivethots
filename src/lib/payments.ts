// One place that says whether money can change hands in the app.
//
// PAYMENTS_OPEN is false until the new payment processor's checkout is wired in. While it is false,
// screens show plans and prices but offer no button that would start a checkout, because every
// checkout call would fail. Set it to true in the same change that replaces the checkout functions.
export const PAYMENTS_OPEN = false;

// Thots Coins: nothing in the app grants coins and nothing a coin buys is delivered yet. While this
// is false the Wallet shows what a member really holds and does not offer to buy, earn or spend coins.
export const COINS_LIVE = false;
