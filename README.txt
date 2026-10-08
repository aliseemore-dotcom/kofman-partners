Kofman + Partners — static site

Pages: index.html, residential.html, lettings.html, how-we-work.html
Shared files: support.js, image-slot.js, _ds/, assets/ — keep the folder structure intact.

Deploy: app.netlify.com > your site > Deploys > drag this whole folder onto the drop zone.

Hosting: GitHub Pages (branch deploy), domain www.kofmanpartners.com (CNAME file, .nojekyll).

K+P Commercial routes (SEO)
  commercial/index.html is a single-page app; every screen also has its own URL
  (commercial/work/, commercial/work/<project>/, commercial/markets/<uk|europe|middle-east>/, ...).
  Those folders are GENERATED. After editing commercial/index.html run:
      python3 tools/build_commercial_routes.py
  (needs python3 + node). It also regenerates sitemap.xml.

Enquiry form: commercial/form-backend/ (Google Apps Script -> Google Sheet + email).
