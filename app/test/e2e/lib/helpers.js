const config = require('./config')

const login = async (page) => {
  await page.evaluate(async (config_ = config) => {
    const data = {
      privKey: config_.testPrivateKey,
      ethAddress: config_.testEthAddress,
    }

    // grabs the vuestore from the first element that has vue attached
    const x = document.querySelector('#app').__vue__.$store
    x.dispatch('addWallet', data)
    x.dispatch('updateSelectedAddress', { selectedAddress: data.ethAddress })
    x.dispatch('subscribeToControllers')
    await x.dispatch('initTorusKeyring', data)
  }, config)
}

const click = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 120000 })
    await page.click(selector)
  } catch (error) {
    throw new Error(`Could not click on selector: ${selector}`)
  }
}

const waitForText = async (page, selector, text, isCaseSensitive = true) => {
  try {
    await page.waitForSelector(selector, { timeout: 120000 })
    await page.waitForFunction(
      (selector_ = selector, text_ = text, isCaseSensitive_ = isCaseSensitive) => {
        let htmlText = document.querySelector(selector_).textContent
        let targetText = text_
        if (!isCaseSensitive_) {
          htmlText = htmlText.toLowerCase()
          targetText = targetText.toLowerCase()
        }
        return htmlText.includes(targetText)
      },
      { timeout: 120000 },
      selector,
      text,
      isCaseSensitive
    )
  } catch (error) {
    throw new Error(error, `Text ${text} not found for selector: ${selector}`)
  }
}

const waitForClass = async (page, selector, className) => {
  try {
    await page.waitForSelector(selector, { timeout: 120000 })
    await page.waitForFunction(
      (selector_ = selector, className_ = className) => document.querySelector(selector_).classList.contains(className_),
      { timeout: 120000 },
      selector,
      className
    )
  } catch (error) {
    throw new Error(`Class ${className} not found for selector: ${selector}`)
  }
}

const shouldExist = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 120000 })
  } catch (error) {
    throw new Error(`Selector ${selector} does not exist`)
  }
}

const navigateTo = async (page, selector, pageContainer) => {
  if (config.isMobile) {
    await click(page, '#menu-dropdown-mobile-btn')
    await page.waitFor(100)
    await click(page, `${selector}-mobile`)
    // wait for animation
    await page.waitFor(100)
    await shouldExist(page, pageContainer)
  } else {
    await click(page, selector)
    await shouldExist(page, pageContainer)
  }
}

const loadUrl = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle0' })
}

const typeText = async (page, text, selector) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 120000 })
    await page.type(selector, text)
  } catch (error) {
    throw new Error(`Could not text into selector: ${selector}`)
  }
}

const shouldTextNotBeEmpty = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { timeout: 120000 })
    await page.waitForFunction((selector_ = selector) => document.querySelector(selector_).textContent !== '', { timeout: 120000 }, selector)
  } catch (error) {
    throw new Error(`Inner text empty for selector: ${selector}`)
  }
}

const shouldValueNotBeEmpty = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { timeout: 120000 })
    await page.waitForFunction((selector_ = selector) => document.querySelector(selector_).value !== '', { timeout: 120000 }, selector)
  } catch (error) {
    throw new Error(`Value text empty for for selector: ${selector}`)
  }
}

const selectItem = async (page, selector, selectorContainer, text) => {
  try {
    await click(page, selector)
    await page.evaluate((text_ = text) => {
      const options = [...document.querySelectorAll('.v-list-item__title')]
      options.forEach((option) => {
        if (option.textContent === text_) option.click()
      })
    }, text)

    await waitForText(page, `${selectorContainer} .v-select__selection`, text)
  } catch (error) {
    throw new Error(`Option ${text} not found for selector: ${selector}`)
  }
}

module.exports = {
  login,
  click,
  waitForText,
  waitForClass,
  shouldExist,
  navigateTo,
  loadUrl,
  typeText,
  shouldTextNotBeEmpty,
  shouldValueNotBeEmpty,
  selectItem,
}
