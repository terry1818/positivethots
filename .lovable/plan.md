

# Fix Broken YouTube Videos in Education Modules

## Problem
7 section-level video URLs (the primary `content_url` field on Section 2 of various modules) point to unavailable/removed YouTube videos. These are the main video embeds users see when they navigate to a module's video section.

## Broken Videos Found

| Module | Section | Broken Video ID | Status |
|--------|---------|-----------------|--------|
| Boundaries & Communication | S2: Communication Models That Work | `4sCMSqGXB5o` | Not Found |
| Safer Sex Practices | S2: Understanding STIs | `YCIfBk2VYlg` | Not Found |
| Understanding Desire | S2: Desire Discrepancy | `HFHZ5E_P-yI` | Not Found |
| Pleasure & Satisfaction | S2: Erogenous Zones & Techniques | `LVVdg8Xaj1U` | Not Found |
| Sexual Orientation Spectrum | S2: LGBTQ+ Identities | `LnTxfv7rill` | Malformed ID |
| Intersectionality in Intimacy | S2: Race, Culture, and Intimacy | `kYMdJMbWjKc` | Not Found |
| Maintaining Long-term Intimacy | S2: Rekindling Connection | `ierRipP-k2c` | Not Found |

All 5 module-level `video_url` fields and all inline `[youtube:...]` embeds in content text were spot-checked and are working fine.

## Replacements (all verified as available)

| Module | Replacement Video | ID |
|--------|------------------|----|
| Boundaries & Communication | Skills for Healthy Romantic Relationships (TEDxSBU, 7.8M views) | `gh5VhaicC6g` |
| Safer Sex Practices | STD Testing - How To Know If You Have An STD (Planned Parenthood) | `_EKnKJ-Wb-g` |
| Understanding Desire | The secret to desire in a long-term relationship (Esther Perel, TED, 8.4M views) | `sa0RUmGTCYY` |
| Pleasure & Satisfaction | Women's sexual health: desire, arousal, and orgasms (Peter Attia MD) | `_SZUHFA8KyM` |
| Sexual Orientation Spectrum | A More Fluid Understanding of Gender & Sexual Orientation (TEDx) | `CN0Ccb64xjM` |
| Intersectionality in Intimacy | The urgency of intersectionality (Kimberle Crenshaw, TED, 2.4M views) | `akOe5-UsQ2o` |
| Maintaining Long-term Intimacy | The Key Habits for a Successful Relationship (Gottman Institute) | `nQ5DYlbi9y8` |

## Implementation
Single database migration with 7 UPDATE statements to replace the `content_url` values in the `module_sections` table. No code changes needed.

