const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const config = require('./config.json');
const CronJob = require('cron').CronJob;

const app = require('express')();


let transporter = nodemailer.createTransport(require('nodemailer-mailgun-transport')({
  auth: {
    api_key: config.api_key,
    domain: config.domain
  }
}));

app.get('/', (req, res) => {

  request('https://news.ycombinator.com', (err, response, html) => {
    if (!err && response.statusCode === 200) {
      let $ = cheerio.load(html);
      let newsData = [];
      let emailHTML = '<h2>Here is the current top news from Hacker News!</h2>'

      $('span.comhead').each(function () {
        let a = $(this).prev();
        let rank = parseInt(a.parent().parent().text(), 10);
        let title = a.text();
        let url = a.attr('href');
        let subtext = a.parent().parent().next().children('.subtext').children();
        let age = $(subtext).eq(2).text();
        let metadata = { rank, title, url, age };

        emailHTML += `
          <div>
            <span style="font-size: 16px;">${rank}. ${title}<span style="font-size: 12px;"> - <a href="${url}">${age}</a></span></span>
            <span style="height: 5px;"></span>
          </div>
        `;
        newsData.push(metadata);
      });

      emailHTML += `<br /><br />
      <p style="font-size: 12px;">Made with <span style="color: red;">♥</span> by <em><b><a href="jsonunger.com">Jason Unger</a></b></em> using <a href="https://github.com/request/request">request</a>, <a href="https://github.com/cheeriojs/cheerio">cheerio</a>, and <a href="https://github.com/nodemailer/nodemailer">nodemailer</a></p>`

      transporter.sendMail({
        from: '"Top Hacker News" <hackernews@jsonunger.com>',
        to: 'jasonscottunger@gmail.com',
        subject: 'The Top Hacker News Right Now',
        html: emailHTML
      }, (error, { message }) => {
        if (error) {
          return console.error(`Error: ${ error }`);
        }
        console.log(`Message Sent: "${ message }"`);
      })
    }
  });
});

new CronJob('00 50 22 * * *', function () {
  request.get('localhost:8081/');
}, null, true, 'America/New_York');

app.listen('8081', function () {
  console.log('Listening on port 8081');
})
