"""Regression test: long scene names must wrap below the scene controls.
Run with a local server serving the repository on port 8000.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('PARLIAMO_TEST_URL', 'http://127.0.0.1:8000')
LABELS = [
    'Il bambino mangia la pizza con la mamma mentre il papà prepara la tavola in cucina',
    'PittogrammaConUnNomeMoltoLungoSenzaSpazi' * 4,
]

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True, args=['--no-sandbox'])
    for width, height in [(1440, 900), (390, 844), (320, 568), (844, 390)]:
        page = browser.new_page(viewport={'width': width, 'height': height},
                                is_mobile=width < 900, has_touch=width < 900)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('https://static.arasaac.org/**', lambda route: route.fulfill(
            path=str(ROOT / 'icon-192.png'), content_type='image/png'))
        page.goto(URL, wait_until='domcontentloaded')
        for game in [False, True]:
            page.evaluate('''game => {
                if (gameActive !== game) toggleGame();
                if (game) {
                    gameRunning = true;
                    document.body.classList.add('game-running');
                }
            }''', game)
            for label in LABELS:
                page.evaluate('''label => {
                    scenesData = [{label, image:'icon-192.png'}];
                    showScene(0);
                }''', label)
                eye = page.locator('[aria-label="Mostra o nascondi nome"]')
                assert page.locator('#sceneDisplayLabel').is_hidden()
                eye.click()
                text = page.locator('#sceneDisplayLabel')
                assert text.is_visible() and text.inner_text() == label.lower()
                metrics = text.evaluate('''el => ({
                    clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
                    clientHeight: el.clientHeight, scrollHeight: el.scrollHeight,
                    lineHeight: parseFloat(getComputedStyle(el).lineHeight)
                })''')
                assert metrics['scrollWidth'] <= metrics['clientWidth'] + 1, metrics
                assert metrics['scrollHeight'] <= metrics['clientHeight'] + 1, metrics
                assert metrics['clientHeight'] >= metrics['lineHeight'], metrics
                if width <= 390:
                    assert metrics['clientHeight'] > 2 * metrics['lineHeight'], metrics
                box = text.bounding_box()
                for button in page.locator('#sceneDisplay button:visible').all():
                    b = button.bounding_box()
                    assert (box['y'] >= b['y'] + b['height'] or
                            box['x'] >= b['x'] + b['width'] or
                            box['x'] + box['width'] <= b['x']), (box, b)
                # The containing scene grows to include every line.
                scene = page.locator('#sceneDisplay').bounding_box()
                assert box['y'] + box['height'] <= scene['y'] + scene['height']
                # Even in the compact game panel, the last line is reachable.
                text.evaluate('(el) => el.scrollIntoView({block:"end"})')
                if game:
                    panel = page.locator('#gamePanel').bounding_box()
                    box = text.bounding_box()
                    assert box['y'] + box['height'] <= panel['y'] + panel['height'] + 1
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                eye.click()
                assert text.is_hidden()
            page.screenshot(path=f'/tmp/parliamo-label-{width}-{game}.png')
        assert not errors, errors
        page.close()
        print(f'PASS scene label {width}x{height}: PARLIAMO/gioCAA, long names, no overlap or clipping')
    browser.close()
