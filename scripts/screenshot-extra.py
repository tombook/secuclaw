from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})

    # Overview page
    page.goto('http://localhost:3200/', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    page.screenshot(path='/tmp/sc-overview.png', full_page=False)
    print("saved overview")

    # AI capability modal — click first AI capability
    page.evaluate("window.location.hash = '#/ciso'")
    page.wait_for_timeout(2500)
    page.evaluate("""() => {
        const shell = document.querySelector('sc-app-shell');
        const rc = shell?.shadowRoot?.querySelector('sc-role-commander');
        const d = rc?.shadowRoot?.querySelector('sc-dashboard-ciso');
        const cap = d?.shadowRoot?.querySelector('.ai-capability');
        if (cap) cap.click();
    }""")
    page.wait_for_timeout(1500)
    page.screenshot(path='/tmp/sc-ai-modal.png', full_page=False)
    print("saved ai-modal")

    browser.close()
