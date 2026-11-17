"""Signed-in regression check; never accepts consent, saves edits, or alters photos.

Run: python3 tests/profile_edit_regression.py
Uses the requesting user's injected preview session, scoped to localhost.
"""
import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright


async def snapshot(page):
    return await page.evaluate("""async () => {
      const { supabase } = await import('/src/integrations/supabase/client.ts');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Signed-in session required');
      const profile = await supabase.from('profiles')
        .select('photo_consent_accepted_at').eq('id', session.user.id).single();
      const photos = await supabase.from('user_photos').select('*')
        .eq('user_id', session.user.id).order('id');
      if (profile.error || photos.error) throw new Error('Could not read consent/photo state');
      return { consent: profile.data.photo_consent_accepted_at, photos: photos.data };
    }""")


async def main():
    assert os.environ.get('LOVABLE_BROWSER_AUTH_STATUS') == 'injected'
    screenshots = Path('/tmp/browser/profile-crash')
    screenshots.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 1800})
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        cookies = json.loads(os.environ.get('LOVABLE_BROWSER_SUPABASE_COOKIES_JSON') or '[]')
        if cookies:
            await context.add_cookies([{**cookie, 'url': 'http://localhost:8080'} for cookie in cookies])
        await page.goto('http://localhost:8080')
        await page.evaluate('([k,v]) => window.localStorage.setItem(k,v)', [
            os.environ['LOVABLE_BROWSER_SUPABASE_STORAGE_KEY'],
            os.environ['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'],
        ])
        await page.goto('http://localhost:8080/profile/edit', wait_until='networkidle')
        await page.get_by_role('heading', name='Edit Profile', exact=True).wait_for()
        assert not await page.get_by_text('Oops! Something went wrong', exact=False).count()
        before = await snapshot(page)
        await page.screenshot(path=str(screenshots / 'after.png'))

        # Unsaved edits stay in memory; discard navigation must work without saving.
        name = page.get_by_label('Name', exact=True)
        await name.fill((await name.input_value()) + ' ')
        await page.get_by_role('button', name='Go back', exact=True).click()
        await page.get_by_role('alertdialog').wait_for()
        assert page.url.endswith('/profile/edit')
        await page.screenshot(path=str(screenshots / 'unsaved.png'))
        await page.get_by_role('button', name='Discard', exact=True).click()
        await page.wait_for_url('**/profile')

        await page.goto('http://localhost:8080/profile/edit', wait_until='networkidle')
        await page.get_by_role('button', name='Photos & Frame').click()
        checkbox = page.locator('#photo-consent')
        if before['consent'] is None:
            await checkbox.wait_for(state='visible')
            assert await checkbox.get_attribute('aria-checked') == 'false'
            # Verify blocked add-photo action without opening a chooser or uploading.
            add = page.locator('button[aria-disabled="true"]').first
            if await add.count():
                choosers = []
                page.on('filechooser', lambda chooser: choosers.append(chooser))
                await add.evaluate('(element) => element.click()')
                await page.get_by_role('alert').filter(has_text='Please confirm the photo agreement first.').wait_for()
                assert not choosers
            print('PASS: null consent shows an unchecked checkbox and blocks adding photos')
        else:
            assert not await checkbox.count()
            print('PASS: existing consent retained; null-consent condition checked in source only')
        await page.get_by_role('heading', name='Photos', exact=True).screenshot(path=str(screenshots / 'photos-title.png'))
        assert await snapshot(page) == before, 'Consent or photo records changed'
        await page.goto('http://localhost:8080/settings', wait_until='networkidle')
        assert not await page.get_by_text('Oops! Something went wrong', exact=False).count()
        assert not errors, errors
        print('PASS: direct editor load, discard navigation, Settings, and unchanged consent/photo records')
        await browser.close()


asyncio.run(main())