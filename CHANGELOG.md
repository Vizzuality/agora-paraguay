# Changelog

## [0.5.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.4.0...v0.5.0) (2026-10-08)


### Features

* accounts are their email — no username on Añadir usuario, the list, the confirms or the login field (AGP-71) ([#155](https://github.com/Vizzuality/agora-paraguay/issues/155)) ([ba6f9eb](https://github.com/Vizzuality/agora-paraguay/commit/ba6f9eb0c7892e4eb58a49277ff77673fa310e74))
* an unknown URL lands on Página no encontrada, nav and footer around it, instead of the router's bare fallback ([#157](https://github.com/Vizzuality/agora-paraguay/issues/157)) ([0c19295](https://github.com/Vizzuality/agora-paraguay/commit/0c192956d13033777f365349fefed27154fefe6c))
* the landing takes turns on a phone — selection panel first, then the map with the actions under it (AGP-70) ([#142](https://github.com/Vizzuality/agora-paraguay/issues/142)) ([54b2dcc](https://github.com/Vizzuality/agora-paraguay/commit/54b2dccb06b8b3056a7f86dfb1b92987079d6959))
* the one-time link lands on a reset-password page that checks the token and sets the password (AGP-34) ([#156](https://github.com/Vizzuality/agora-paraguay/issues/156)) ([a9b28a2](https://github.com/Vizzuality/agora-paraguay/commit/a9b28a2d9aac8868957518a6e22bc7c93a6d4290))


### Bug Fixes

* the phone title row actions keep the icon beside the label instead of stacking it ([#154](https://github.com/Vizzuality/agora-paraguay/issues/154)) ([adc040a](https://github.com/Vizzuality/agora-paraguay/commit/adc040a5ef8ef0c6370e1370c3dd6c88db06a2b4))

## [0.4.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.3.0...v0.4.0) (2026-10-08)


### Features

* /usuarios lists the accounts, Añadir usuario with the one-time link to copy or send by email, Borrar cuenta with confirm (AGP-48) ([#127](https://github.com/Vizzuality/agora-paraguay/issues/127)) ([5e13a03](https://github.com/Vizzuality/agora-paraguay/commit/5e13a03cb5113e7d2b5b8d2f25284664c33202a2))
* admin creates a user through POST /api/auth/admin/users/create/ (AGP-50) ([#110](https://github.com/Vizzuality/agora-paraguay/issues/110)) ([f62744e](https://github.com/Vizzuality/agora-paraguay/commit/f62744e9db35953197114c30f56c54e2c407a10b))
* categorical widget per scope — ruler for one parcel, visx count bars for several (AGP-60) ([#130](https://github.com/Vizzuality/agora-paraguay/issues/130)) ([6dc959c](https://github.com/Vizzuality/agora-paraguay/commit/6dc959c5220e25309c0872e28c2ec494c134ae54))
* Cerrar sesión from the header user menu (AGP-42) ([#114](https://github.com/Vizzuality/agora-paraguay/issues/114)) ([8cc273b](https://github.com/Vizzuality/agora-paraguay/commit/8cc273b60ac11b867c2a7bab1c36336d4c683fcf))
* deviation widgets — signed difference from the crop's base on a diverging track, the set as bars up and down (AGP-68) ([#139](https://github.com/Vizzuality/agora-paraguay/issues/139)) ([00afe01](https://github.com/Vizzuality/agora-paraguay/commit/00afe014b454158b5f3d8827ec794fd3a1cb4239))
* dropdowns cap at 20rem and fade the rows cut off by the scroll, top and bottom ([#136](https://github.com/Vizzuality/agora-paraguay/issues/136)) ([a603728](https://github.com/Vizzuality/agora-paraguay/commit/a60372835c199a1ec9d1012d9315168dcabed744))
* Generar resumen asks the API for the LLM summary of the analysed parcels (AGP-38) ([#112](https://github.com/Vizzuality/agora-paraguay/issues/112)) ([dbc87b8](https://github.com/Vizzuality/agora-paraguay/commit/dbc87b87d01a2c9fb892f30766ff6fee79ab3ec6))
* generating and finished states of the AI summary tile (AGP-38) ([#113](https://github.com/Vizzuality/agora-paraguay/issues/113)) ([56c867e](https://github.com/Vizzuality/agora-paraguay/commit/56c867e83958d76c886b21b00292d0575434ea2d))
* GMV feedback — deviation widgets dropped so Des_* read like any number, temperatures as whole degrees, no Exportar informe on sanitario ([#151](https://github.com/Vizzuality/agora-paraguay/issues/151)) ([2da7594](https://github.com/Vizzuality/agora-paraguay/commit/2da7594ff66a3e45d339fb552eed63958030cfee))
* indicator list from GET /api/parcels/indicators/ through a server relay, analysis waits for every filter ([#107](https://github.com/Vizzuality/agora-paraguay/issues/107)) ([99a400e](https://github.com/Vizzuality/agora-paraguay/commit/99a400e664c8306e4234c4f4d56a5eb1625c963e))
* indicator tiles by type — range ruler per Figma, facts in the info card, area on the thumbnail ([#118](https://github.com/Vizzuality/agora-paraguay/issues/118)) ([4969076](https://github.com/Vizzuality/agora-paraguay/commit/4969076199a2668825795d1691bbaad776c57040))
* mini map numbers the parcels over the map, dot texture and thicker outlines (AGP-66) ([#138](https://github.com/Vizzuality/agora-paraguay/issues/138)) ([a88c4cf](https://github.com/Vizzuality/agora-paraguay/commit/a88c4cfd3adcabd3fd49960bc57b82fa90f1da5d))
* numerical widget — one parcel's number, Todas' histogram, on the set's scale (AGP-62) ([#134](https://github.com/Vizzuality/agora-paraguay/issues/134)) ([d097f5e](https://github.com/Vizzuality/agora-paraguay/commit/d097f5e429c3ebc16f1f30194d1c902571ac2835))
* parcel tabs per Figma, one parcel without Todas, mini map of the analysed parcels only (AGP-45) ([#119](https://github.com/Vizzuality/agora-paraguay/issues/119)) ([154c00f](https://github.com/Vizzuality/agora-paraguay/commit/154c00f869d20d0ce996cdf1b48f2012d155e343))
* parcels read "Parcela N", info icon with the metadata description on widgets and hero fields (AGP-54) ([#121](https://github.com/Vizzuality/agora-paraguay/issues/121)) ([862f70c](https://github.com/Vizzuality/agora-paraguay/commit/862f70c3c3e07bf4b5563e11d5395f4d67e74966))
* productivo ranges as numbers on their own scale — number card per parcel, stepped histogram under Todas (AGP-69) ([#140](https://github.com/Vizzuality/agora-paraguay/issues/140)) ([5f479fd](https://github.com/Vizzuality/agora-paraguay/commit/5f479fdb47af6fc608d1c7f4191a2e11de483f0c))
* riesgo productivo tiles — parcel values, category counts, the crop's indicators only ([#117](https://github.com/Vizzuality/agora-paraguay/issues/117)) ([7ba6213](https://github.com/Vizzuality/agora-paraguay/commit/7ba621367c9d78389ad1f5062288afe965079b89))
* the hero filters are asked for the picked crop (GET /api/parcels/filters/?crop_type=) ([#135](https://github.com/Vizzuality/agora-paraguay/issues/135)) ([04e3729](https://github.com/Vizzuality/agora-paraguay/commit/04e3729deda8fb9b5269fe954e9eabfe25691a43))
* the session comes from GET /api/auth/me/, staff get Administrar usuarios (AGP-46) ([#115](https://github.com/Vizzuality/agora-paraguay/issues/115)) ([cfc8a1f](https://github.com/Vizzuality/agora-paraguay/commit/cfc8a1f6fe3dc9c0b9a60380916f553c98c029fc))
* Todas counts a short range per class and bins a long one as a histogram (AGP-60) ([#132](https://github.com/Vizzuality/agora-paraguay/issues/132)) ([ca52927](https://github.com/Vizzuality/agora-paraguay/commit/ca5292783551bf82a51f35eb12115f16e17fa9e4))


### Bug Fixes

* a rejected drawing no longer taints the upload that follows (AGP-43) ([#106](https://github.com/Vizzuality/agora-paraguay/issues/106)) ([8ccf4e8](https://github.com/Vizzuality/agora-paraguay/commit/8ccf4e848d8d43ee31aa6a4fdbf453bfa7ece155))
* ask the hero filters by riesgo, sanitario by default ([#131](https://github.com/Vizzuality/agora-paraguay/issues/131)) ([48a0692](https://github.com/Vizzuality/agora-paraguay/commit/48a0692f15753e6a4d6cfca2e8d998f80c708dce))
* **deps:** bump @tanstack/react-start to 1.168.60 for CVE-2026-102989 ([#128](https://github.com/Vizzuality/agora-paraguay/issues/128)) ([bc20b94](https://github.com/Vizzuality/agora-paraguay/commit/bc20b94d09774e5506642b90ba187d92a606ab2b))
* productivo widgets follow the open parcel tab ([#133](https://github.com/Vizzuality/agora-paraguay/issues/133)) ([b689613](https://github.com/Vizzuality/agora-paraguay/commit/b689613cdd75d66e1f8c353af893b843bd548744))
* Reiniciar clears the parcels layer with the drawing (AGP-43) ([#105](https://github.com/Vizzuality/agora-paraguay/issues/105)) ([9fa1d45](https://github.com/Vizzuality/agora-paraguay/commit/9fa1d45d2966fbd00d8fc1dfdc65eade08cbb511))
* the AI summary text takes three quarters of the tile ([#116](https://github.com/Vizzuality/agora-paraguay/issues/116)) ([b7a6418](https://github.com/Vizzuality/agora-paraguay/commit/b7a64185800fd3cc8c05883d932ef9d57cc7f070))
* the login body sends identifier, a username or an email ([#111](https://github.com/Vizzuality/agora-paraguay/issues/111)) ([55e8a81](https://github.com/Vizzuality/agora-paraguay/commit/55e8a812113fc6fafc3a26cb831e069b8a4e1985))

## [0.3.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.2.0...v0.3.0) (2026-09-24)


### Features

* add shadcn/ui foundation ([#17](https://github.com/Vizzuality/agora-paraguay/issues/17)) ([166155d](https://github.com/Vizzuality/agora-paraguay/commit/166155d9037b5b3204790eed98ff3575f698ae2f))
* add the AI summary tile to riesgo productivo (AGP-38) ([#98](https://github.com/Vizzuality/agora-paraguay/issues/98)) ([bb842dc](https://github.com/Vizzuality/agora-paraguay/commit/bb842dc61a7f3f863a81c476fca7d05f2ebdda22))
* add the reset-password card to the login gate (AGP-34) ([#99](https://github.com/Vizzuality/agora-paraguay/issues/99)) ([a0b9b54](https://github.com/Vizzuality/agora-paraguay/commit/a0b9b54491ed8f4370e25e2edc6d420ed1df3544))
* analysis hero dropdowns fed by the options query (AGP-29) ([#60](https://github.com/Vizzuality/agora-paraguay/issues/60)) ([3cb2ab9](https://github.com/Vizzuality/agora-paraguay/commit/3cb2ab90b4e4fbd737fb4b697ae6295b8cef7171))
* analysis hero with parcel tabs on analysis page (AGP-21) ([#45](https://github.com/Vizzuality/agora-paraguay/issues/45)) ([e3576ce](https://github.com/Vizzuality/agora-paraguay/commit/e3576ce57490a6d91b2f3ad90595a8d9cc977e7b))
* app workflow — selection and analysis modes, styled map controls ([#38](https://github.com/Vizzuality/agora-paraguay/issues/38)) ([aeb96aa](https://github.com/Vizzuality/agora-paraguay/commit/aeb96aaf6f5910a0b3368bce960279368c072866))
* default filter-parcels to 20% overlap and a 20 m buffer ([#88](https://github.com/Vizzuality/agora-paraguay/issues/88)) ([03b3f9d](https://github.com/Vizzuality/agora-paraguay/commit/03b3f9ddd8a0dbc42d4d0f1dc7db03bf974af2a1))
* header login dialog anchored to the user button (AGP-23) ([#46](https://github.com/Vizzuality/agora-paraguay/issues/46)) ([d1472b8](https://github.com/Vizzuality/agora-paraguay/commit/d1472b82e149d6c6d8222eb1b32bf20167376ff3))
* import polygons with holes and drop upload validations beyond the Paraguay check ([#59](https://github.com/Vizzuality/agora-paraguay/issues/59)) ([deeedb8](https://github.com/Vizzuality/agora-paraguay/commit/deeedb84a5f7dcef323e3e20e32587356e51e636))
* login screen layout on analysis page (AGP-22) ([5da370a](https://github.com/Vizzuality/agora-paraguay/commit/5da370aa2e3e28163f3b3c959be39de36818984f))
* make riesgo sanitario public and gate riesgo productivo behind login ([#44](https://github.com/Vizzuality/agora-paraguay/issues/44)) ([c35a84f](https://github.com/Vizzuality/agora-paraguay/commit/c35a84fdc1e8fcf2ebf5cef8d1c0624ac9900233))
* map drawing with Terra Draw ([#21](https://github.com/Vizzuality/agora-paraguay/issues/21)) ([1421f29](https://github.com/Vizzuality/agora-paraguay/commit/1421f29ec5df1c1dfcbfc934461ba4d4f1d64275))
* match widget cards to the design ([#20](https://github.com/Vizzuality/agora-paraguay/issues/20)) ([4100281](https://github.com/Vizzuality/agora-paraguay/commit/4100281133c302927d9fc2ab43d1db5eabef1eee))
* mock parcels layer and click-to-select areas (AGP-19) ([#33](https://github.com/Vizzuality/agora-paraguay/issues/33)) ([98ef809](https://github.com/Vizzuality/agora-paraguay/commit/98ef8092dcc8ffcedb7e4808e8886cbdb2af3a1a))
* open a mailto to the admin from Solicitar and confirm the request (AGP-34) ([#100](https://github.com/Vizzuality/agora-paraguay/issues/100)) ([bb4a4e7](https://github.com/Vizzuality/agora-paraguay/commit/bb4a4e7f559bee30d62f68137e12176e74f72a60))
* organise API by spec domain, wire Analizar ([#75](https://github.com/Vizzuality/agora-paraguay/issues/75)) ([240cccb](https://github.com/Vizzuality/agora-paraguay/commit/240cccb82a0cc02b22c8541982f51c6af069e853))
* paint the analysed parcel's indicators as risk class cards (AGP-21) ([#77](https://github.com/Vizzuality/agora-paraguay/issues/77)) ([b7a4de2](https://github.com/Vizzuality/agora-paraguay/commit/b7a4de2aa2efe44b381ce6cae466a4e197582011))
* parcel tabs with Todas, list dropdown and mini-map selection (AGP-45) ([#103](https://github.com/Vizzuality/agora-paraguay/issues/103)) ([f2f868a](https://github.com/Vizzuality/agora-paraguay/commit/f2f868a1e29863e5b44dc5e91d2a1b674976ad62))
* replace the Ágora logo with a LOGO placeholder ([#70](https://github.com/Vizzuality/agora-paraguay/issues/70)) ([65873d9](https://github.com/Vizzuality/agora-paraguay/commit/65873d95cde6a544c627cd00ea25c583adb40729))
* satellite mini map on the analysis hero (AGP-27) ([#47](https://github.com/Vizzuality/agora-paraguay/issues/47)) ([22d534a](https://github.com/Vizzuality/agora-paraguay/commit/22d534a92fb66076f16fa24290b398fe29298a2e))
* Selección de parcelas starts a new selection, hero and camera polish (AGP-43) ([#104](https://github.com/Vizzuality/agora-paraguay/issues/104)) ([c3d627a](https://github.com/Vizzuality/agora-paraguay/commit/c3d627a27e3a185d02add71bbe9d9a5815c99a40))
* sign in against the Django session endpoints ([#61](https://github.com/Vizzuality/agora-paraguay/issues/61)) ([9278e43](https://github.com/Vizzuality/agora-paraguay/commit/9278e43bf3ff8db4301cadd4bea8e44f6a38af83))
* walk the parcel selection through steps (AGP-36) ([#74](https://github.com/Vizzuality/agora-paraguay/issues/74)) ([0bee610](https://github.com/Vizzuality/agora-paraguay/commit/0bee61086163583c55c9d03315bf0eccb02d2968))
* wire selection and analysis to the live API (filters, parcels, indicators, analysis) ([#87](https://github.com/Vizzuality/agora-paraguay/issues/87)) ([f6317cd](https://github.com/Vizzuality/agora-paraguay/commit/f6317cda909ff5a8df9810cf9979a78574d029f8))


### Bug Fixes

* freeze the submitted parcels for the analysis hero (AGP-29) ([#89](https://github.com/Vizzuality/agora-paraguay/issues/89)) ([99861cb](https://github.com/Vizzuality/agora-paraguay/commit/99861cbda410027601841535b8c8d264a4767a95))
* paint drawn polygons and drawing handles in the highlight yellow ([#73](https://github.com/Vizzuality/agora-paraguay/issues/73)) ([661e61f](https://github.com/Vizzuality/agora-paraguay/commit/661e61f4561588bdac86c4a5762dc2d81eda44c2))
* relay /api through the built server, not only the dev proxy ([#86](https://github.com/Vizzuality/agora-paraguay/issues/86)) ([b3d3442](https://github.com/Vizzuality/agora-paraguay/commit/b3d3442586ef7d00359847a29d8e93245576ff68))
* scroll parcel tabs with the arrow buttons ([#58](https://github.com/Vizzuality/agora-paraguay/issues/58)) ([2e8f538](https://github.com/Vizzuality/agora-paraguay/commit/2e8f538176a75e9dee82d0f950c0c6475b70999a))
* stop the camera query string doubling on every map move ([#32](https://github.com/Vizzuality/agora-paraguay/issues/32)) ([6d51ce7](https://github.com/Vizzuality/agora-paraguay/commit/6d51ce705d363b9178ed7a78afd70ad772e3db9c))

## [0.2.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.1.0...v0.2.0) (2026-08-12)


### Features

* add map shell with URL-synced view state ([#11](https://github.com/Vizzuality/agora-paraguay/issues/11)) ([8f2445c](https://github.com/Vizzuality/agora-paraguay/commit/8f2445ca4a339916cbd6f48179bb875f44c6d4ea))
* set up TanStack Start project foundation ([40c1143](https://github.com/Vizzuality/agora-paraguay/commit/40c114346ca8b85af362d88399880024f138751a))


### Bug Fixes

* bump sonarqube-scan-action to v6 for GHSA-5xq9-5g24-4g6f ([e023e26](https://github.com/Vizzuality/agora-paraguay/commit/e023e2651373a8303c479ea2662e59bbc0e91bd7))
* stop oxfmt reformatting the generated CHANGELOG ([#14](https://github.com/Vizzuality/agora-paraguay/issues/14)) ([f2f3976](https://github.com/Vizzuality/agora-paraguay/commit/f2f39765e4e3a69d2fce313216a52fa768525ad1))
