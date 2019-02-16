var restify = require("restify");
const cheerio = require("cheerio");
const axios = require("axios");
const nodeEval = require("node-eval");
var QuillDeltaToHtmlConverter = require("quill-delta-to-html")
  .QuillDeltaToHtmlConverter;

const emotes =
{
  "1": { "EmoteId": 1, "Name": "Smile", "Url": "https://files.facepunch.com/garry/7c295d98-e496-4171-b9e9-8a1a5b9a752c.png", "Code": ":)", "Width": "17", "Height": "17" },
  "2": { "EmoteId": 2, "Name": "Shock", "Url": "https://files.facepunch.com/garry/8f54ba59-eafb-43e9-8932-37da6c7ff7d6.gif", "Code": ":o", "Width": "17", "Height": "26" },
  "3": { "EmoteId": 3, "Name": "Gross", "Url": "https://files.facepunch.com/garry/d94cc811-e04c-4eed-8f30-3ee367889c0b.png", "Code": ":gross:", "Width": "17", "Height": "17" },
  "5": { "EmoteId": 5, "Name": "D-Smiley", "Url": "https://files.facepunch.com/garry/fd5e41fc-255f-46b8-a1e4-79c4f7bb4005.png", "Code": ":D", "Width": "17", "Height": "17" },
  "6": { "EmoteId": 6, "Name": "Sad", "Url": "https://files.facepunch.com/garry/e4f979d2-7c3f-476c-a893-23d1375c94e5.png", "Code": ":(", "Width": "17", "Height": "17" },
  "7": { "EmoteId": 7, "Name": "Cool", "Url": "https://files.facepunch.com/garry/23718818-dc19-4bb6-b499-2d8e43e255f7.gif", "Code": ":cool:", "Width": "17", "Height": "17" },
  "8": { "EmoteId": 8, "Name": "Zipped", "Url": "https://files.facepunch.com/garry/566a8505-1567-442a-9643-711bd9d4a3da.png", "Code": ":x", "Width": "17", "Height": "17" },
  "9": { "EmoteId": 9, "Name": "Cry", "Url": "https://files.facepunch.com/garry/a70a366b-2630-404b-a434-9f6e85001155.gif", "Code": ":'(", "Width": "17", "Height": "17" },
  "10": { "EmoteId": 10, "Name": "Wow", "Url": "https://files.facepunch.com/garry/0bd96b11-05b1-4664-bef1-29597661b7e4.gif", "Code": ":wow:", "Width": "28", "Height": "17" },
  "11": { "EmoteId": 11, "Name": "Excited", "Url": "https://files.facepunch.com/garry/471def29-4d4c-45c1-b75c-73d28a06af44.gif", "Code": ":excited:", "Width": "25", "Height": "25" },
  "12": { "EmoteId": 12, "Name": "V", "Url": "https://files.facepunch.com/garry/a3ae7542-886f-4b69-966b-1ff07ab64461.png", "Code": ":v:", "Width": "17", "Height": "17" },
  "14": { "EmoteId": 14, "Name": "Fap", "Url": "https://files.facepunch.com/garry/d2f3140d-5539-4596-838e-dfe2823ccc5d.gif", "Code": ":fap:", "Width": "22", "Height": "17" },
  "15": { "EmoteId": 15, "Name": "Huh", "Url": "https://files.facepunch.com/garry/786c8d33-b7bd-4241-88ed-f9c030636513.gif", "Code": ":huh:", "Width": "23", "Height": "26" },
  "16": { "EmoteId": 16, "Name": "Rolleyes", "Url": "https://files.facepunch.com/garry/57482028-86a6-46e3-aaf7-be5dd9804a37.gif", "Code": ":rolleyes:", "Width": "17", "Height": "17" },
  "17": { "EmoteId": 17, "Name": "Words", "Url": "https://files.facepunch.com/garry/6b639ce9-2294-44d6-b470-edda6aedb679.gif", "Code": ":words:", "Width": "77", "Height": "17" },
  "18": { "EmoteId": 18, "Name": "Quagmire", "Url": "https://files.facepunch.com/garry/58eb431e-73d1-467d-9f40-1c6edc1203ea.gif", "Code": ":quagmire:", "Width": "22", "Height": "24" },
  "19": { "EmoteId": 19, "Name": "Dance", "Url": "https://files.facepunch.com/garry/11ade80f-d97b-4171-958c-33b94e9eb805.gif", "Code": ":dance:", "Width": "25", "Height": "19" },
  "20": { "EmoteId": 20, "Name": "Postal's Ass", "Url": "https://files.facepunch.com/garry/9b68c6b4-4aad-4e3c-b957-e012f8171ca3.png", "Code": ":ass:", "Width": "25", "Height": "25" },
  "21": { "EmoteId": 21, "Name": "Mushroom", "Url": "https://files.facepunch.com/garry/fdfaf3d5-94e3-4537-9183-f6333d7a71c6.gif", "Code": ":mushroom:", "Width": "16", "Height": "16" },
  "22": { "EmoteId": 22, "Name": "Coin", "Url": "https://files.facepunch.com/garry/af4da1ad-2ba9-4768-b95c-e6afb0892a39.gif", "Code": ":coin:", "Width": "12", "Height": "16" },
  "23": { "EmoteId": 23, "Name": "Wok", "Url": "https://files.facepunch.com/garry/cc9ee388-8bab-48f0-ab6e-f5c052456d4b.png", "Code": ":wok:", "Width": "52", "Height": "23" },
  "24": { "EmoteId": 24, "Name": "Saddowns", "Url": "https://files.facepunch.com/garry/89a83759-9ca9-460c-941e-a87f52073011.png", "Code": ":saddowns:", "Width": "17", "Height": "17" },
  "25": { "EmoteId": 25, "Name": "Garry Spin", "Url": "https://files.facepunch.com/garry/855cfed5-5e24-4f34-8289-f8b799cd93c2.gif", "Code": ":garry:", "Width": "20", "Height": "25" },
}


