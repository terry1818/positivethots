// Business details shown in email footers.
//
// CAN-SPAM: every commercial email must carry a valid physical postal address. Fill in
// BUSINESS_MAILING_ADDRESS with the business mailbox (Anytime Mailbox / PMB address, never a home
// address) and redeploy the email functions. While it is empty the footer shows the company name only.
export const BUSINESS_LEGAL_NAME = 'Rhea & Associates LLC'
export const BUSINESS_MAILING_ADDRESS = ''

export const businessFooterLine = (): string =>
  BUSINESS_MAILING_ADDRESS
    ? `${BUSINESS_LEGAL_NAME} · ${BUSINESS_MAILING_ADDRESS}`
    : BUSINESS_LEGAL_NAME
