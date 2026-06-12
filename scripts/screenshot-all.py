from playwright.sync_api import sync_playwright

ROLES = [
    ('ciso', 'ciso', 'CISO 战略仪表盘'),
    ('secuclaw-commander', 'commander', '指挥官态势中心'),
    ('security-ops', 'secops', '安全运营中心'),
    ('security-expert', 'security-expert', '安全专家工作台'),
    ('privacy-officer', 'privacy', '隐私合规中心'),
    ('security-architect', 'architect', '安全架构工作台'),
    ('business-security-officer', 'business', '业务安全中心'),
    ('supply-chain-security', 'supply-chain', '供应链安全中心'),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1100})
    page.goto('http://localhost:3200/', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(1500)
    for roleId, slug, _ in ROLES:
        page.evaluate(f"window.location.hash = '#/{roleId}'")
        page.wait_for_timeout(3000)
        out = f'/tmp/sc-{slug}.png'
        page.screenshot(path=out, full_page=True)
        print(f"saved {out}")
    browser.close()
