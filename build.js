const fs = require('fs-extra')
const axios = require('axios')
const puppeteer = require('puppeteer')

const gist = 'hunghg255/62e9b8a643b39a04a73096d998f9da70'

async function buildHTML() {
  await fs.remove('./dist')
  await fs.ensureDir('./dist')

  let resume
  if (fs.existsSync('./resume.json')) {
    console.log(`Loading from locale "resume.json"`)
    resume = JSON.parse(fs.readFileSync('./resume.json', 'utf-8'))
  } else {
    console.log(`Downloading resume... [${gist}]`)
    const { data } = await axios.get(`https://gist.githubusercontent.com/${gist}/raw/resume.json?t=${Date.now()}`)
    resume = data
  }
  console.log('Rendering...')
  const html = await require("./index.js").render(resume)
  console.log('Saving file...')
  fs.writeFileSync('./dist/index.html', html, 'utf-8')
  console.log('Done')
  return html
}

async function buildPDF(html) {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage();
  console.log('Opening puppeteer...')
  await page.setContent(html, { waitUntil: 'networkidle0' })
  console.log('Generating PDF...')
  const pdf = await page.pdf({
    format: 'A4',
    displayHeaderFooter: false,
    printBackground: true,
    margin: {
      top: '0.4in',
      bottom: '0.4in',
      left: '0.4in',
      right: '0.4in',
    }
  })
  await browser.close()
  console.log('Saving file...')
  fs.writeFileSync('./dist/resume.pdf', pdf)
  console.log('Done')
  return pdf
}

async function buildAll() {
  const html = await buildHTML()
  await buildPDF(html)
}

buildAll().catch(e => {
  console.error(e)
  process.exit(1)
})
