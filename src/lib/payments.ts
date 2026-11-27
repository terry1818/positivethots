// One place that says whether money can change hands in the app.
//
// PAYMENTS_OPEN stays false until CCBill approves the account and the CCBILL_* secrets are set
// (see docs/ccbill-go-live.md). The CCBill checkout, webhook and cancel functions are built and
// deployed; while this is false, screens show plans and prices but no button starts a checkout.
// Flip it to true as the last go-live step, after one real test purchase works.
export const PAYMENTS_OPEN = false;

// Thots Coins: nothing in the app grants coins and nothing a coin buys is delivered yet. While this
// is false the Wallet shows what a member really holds and does not offer to buy, earn or spend coins.
export const COINS_LIVE = false;
