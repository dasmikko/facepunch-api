var restify = require("restify");
const cheerio = require("cheerio");
var request = require("request");
var striptags = require("striptags");
const phantom = require("phantom");
var _ph, _page, _outObj;
const createPhantomPool = require("phantom-pool");

process.env.CHROME_PATH =
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\Chrome.exe";

const Nick = require("nickjs");
const nick = new Nick({
  resourceTimeout: 100000
});

console.log("Creating PhantomJS pool...");

const pool = createPhantomPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  phantomArgs: [["--ignore-ssl-errors=true", "--disk-cache=true"], {}] // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
});

async function waitFor($config) {
  $config._start = $config._start || new Date();

  if ($config.timeout && new Date() - $config._start > $config.timeout) {
    if ($config.error) $config.error();
    if ($config.debug)
      console.log("timedout " + (new Date() - $config._start) + "ms");
    return;
  }

  if ($config.check()) {
    if ($config.debug)
      console.log("success " + (new Date() - $config._start) + "ms");
    return $config.success();
  }

  setTimeout(waitFor, $config.interval || 0, $config);
}

async function phantomCall(url) {
  return pool
    .use(async instance => {
      const page = await instance.createPage();
      const status = await page.open(url, { operation: "GET" });
      if (status !== "success") {
        throw new Error("cannot open " + url);
      }

      console.log("waiting for page loading");
      let content = await waitFor({
        debug: true, // optional
        interval: 0, // optional
        timeout: 1000, // optional
        check: function() {
          return page.evaluate(function() {
            return $(".postrender").is(":visible");
          });
        },
        success: async function() {
          const content = await page.property("content");
          return content;
        },
        error: function() {
          console.log("Could not get content?");
        } // optional
      });
      return content;
    })
    .then(content => {
      return content;
    });
}

async function phantontest(req, res, next) {
  console.log("Fetching with phantom...");
  let content = await phantomCall("https://forum.facepunch.com/f/");

  var $ = cheerio.load(content);

  let items = [];
  let subforums = [];

  $(".forumblock").each(function(index, element) {
    let id = $(this)
      .find(".bglink")
      .attr("href")
      .substr(1);
    let viewers = $(this)
      .find(".forumtitle span")
      .text();
    $(this)
      .find(".forumtitle span")
      .remove(); // This is needed to get the title correctly.
    let title = $(this)
      .find(".forumtitle")
      .text();
    let icon = $(this)
      .find("img")
      .attr("src");

    let subtitle = $(this)
      .find(".forumsubtitle")
      .text();

    $(this)
      .find(".threadcount")
      .find(".label")
      .remove();
    let threadCount = parseInt(
      $(this)
        .find(".threadcount")
        .attr("title")
        .trim()
        .slice(0, -8)
    );

    $(this)
      .find(".postcount")
      .find(".label")
      .remove();
    let postCount = parseInt(
      $(this)
        .find(".postcount")
        .attr("title")
        .trim()
        .slice(0, -5)
    );

    let latestPost = $(this).find(".forumlastpost");
    let latestPostTitle = latestPost
      .find(".threadname")
      .text()
      .trim();
    let latestPostUsername = latestPost.find(".username a").text();

    let latestPostUserId = latestPost
      .find(".username a")
      .attr("href")
      .substr(3);
    latestPostUserId = latestPostUserId.slice(0, -1);

    let latestPostDate = latestPost.find(".timeago").attr("title");
    let latestPostTimeAgo = latestPost.find(".timeago").text();

    // Loop subforums
    $(this)
      .find(".subforum")
      .each(function(index, subforum) {
        let subforumTitle = $(this)
          .find("a")
          .text();
        let subforumId = $(this)
          .find("a")
          .attr("href")
          .substr(3);
        subforumId = subforumId.slice(0, -1);

        subforums.push({
          id: subforumId,
          title: subforumTitle
        });
      });

    items.push({
      id: id,
      icon: icon,
      title: title.trim(),
      subtitle: subtitle.trim(),
      viewers: viewers,
      threadCount: threadCount,
      postCount: postCount,
      latestPost: {
        title: latestPostTitle,
        timeAgo: latestPostTimeAgo,
        date: latestPostDate,
        user: {
          id: latestPostUserId,
          username: latestPostUsername
        }
      },
      subforums: subforums
    });
  });

  res.send(items);
  next();
}

function respond(req, res, next) {
  res.send("hello " + req.params.name);
  next();
}

