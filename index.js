var restify = require("restify");
const cheerio = require("cheerio");
const axios = require("axios");


// Used for watinng JS load
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

function parseOps(opsObject) {
  parsedOps = [];

  // Loop through the objects
  opsObject.forEach(function(item, index) {
    let lastParsedObj = parsedOps[parsedOps.length - 1]
    let obj = item
    let objContent = item.insert

    // If first object just add it
    if (index == 0) {
      if (objContent.hasOwnProperty('hotlink')) {
        parsedOps.push({
          type: 'hotlink',
          url: objContent.hotlink.url,
          force: objContent.hotlink.force,
          thumb: objContent.hotlink.thumb
        })
      } else if (objContent.hasOwnProperty('postquote')) {
        let postquote = objContent.postquote
        parsedOps.push({
          type: 'postquote',
          text: postquote.text,
          forumid: postquote.forumid,
          threadid: postquote.threadid,
          postid: postquote.postid,
          postnumber: postquote.postnumber,
          username: postquote.username,
          userid: postquote.userid
        })
      } else {
        parsedOps.push({
          type: 'text',
          text: objContent,
          attributes: obj.attributes ? obj.attributes : null,
          children: []
        })
      }
    } else {
      // Now we need to check if we need to add the current object to the last
      // if it's a text object.
      // hotlinks, postquotes etc, should be it's own seperate object

      if (objContent.hasOwnProperty('hotlink')) {
        parsedOps.push({
          type: 'hotlink',
          url: objContent.hotlink.url,
          force: objContent.hotlink.force,
          thumb: objContent.hotlink.thumb
        })
      } else if (objContent.hasOwnProperty('postquote')) {
        let postquote = objContent.postquote
        parsedOps.push({
          type: 'postquote',
          text: postquote.text,
          forumid: postquote.forumid,
          threadid: postquote.threadid,
          postid: postquote.postid,
          postnumber: postquote.postnumber,
          username: postquote.username,
          userid: postquote.userid
        })
      } else {
        // Merge if same type
        if (lastParsedObj.type === 'text') {

          // Handle list items
          if (obj.attributes && obj.attributes.list) {
            lastChildObj = lastParsedObj.children[lastParsedObj.children.length - 1]

            // Check if it's the first child element
            // If it is, add the attributes to the main text object

            if (lastChildObj) {
              // Is not the first child element
              if (lastChildObj.hasOwnProperty('attributes') && lastChildObj.attributes !== null) {
                lastParsedObj.children[lastParsedObj.children.length - 1].attributes.list = obj.attributes.list
                delete obj.attributes.list
              } else {
                lastParsedObj.children[lastParsedObj.children.length - 1]['attributes'] = {
                  list: obj.attributes.list
                }
                // Delete the old attributes
                delete obj.attributes.list
              }
            } else {
              // Is the first child element
              if (lastParsedObj.hasOwnProperty('attributes') && lastParsedObj.attributes !== null) {
                lastParsedObj.children[lastParsedObj.children.length - 1].attributes.list = obj.attributes.list
                // Delete the old attributes
                delete obj.attributes.list
              } else {
                lastParsedObj['attributes'] = {
                  list: obj.attributes.list
                }
                // Delete the old attributes
                delete obj.attributes.list
              }
            }
          }

          // Add child text element
          lastParsedObj.children.push({
            attributes: obj.attributes ? obj.attributes : null,
            text: objContent
          })
        } else {
          // Push new text obj
          parsedOps.push({
            type: 'text',
            text: objContent,
            attributes: obj.attributes ? obj.attributes : null,
            children: []
          })
        }
      }
    }
  })

  return parsedOps
}