async function forums(req, res, next) {
  let content = await axios.get(
    "https://forum.facepunch.com/f/",
    {
      headers: {
          Cookie: req.header('cookie') ? req.header('cookie') : null
      }
    }
  );
  var $ = cheerio.load(content.data);
  let categories = [];

  $(".forumcategoryblock").each(function(index, category) {
    let categoryName = $(this)
      .find(".categorytitle")
      .text()
      .trim();

    let items = [];

    $(category)
      .find(".forumblock")
      .each(function(index, element) {
        let subforums = [];

        let id = $(element)
          .find(".bglink")
          .attr("href")
          .substr(1);
        let viewers = parseInt(
          $(element)
            .find(".forumtitle span")
            .text()
        );
        $(element)
          .find(".forumtitle span")
          .remove(); // This is needed to get the title correctly.
        let title = $(element)
          .find(".forumtitle")
          .text();
        let icon = $(element)
          .find("img")
          .attr("src");

        let subtitle = $(element)
          .find(".forumsubtitle")
          .text();

        $(element)
          .find(".threadcount")
          .find(".label")
          .remove();
        let threadCount = parseInt(
          $(element)
            .find(".threadcount")
            .attr("title")
            .trim()
            .slice(0, -8)
        );

        $(element)
          .find(".postcount")
          .find(".label")
          .remove();
        let postCount = parseInt(
          $(element)
            .find(".postcount")
            .attr("title")
            .trim()
            .slice(0, -5)
        );

        let latestPost = $(element).find(".forumlastpost");
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

            subforums.push({ id: subforumId, title: subforumTitle });
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
  let currentPage = req.params.pagenumber ? parseInt(req.params.pagenumber) : 1

  let content = null;

  if (currentPage > 1) {
    content = await axios.get(
      "https://forum.facepunch.com/f/" + req.params.forumid + '/p/' + currentPage,
      {
        headers: {
            Cookie: req.header('cookie') ? req.header('cookie') : null
        }
      }
    );
  } else {
    content = await axios.get(
      "https://forum.facepunch.com/f/" + req.params.forumid,
      {
        headers: {
            Cookie: req.header('cookie') ? req.header('cookie') : null
        }
      }
    );
  }
  

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

    let isSticky = $(this).hasClass("is-sticky");

    let isLocked = $(this).hasClass("is-closed");

    let isSeen = $(this).hasClass("has-seen");


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

    let opRank = 'normal'

    if ($(this).find('.username').hasClass('user-gold')) opRank = 'gold'
    if ($(this).find('.username').hasClass('user-moderator')) opRank = 'moderator'
    if ($(this).find('.username ').hasClass('user-admin')) opRank = 'admin'

    let isOnline = false
    if ($(this).find('.username ').hasClass('user-online')) isOnline = true

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

    let unreadPostsCount = parseInt($(this).find(".unreadposts").text());

    if (isNaN(unreadPostsCount)) {
      unreadPostsCount = 0
    }

    let lastUnreadUrl = $(this).find(".bglink").attr("href");


    threads.push({
      url: url,
      lastUnreadUrl: lastUnreadUrl,
      title: title,
      icon: icon,
      isSticky: isSticky,
      isLocked: isLocked,
      isSeen: isSeen,
      threadsubforum: threadsubforum,
      threadagedays: threadage,
      viewedcount: viewedcount,
      postcount: postcount,
      unreadPostsCount: unreadPostsCount,
      creator: {
        id: opId,
        username: opUsername,
        url: opUrl,
        rank: opRank,
        isOnline: isOnline
      },
      threadlastpost: {
        username: threadlastpostUsername
      }
    });
  });
  
  
  let totalThreads = parseInt($(".pagnation.above>pagnation").attr("total"))
  let perPage = parseInt($(".pagnation.above>pagnation").attr("perpage"))
  let totalPages = totalThreads / perPage

  res.send({
    totalThreads: totalThreads,
    currentPage: currentPage,
    totalPages: Math.ceil(totalPages),
    threads: threads
  });
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
      req.params.pagenumber,
      {
        headers: {
            Cookie: req.header('cookie') ? req.header('cookie') : null
        }
      }
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
    let postUserCountry = $(post).attr("country");

    let postUserRank = "normal";
    if (
      $(post)
        .attr("userclass")
        .includes("user-gold")
    )
      postUserRank = "gold";
    if (
      $(post)
        .attr("userclass")
        .includes("user-moderator")
    )
      postUserRank = "moderator";
    if (
      $(post)
        .attr("userclass")
        .includes("user-admin")
    )
      postUserRank = "admin";

    // Get background image (if any)
    let backgroundImage = null;

    if ($(post).attr("userbackground"))
      backgroundImage = $(post).attr("userbackground");
    let postContent = JSON.parse($(post).attr("input"));

    postContent.ops.forEach((el, index) => {
      if (el.insert.hasOwnProperty("hotlink")) {
        el.attributes = {
          renderAsBlock: true
        };
      }

      if (el.insert.hasOwnProperty("postquote")) {
        el.attributes = {
          renderAsBlock: true
        };
      }
    });

    var cfg = {};
    var converter = new QuillDeltaToHtmlConverter(postContent.ops, cfg);

    converter.renderCustomWith(function(customOp, contextOp) {
      if (customOp.insert.type === "hotlink") {
        let val = customOp.insert.value;
        let contentType = "Unkown";

        if (
          val.url.includes(".png") ||
          val.url.includes(".jpg") ||
          val.url.includes(".jpeg") ||
          val.url.includes(".gif") ||
          val.url.includes("i.imgur.com") ||
          val.url.includes("imgur.com")
        ) {
          contentType = "image";
        }

        if (val.url.includes("youtube.com") || val.url.includes("youtu.be")) {
          contentType = "youtube";
        }

        if (val.url.includes('.mp4') || val.url.includes('.webm')) {
          contentType = 'video'
        }

        return `<hotlink url="${val.url}" contentType="${contentType}">${
          val.url
        }</hotlink>`;
      } else if (customOp.insert.type === "postquote") {
        let val = customOp.insert.value;
        return `<postquote forumid="${val.forumid}" threadid="${val.threadid}" postid="${val.postid}" username="${val.username}" userid="${val.userid}">${val.text}</postquote>`;
      } else if (customOp.insert.type === "mention") {
        let val = customOp.insert.value;
        return `<strong><span>@${val.username}</span></strong>`
      } else if (customOp.insert.type === "emote") {
        let val = customOp.insert.value;
        return `<img src="${emotes[val]['Url']}">`
      } else {
        return "<p>Unmanaged custom blot!</p>";
      }
    });

    let contentAsHtml = converter.convert();
    let postid = parseInt($(post).attr("postid"));
    let isOwnPost = $(post).attr("ownpost") == 'ownpost'
    let postMeta = {};

    if ($(post).attr("meta")) {
      postMeta = JSON.parse($(post).attr("meta"));
    }
    
    let postCanReply = ($(post).attr("canreply") == "canreply");
    let postCanVote = ($(post).attr("canvote") == 'canvote');

    // Push the post to the list
    posts.push({
      user: {
        country: postUserCountry,
        username: postUsername,
        userLevel: postUserLevel,
        url: postUserUrl,
        avatar: postUserAvatar ? postUserAvatar : null,
        backgroundImage: backgroundImage,
        userRank: postUserRank
      },
      postid: postid,
      contentAsHtml: contentAsHtml,
      meta: postMeta,
      canreply: postCanReply,
      canvote: postCanVote,
      isownpost: isOwnPost
    });
  });

  let totalPosts = parseInt($(".pagnation.above>pagnation").attr("total"))
  let perPage = parseInt($(".pagnation.above>pagnation").attr("perpage"))
  let totalPages = totalPosts / perPage

  res.send({
    threadName: threadName,
    currentPage: currentPage,
    totalPages: Math.ceil(totalPages),
    posts: posts
  });

  next();
}

