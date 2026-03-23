import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Positive Thots"

interface GiftCodeProps {
  code?: string
  tier?: string
  days?: string
  senderName?: string
}

const GiftCodeEmail = ({ code, tier, days, senderName }: GiftCodeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{senderName || 'A friend'} sent you a free {tier || 'Premium'} trial on {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          🎁 You've received a gift!
        </Heading>
        <Text style={text}>
          {senderName || 'A friend'} has gifted you a <strong>{days || '14'}-day free trial</strong> of <strong>{tier || 'Premium'}</strong> on {SITE_NAME}.
        </Text>
        <Text style={text}>
          Use the code below to redeem your gift and unlock all the features:
        </Text>
        <Container style={codeBox}>
          <Text style={codeText}>{code || 'XXXXXXXX'}</Text>
        </Container>
        <Button
          href={`https://positivethots.lovable.app/premium`}
          style={button}
        >
          Redeem Your Gift →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — Education-first dating for the ENM, poly, and queer community.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: GiftCodeEmail,
  subject: (data: Record<string, any>) => `🎁 ${data.senderName || 'A friend'} sent you a gift on Positive Thots!`,
  displayName: 'Gift Code',
  previewData: { code: 'ABCD1234', tier: 'Premium', days: '14', senderName: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Inter", Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 24px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = { background: '#f3f0ff', borderRadius: '12px', padding: '16px', textAlign: 'center' as const, margin: '0 0 24px' }
const codeText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#7c3aed', letterSpacing: '4px', margin: '0', fontFamily: 'monospace' }
const button = { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', padding: '14px 28px', borderRadius: '100px', fontSize: '16px', fontWeight: '600' as const, textDecoration: 'none', display: 'block', textAlign: 'center' as const, margin: '0 0 24px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', textAlign: 'center' as const, margin: '0' }