async function forums(req, res, next) {
  let content = await axios.get("https://forum.facepunch.com/f/");
  var $ = cheerio.load(content.data);
  let categories = [];

  $(".forumcategoryblock").each(function(index, element) {
    let categoryName = $(this)
      .find(".categorytitle")
      .text()
      .trim();

    let items = [];

    $(".forumblock").each(function(index, element) {
      let subforums = [];

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
      $(element)
        .find(".forumsubforums>.subforum")
        .each(function(index, subforum) {
          let subforumTitle = $(subforum)
            .find("a")
            .text();
          let subforumId = $(subforum)
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
  let content = await axios.get(
    "https://forum.facepunch.com/f/" + req.params.forumid
  )

  var $ = cheerio.load(content.data);

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
  console.log("Fetching thread");
  let content = await axios.get(
    "https://forum.facepunch.com/f/" +
      req.params.forumid +
      "/" +
      req.params.threadid1 +
      "/" +
      req.params.threadid2 +
      "/" +
      req.params.pagenumber
  );

  var $ = cheerio.load(content.data);

  let posts = [];

  let bgimgRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

  let threadName = $(".threadname")
    .text()
    .trim();

  let currentPage = parseInt(req.params.pagenumber);

  $("postrender").each((index, post) => {
    // Get username
    let postUsername = $(post).attr("username");
    let postUserLevel = parseInt($(post).attr("level"));
    let postUserUrl = $(post).attr("userurl");
    let postUserAvatar = $(post).attr("avatar");

    // Get background image (if any)
    let backgroundImage = null;

    if ($(post).attr("userbackground"))
      backgroundImage = $(post).attr("userbackground");
    let postContent = JSON.parse($(post).attr("input"));
    let parsedContent = parseOps(postContent.ops);

    console.log(parsedContent)

    $(post)
      .find(".ql-editor")
      .children()
      .each((index, contentElement) => {
        let el = $(contentElement);

        // Check what root element it is
        switch (contentElement.name) {
          case "p":
            // Check if it contains any children
            // And see if it's a link or br tag
            if (el.children()[0]) {
              switch (el.children()[0].name) {
                case "a":
                  postContent.push({
                    type: "link",
                    url: $(el.children()[0]).attr("href"),
                    content: $(el.children()[0]).text()
                  });
                  break;
                case "br":
                  postContent.push({
                    type: "newline"
                  });
                  break;
              }
            } else {
              postContent.push({
                type: "text",
                content: el.text()
              });
            }
            break;
          case "postquote":
            postContent.push({
              type: "postquote",
              username: $(contentElement).attr("username"),
              url: $(contentElement)
                .find("a")
                .attr("href"),
              content: $(contentElement)
                .find(".body")
                .text()
            });
            break;
          case "hotlink":
            let hotlinkType = null;

            if ($(contentElement).find("iframe").length > 0)
              hotlinkType = "iframe";
            if ($(contentElement).find(".ec_youtube_root").length > 0)
              hotlinkType = "youtube";
            if ($(contentElement).find("video").length > 0)
              hotlinkType = "video";
            if ($(contentElement).find(".ec_image_root").length > 0)
              hotlinkType = "image";

            // A small "Hack" for twitch and twitter embeds...
            // For some stupid reason, then just checking for iframe,
            // it will not find it.
            if (
              $(contentElement)
                .attr("url")
                .includes("clips.twitch.tv")
            )
              hotlinkType = "twitch-embed";
            if (
              $(contentElement)
                .attr("url")
                .includes("twitter.com")
            )
              hotlinkType = "twitter-embed";

            postContent.push({
              type: "hotlink",
              hotlinkType: hotlinkType,
              url: $(contentElement).attr("url")
            });
            break;
          default:
            postContent.push({
              type: "text",
              content: $(contentElement).text()
            });
            break;
        }
      });

    // Push the post to the list
    posts.push({
      user: {
        username: postUsername,
        userLevel: postUserLevel,
        url: postUserUrl,
        avatar: postUserAvatar ? postUserAvatar : null,
        backgroundImage: backgroundImage
      },
      content: postContent,
      contentParsed: parsedContent
    });
  });

  res.send({
    threadName: threadName,
    currentPage: currentPage,
    totalPages: parseInt($(".pagnation.above>pagnation").attr("total")),
    posts: posts
  });

  next();
}

var server = restify.createServer();
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

server.listen(8080, function() {
  console.log("NewPunch API started...");
  console.log("%s listening at %s", server.name, server.url);
});
