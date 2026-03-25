import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Positive Thots"

interface OnboardingIncompleteProps {
  firstName?: string
}

const OnboardingIncompleteEmail = ({ firstName }: OnboardingIncompleteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your profile is waiting for you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Your profile is waiting for you 🌟
        </Heading>
        <Text style={text}>
          Hey {firstName || 'there'}, you started building your {SITE_NAME} profile but haven't
          finished yet. It only takes a few more minutes — and once you're done, you'll unlock
          Discovery and start connecting with your community.
        </Text>
        <Button
          href="https://positivethots.app/onboarding"
          style={button}
        >
          Finish My Profile →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — Education-first relationship wellness for the ENM, poly, and queer community.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OnboardingIncompleteEmail,
  subject: 'Your profile is waiting for you',
  displayName: 'Onboarding Incomplete',
  previewData: { firstName: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Inter", Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 24px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const button = { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', padding: '14px 28px', borderRadius: '100px', fontSize: '16px', fontWeight: '600' as const, textDecoration: 'none', display: 'block', textAlign: 'center' as const, margin: '0 0 24px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', textAlign: 'center' as const, margin: '0' }
