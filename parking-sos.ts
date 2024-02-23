import puppeteer from "puppeteer";
import { Twilio } from "twilio";
import { config } from 'dotenv';

async function checkParkingAvailability() {
  const browser = await puppeteer.launch({ headless: true }); // Launch the browser in headless mode. Set to false to see the browser.
  const page = await browser.newPage(); // Open a new page.
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  try {
    // Navigate to the specified URL.
    await page.goto(
      "https://reservenski.parkpalisadestahoealpine.com/select-parking",
      {
        waitUntil: "networkidle2", // Wait for the network to be idle (no more than 2 connections for at least 500 ms).
      }
    );

    const textSelector = 'div[aria-label="Saturday, February 24"]';
    await page.waitForSelector(textSelector, { visible: true });
    console.log("found date");
    await page.click(textSelector);
    console.log("clicked on the date");
    await delay(5000);

    const noSpotsSelector = "div.RatesPanel_emptyRatesHeadline__QNAAY";
    const noSpotsAvailable = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element
        ? element.textContent?.includes("No available spots")
        : false;
    }, noSpotsSelector);

    // Log the appropriate message based on the presence of the text.
    if (noSpotsAvailable) {
      console.log("No available spots");
    } else {
      console.log("Spots available");
      await sendText("Spots available!");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close(); // Make sure to close the browser.
  }
}

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function sendText(body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const myNumber = process.env.MY_NUMBER!;
  console.log(`Sending text to ${myNumber}`)
  const client = new Twilio(accountSid, authToken);
  client.messages.create({
    body: body,
    to: myNumber,
    from: twilioNumber,
  });
}

config();
checkParkingAvailability();
