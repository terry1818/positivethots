import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { businessFooterLine } from '../business-info.ts'

const SITE_NAME = "Positive Thots"

interface Props {
  plan?: string
  accessUntil?: string
}

// Sent the moment a member cancels in the app, so they have written proof (California auto-renewal law).
const SubscriptionCancelledEmail = ({ plan, accessUntil }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {plan || 'plan'} is cancelled. You won't be charged again.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your plan is cancelled</Heading>
        <Text style={text}>
          You cancelled your <strong>{plan || 'Positive Thots'}</strong> plan. You won't be charged again.
        </Text>
        <Text style={text}>
          You keep everything in your plan until <strong>{accessUntil || 'the end of your current billing period'}</strong>.
          After that your account stays, with the free features and all your learning progress.
        </Text>
        <Text style={text}>
          Changed your mind? You can start a plan again any time from Premium in the app.
        </Text>
        <Button href="https://positivethots.app/premium" style={button}>Open Positive Thots</Button>
        <Hr style={hr} />
        <Text style={footer}>
          Questions about billing? Email billing@positivethots.org
        </Text>
        <Text style={footer}>{SITE_NAME} — Learn first. Connect better.</Text>
        <Text style={footer}>{businessFooterLine()}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionCancelledEmail,
  subject: 'Your Positive Thots plan is cancelled',
  displayName: 'Subscription cancelled',
  previewData: { plan: 'Premium', accessUntil: 'January 3, 2027' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Inter", Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 24px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const button = { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', padding: '14px 28px', borderRadius: '100px', fontSize: '16px', fontWeight: '600' as const, textDecoration: 'none', display: 'block', textAlign: 'center' as const, margin: '0 0 24px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', textAlign: 'center' as const, margin: '0 0 6px' }
