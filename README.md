# facepunch-api
A new and working api for the Facepunch forum


## Status
I have finally found out how to scrape the new site, that uses Vue.js, and I'm currently working hard on making the site readable, through the api.

**11/12/18**
Another FP user made me aware we don't need phantomjs at all! Apparently everything we need is delivered to the DOM, and makes is super easy to scrape! And a whole lot faster too!

Now, I'm just making the post parsing work, as they are in the Quill delta format, and I want it in a little different, when I will make the FP app.

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