async function manifest(req, res, next) {
  let content = await axios.get("https://forum.facepunch.com/manifest");
  let contentRaw = content.data.trim();

  // This might be dumb as all hell, but it works ¯\_(ツ)_/¯
  let window = {};
  nodeEval(contentRaw, "", { window });
  res.send(window);
  next();
}

async function currentUserInfo(req, res, next) {
  let content = await axios.get(
    "https://forum.facepunch.com/general/btvcw/Facepunch-Community-Event-Hub/1/",
      {
        headers: {
            Cookie: req.header('cookie') ? req.header('cookie') : null
        }
      }
  );
  var $ = cheerio.load(content.data);

  let threadReplyObject = $('threadreply')

  let username = threadReplyObject.attr('username')
  let avatar = threadReplyObject.attr('avatar')
  let level = parseInt(threadReplyObject.attr('levelclass').replace('level-', ''))
  let backgroundImage = threadReplyObject.attr('userbackground')

  res.send({
    username,
    avatar,
    level,
    backgroundImage
  });
  next();
}

var server = restify.createServer();

// Manifest
// Single forum
server.get("/manifest", manifest);
server.head("/manifest", manifest);

// Home
server.get("/", forums);
server.head("/", forums);

// Also home
server.get("/f/", forums);
server.head("/f/", forums);

// Single forum
server.get("/:forumid", forum);
server.head("/:forumid", forum);

server.get("/:forumid/p/:pagenumber", forum);
server.head("/:forumid/p/:pagenumber", forum);

server.get("/currentUserInfo", currentUserInfo);
server.head("/currentUserInfo", currentUserInfo);

// Thread
// https://forum.facepunch.com/general/bunmb/Inside-a-Flat-Earth-Conference/1/
server.get("/:forumid/:threadid1/:threadid2/:pagenumber", thread);
server.head("/:forumid/:threadid1/:threadid2/:pagenumber", thread);
server.get("/:forumid/:threadid1/:threadid2/:pagenumber/", thread);
server.head("/:forumid/:threadid1/:threadid2/:pagenumber/", thread);

var port = process.env.PORT || 8080;
server.listen(port, function() {
  console.log("NewPunch API started...");
  console.log("%s listening at %s", server.name, server.url);
});
