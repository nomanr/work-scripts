const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const dot = require("dot-object");

async function fetchAndConvert() {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgHJgbi10bLO9wYLCH3y6kyZHKQiMII-lTkCdB9RBfAuNNlA0RKTPoMHewdx_4NpVJ3qhJtCK4b50q/pubhtml?gid=0&single=true";

  const res = await fetch(url);
  const text = await res.text();

  const $ = cheerio.load(text);

  let languages = [];
  let data = {};

  $("table tbody tr").each((i, row) => {
    if (i === 0) {
      // The first row contains languages
      $(row)
        .find("td")
        .each((j, cell) => {
          if (j > 1) {
            // Skip the first two columns
            const lang = $(cell).text();
            languages[j] = lang;
            data[lang] = {};
          }
        });
    } else {
      // The rest of the rows contain data
      let key = "";
      $(row)
        .find("td")
        .each((j, cell) => {
          if (j === 1) {
            // The second column contains keys
            key = $(cell).text();
            key = key.replace(/\./g, "__DOT__"); // Replace '.' with '__DOT__'
            key = key.replace(/___/g, "."); // Replace '___' with '.'
          } else if (j > 1 && languages[j]) {
            // The rest of the columns contain data
            let value = $(cell).text();
            // Skip empty values
            value = value.trim();
            value = value.replace(/\r?\n|\r(?!\n)/g, ""); // Replace '\n' with 'NEW_LINE'
            value = value.replace(/(?<!\\)\\n/g, "NEW_LINE");
            value = value.replace(/•\s{0,15}/g, "•\t"); // Replace '• ' with '•\t'

            if (key) {
              //if key is empty then return
              dot.str(key, value, data[languages[j]], { delimiter: "___" }); // Convert the key to object hierarchy with '___' as delimiter
            }
          }
        });
    }
  });

  // Write the data to JSON files
  for (const [language, dataObj] of Object.entries(data)) {
    fs.writeFileSync(
      `/Users/nomanr/Documents/Workspace/workspace-react-native/PridPlanner/app/common/i18n/translations/${language}.json`,
      JSON.stringify(dataObj, null, 2)
        .replace(/__DOT__/g, ".")
        .replace(/NEW_LINE/g, `${"\\n"}`)
    );
  }
}

fetchAndConvert();
