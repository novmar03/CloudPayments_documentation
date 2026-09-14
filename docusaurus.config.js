module.exports = {
  title: 'CloudPayments · Документация',
  tagline: 'Подключение и прием платежей',
  url: process.env.DOCS_URL || 'https://example.com',
  baseUrl: process.env.DOCS_BASE_URL || '/',
  favicon: 'favicon.svg',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  i18n: {defaultLocale: 'ru', locales: ['ru','en'], localeConfigs: {ru:{label:'Русский'},en:{label:'English'}}},
  plugins: [require.resolve('./plugins/documentation-search.cjs'), require.resolve('./plugins/editor-render-data.cjs')],
  presets: [['classic', {
    docs: {
      routeBasePath: '/',
      sidebarPath: require.resolve('./sidebars.js'),
      showLastUpdateTime: false,
    },
    blog: false,
    theme: {customCss: [require.resolve('./src/css/custom.css'), require.resolve('./src/css/imported-api.css'), require.resolve('./src/css/documentation-search.css'), require.resolve('./src/css/language-picker.css')]},
  }]],
  themeConfig: {
    colorMode: {defaultMode: 'light', disableSwitch: true},
    navbar: {
      logo: {alt: 'CloudPayments', src: 'cloudpayments-logo.svg', width: 219, height: 34},
      items: [
        {label: 'Документация', to: '/', position: 'left', activeBaseRegex: '.*'},
        {label: 'Личный кабинет ↗', href: 'https://merchant.cloudpayments.ru', position: 'right'},
        {type: 'custom-language', position: 'right'},
        {type: 'search', position: 'right'},
      ],
    },
    docs: {sidebar: {hideable: false, autoCollapseCategories: true}},
    tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
    prism: {additionalLanguages: ['bash', 'json']},
  },
};
