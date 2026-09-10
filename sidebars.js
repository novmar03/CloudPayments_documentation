const fs = require('node:fs');
const path = require('node:path');

// The API outline comes from the same page headings as the offline HTML.
const apiHeadingIds = new Map();
const apiHeadings = [...fs.readFileSync(path.join(__dirname, 'docs/tech/api.md'), 'utf8').matchAll(/^(#{2,4}) (.+)$/gm)].map(([, hashes, title]) => {
  const slug = title.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/ /g, '-');
  const count = apiHeadingIds.get(slug) || 0;
  apiHeadingIds.set(slug, count + 1);
  const anchor = slug + (count ? `-${count}` : '');
  return {type: 'link', label: title, href: `/tech/api/#${encodeURIComponent(anchor)}`, autoAddBaseUrl: true, className: `api-heading-level-${hashes.length}`};
});

module.exports = {
  "docs": [
    "index",
    {
      "type": "category",
      "label": "Начало работы",
      "collapsed": true,
      "items": [
        "start/connect",
        "start/account"
      ]
    },
    {
      "type": "category",
      "label": "Выбор платёжного решения",
      "collapsed": true,
      "items": [
        "solutions/compare",
        "solutions/widget",
        "solutions/blocks",
        "solutions/checkout",
        "solutions/orders",
        "solutions/links",
        "solutions/charity",
        "solutions/infoshop",
        "solutions/sdk",
        "solutions/api"
      ]
    },
    {
      "type": "category",
      "label": "Способы оплаты",
      "collapsed": true,
      "items": [
        "methods/card",
        "methods/tpay",
        "methods/sberpay",
        "methods/mirpay",
        "methods/sbp",
        "methods/dolyami",
        "methods/installments",
        "methods/foreign",
        "methods/digital"
      ]
    },
    {
      "type": "category",
      "label": "Бизнес-сценарии оплаты",
      "collapsed": true,
      "items": [
        "scenarios/recurrent",
        "scenarios/recurring",
        "scenarios/escrow",
        "scenarios/customization"
      ]
    },
    {
      "type": "category",
      "label": "Технические аспекты подключения",
      "collapsed": true,
      "items": [
        "tech/widget",
        "tech/blocks",
        "tech/checkout",
        "tech/orders",
        "tech/links",
        "tech/charity",
        "tech/infoshop",
        "tech/sdk",
        {
          "type": "category",
          "label": "API",
          "link": {"type": "doc", "id": "tech/api"},
          "collapsed": true,
          "items": apiHeadings
        },
        "tech/notifications",
        {
          "type": "category",
          "label": "Настройка способов оплаты",
          "items": [
            "tech/methods/tpay",
            "tech/methods/sbp",
            "tech/methods/digital",
            "tech/methods/sberpay",
            "tech/methods/mirpay",
            "tech/methods/dolyami"
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "Информационная безопасность",
      "collapsed": true,
      "items": [
        "security"
      ]
    },
    {
      "type": "category",
      "label": "Тестирование, справочники и глоссарий",
      "collapsed": true,
      "items": [
        "reference/testing",
        "reference/directory",
        "reference/glossary",
        "reference/ecosystem"
      ]
    }
  ]
};
