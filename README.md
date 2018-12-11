# facepunch-api
A new and working api for the Facepunch forum

It's sadly not the fastest, as it needs to spin up a headless chrome browser, and wait for the JS to load, to scrape everything.

To combat this, I'm using a PhantomJS pool, to keep some browsers alive, and make the whole fetching faster.

## Status
I have finally found out how to scrape the new site, that uses Vue.js, and I'm currently working hard on making the site readable, through the api.

## What can be scraped?
- Category page
- Single Forum
- Threads

It still needs a bit of work, but it's a great POC that FP can be scraped for API use.

## What is missing?
- [ ] Post ratings
- [ ] Authentication
- [ ] Thread making
- [ ] Posting
- [ ] User profiles
- [ ] Search page
- [ ] User notifications
- [ ] Settings page
- [ ] API documentation

## Helping
Feel free to help on the project! 