async function forums(req, res, next) {
  let content = await phantomCall("https://forum.facepunch.com/f/");
  var $ = cheerio.load(content);
  let categories = [];

  $(".forumcategoryblock").each(function(index, element) {
    let categoryName = $(this)
      .find(".categorytitle")
      .text()
      .trim();

    let items = [];
    let subforums = [];

    $(".forumblock").each(function(index, element) {
      let id = $(this)
        .find(".bglink")
        .attr("href")
        .substr(1);
      let viewers = $(this)
        .find(".forumtitle span")
        .text();
      $(this)
        .find(".forumtitle span")
        .remove(); // This is needed to get the title correctly.
      let title = $(this)
        .find(".forumtitle")
        .text();
      let icon = $(this)
        .find("img")
        .attr("src");

      let subtitle = $(this)
        .find(".forumsubtitle")
        .text();

      $(this)
        .find(".threadcount")
        .find(".label")
        .remove();
      let threadCount = parseInt(
        $(this)
          .find(".threadcount")
          .attr("title")
          .trim()
          .slice(0, -8)
      );

      $(this)
        .find(".postcount")
        .find(".label")
        .remove();
      let postCount = parseInt(
        $(this)
          .find(".postcount")
          .attr("title")
          .trim()
          .slice(0, -5)
      );

      let latestPost = $(this).find(".forumlastpost");
      let latestPostTitle = latestPost
        .find(".threadname")
        .text()
        .trim();
      let latestPostUsername = latestPost.find(".username a").text();

      let latestPostUserId = latestPost
        .find(".username a")
        .attr("href")
        .substr(3);
      latestPostUserId = latestPostUserId.slice(0, -1);

      let latestPostDate = latestPost.find(".timeago").attr("title");
      let latestPostTimeAgo = latestPost
        .find(".timeago")
        .text()
        .trim();

      // Loop subforums
      $(this)
        .find(".subforum")
        .each(function(index, subforum) {
          let subforumTitle = $(this)
            .find("a")
            .text();
          let subforumId = $(this)
            .find("a")
            .attr("href")
            .substr(3);
          subforumId = subforumId.slice(0, -1);

          subforums.push({
            id: subforumId,
            title: subforumTitle
          });
        });

      items.push({
        id: id,
        icon: icon,
        title: title.trim(),
        subtitle: subtitle.trim(),
        viewers: viewers,
        threadCount: threadCount,
        postCount: postCount,
        latestPost: {
          title: latestPostTitle,
          timeAgo: latestPostTimeAgo,
          date: latestPostDate,
          user: {
            id: latestPostUserId,
            username: latestPostUsername
          }
        },
        subforums: subforums
      });
    }); // Forums

    categories.push({
      categoryName: categoryName,
      forums: items
    });
  }); // Categories
  res.send(categories);
  next();
}

async function forum(req, res, next) {
  let content = await phantomCall(
    "https://forum.facepunch.com/f/" + req.params.forumid
  );

  console.log(content);
  var $ = cheerio.load(content);

  let threads = [];

  $(".threadblock").each(function(index, element) {
    let url = $(this)
      .find(".threadtitle a")
      .attr("href");
    let title = $(this)
      .find(".threadtitle a")
      .text()
      .trim();
    let icon = $(this)
      .find("img")
      .attr("src");

    let threadsubforum = $(this)
      .find(".threadsubforum")
      .attr("title"); //
    if (threadsubforum) {
      threadsubforum = threadsubforum
        .replace('Posted in the "', "")
        .replace('" Subforum', "");
    }

    // Creator
    let opUsername = $(this)
      .find(".creator .username")
      .text()
      .trim();
    let opUrl = $(this)
      .find(".creator .username a")
      .attr("href");
    let opId = $(this)
      .find(".creator .username a")
      .attr("href")
      .substr(3)
      .slice(0, -1);

    $(this)
      .find(".threadage>div>.label")
      .remove(); // remove the label
    let threadage = parseInt(
      $(this)
        .find(".threadage>div")
        .text()
        .trim()
    );

    $(this)
      .find(".viewedcount>div>.label")
      .remove(); // remove the label
    let viewedcount = parseInt(
      $(this)
        .find(".viewedcount")
        .attr("title")
        .replace(" members viewed this thread", "")
    );

    $(this)
      .find(".postcount>div>.label")
      .remove(); // remove the label
    let postcount = parseInt(
      $(this)
        .find(".postcount>div")
        .text()
        .trim()
    );

    let threadlastpost = $(this).find(".threadlastpost");
    let threadlastpostUsername = $(threadlastpost)
      .find(".username")
      .text()
      .trim();

    threads.push({
      url: url,
      title: title,
      icon: icon,
      threadsubforum: threadsubforum,
      threadage: threadage,
      viewedcount: viewedcount,
      postcount: postcount,
      creator: {
        id: opId,
        username: opUsername,
        url: opUrl
      },
      threadlastpost: {
        username: threadlastpostUsername
      }
    });
  });
  res.send(threads);
  next();
}

async function thread(req, res, next) {
  console.log('Fetching thread')
  let content = await phantomCall(
    "https://forum.facepunch.com/f/" +
      req.params.forumid +
      "/" +
      req.params.threadid1 +
      "/" +
      req.params.threadid2 +
      "/" +
      req.params.pagenumber
  );

  var $ = cheerio.load(content);

  let posts = [];

  let bgimgRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

  let threadName = $(".threadname")
    .text()
    .trim();
  let currentPage = req.params.pagenumber;

  $(".postblock").each((index, element) => {
    // Get username
    let postUsername = $(element).find(".username>.inner>a").text().trim()

    // Get background image (if any)
    let backgroundImage = null;
    if (bgimgRegex.exec($(element).find(".background-image").attr("style"))) {
      backgroundImage = bgimgRegex.exec($(element).find(".background-image").attr("style"))[0]
    }

    // Push the post to the list
    posts.push({
      user: {
        username: postUsername,
        backgroundImage: backgroundImage
      }
    });
  });

  res.send({
    threadName: threadName,
    currentPage: currentPage,
    posts: posts
  });

  next();
}

var server = restify.createServer();
server.get("/hello/:name", respond);
server.head("/hello/:name", respond);

// Home
server.get("/", forums);
server.head("/", forums);

// Also home
server.get("/f/", forums);
server.head("/f/", forums);

// Single forum
server.get("/f/:forumid", forum);
server.head("/f/:forumid", forum);

// Thread
// https://forum.facepunch.com/general/bunmb/Inside-a-Flat-Earth-Conference/1/
server.get("/:forumid/:threadid1/:threadid2/:pagenumber", thread);
server.head("/:forumid/:threadid1/:threadid2/:pagenumber", thread);
server.get("/:forumid/:threadid1/:threadid2/:pagenumber/", thread);
server.head("/:forumid/:threadid1/:threadid2/:pagenumber/", thread);

// PHANTOM
server.get("/phantom", phantontest);
server.head("/phantom", phantontest);

server.listen(8080, function() {
  console.log("NewPunch API started...");
  console.log("%s listening at %s", server.name, server.url);
});
