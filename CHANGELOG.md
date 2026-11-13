# Changelog

## [0.7.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.6.0...v0.7.0) (2026-11-13)


### Features

* Capas lays the layers over a light vector basemap (AGP-99) ([#252](https://github.com/Vizzuality/agora-paraguay/issues/252)) ([ecec9bc](https://github.com/Vizzuality/agora-paraguay/commit/ecec9bc6ee014a3956d5435bdde321083612ba67))
* Nivel de exposición colours districts by class as the design does (AGP-100) ([#254](https://github.com/Vizzuality/agora-paraguay/issues/254)) ([9935741](https://github.com/Vizzuality/agora-paraguay/commit/99357419fc015712bf69ae6b231c2c4f1496ad1c))
* parcels paint by selection and last crop, with a legend, on both maps (AGP-104, AGP-106, AGP-107) ([#259](https://github.com/Vizzuality/agora-paraguay/issues/259)) ([2424a2e](https://github.com/Vizzuality/agora-paraguay/commit/2424a2e698ebd2719f9c0bbaf2fa07ba66b725bb))
* the analysis page shows a loader while a filter change re-runs it ([#258](https://github.com/Vizzuality/agora-paraguay/issues/258)) ([0c44fc5](https://github.com/Vizzuality/agora-paraguay/commit/0c44fc5960f1ad4aa839497a0f9c01508d482c75))
* the exposure map's layers follow the new styles (AGP-99) ([#250](https://github.com/Vizzuality/agora-paraguay/issues/250)) ([50a9f7b](https://github.com/Vizzuality/agora-paraguay/commit/50a9f7babd681a4ad590e88e0f91b26271859975))
* the hero dates default to 1 October and yesterday, within 1 Sept 2024 – today (AGP-95) ([#256](https://github.com/Vizzuality/agora-paraguay/issues/256)) ([51878ee](https://github.com/Vizzuality/agora-paraguay/commit/51878ee3042c14b3c5098aaacfaf72dcfe587aae))
* the hero dates pick from a calendar limited to 1 Sept 2024 – today (AGP-95) ([#257](https://github.com/Vizzuality/agora-paraguay/issues/257)) ([6a09edc](https://github.com/Vizzuality/agora-paraguay/commit/6a09edce8a39df7a27272c63937b6c2c2fd4e9aa))
* the parcel legend opens by default on the selection and analysis maps ([#266](https://github.com/Vizzuality/agora-paraguay/issues/266)) ([5a385e2](https://github.com/Vizzuality/agora-paraguay/commit/5a385e2dae4afb59b2e6ee77c55d1b988973ce41))


### Bug Fixes

* every map keeps its credits and scale top left, legend bottom left and zoom bottom right ([#261](https://github.com/Vizzuality/agora-paraguay/issues/261)) ([4555750](https://github.com/Vizzuality/agora-paraguay/commit/45557505449ad3e86d06fbd16affb2ba114c46d9))
* send soja as the crop value, as the API now names it ([#237](https://github.com/Vizzuality/agora-paraguay/issues/237)) ([d7d26cb](https://github.com/Vizzuality/agora-paraguay/commit/d7d26cb53f021899d95a7c02a120e78ad2cc8592))
* the general info tips sit top right of each fact ([#253](https://github.com/Vizzuality/agora-paraguay/issues/253)) ([46916ea](https://github.com/Vizzuality/agora-paraguay/commit/46916ea7e058cb9db5a74fb455fe45498a596a30))
* the hero lists the sowing date before the date ([#255](https://github.com/Vizzuality/agora-paraguay/issues/255)) ([8ee9d73](https://github.com/Vizzuality/agora-paraguay/commit/8ee9d73c5da6cd143d5004fd7611b4d47ad74801))

## [0.6.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.5.0...v0.6.0) (2026-11-05)


### Features

* a click on the map after a rejected drawing starts the next one ([#211](https://github.com/Vizzuality/agora-paraguay/issues/211)) ([f2cfb05](https://github.com/Vizzuality/agora-paraguay/commit/f2cfb05d8e5eda77b0e7d42b596d536607513c85))
* add the Exposición climática tab to the analysis header ([#210](https://github.com/Vizzuality/agora-paraguay/issues/210)) ([85fc403](https://github.com/Vizzuality/agora-paraguay/commit/85fc40322d4a8f9ca952cfc0d543ac983238081f))
* analysis pages in two columns, the hero beside the widgets ([#197](https://github.com/Vizzuality/agora-paraguay/issues/197)) ([2630e39](https://github.com/Vizzuality/agora-paraguay/commit/2630e39b349b699daceb20f45bc92a605f680ed7))
* areas over 100 000 ha are rejected before their parcels are asked for (AGP-73) ([#160](https://github.com/Vizzuality/agora-paraguay/issues/160)) ([70a388e](https://github.com/Vizzuality/agora-paraguay/commit/70a388e808f0a62e88ce702866b32621715f04f1))
* Capas no longer opens a layer feature's info ([#226](https://github.com/Vizzuality/agora-paraguay/issues/226)) ([49aa506](https://github.com/Vizzuality/agora-paraguay/commit/49aa5060f0f190087b7c185f733956ba6e9f2edb))
* chart tones from the theme's custom colours, one value per mode (AGP-72) ([#159](https://github.com/Vizzuality/agora-paraguay/issues/159)) ([88c0455](https://github.com/Vizzuality/agora-paraguay/commit/88c04553cf49528599b465c271de338b090c89b0))
* data quality reads as a fact in the sanitario summary ([#225](https://github.com/Vizzuality/agora-paraguay/issues/225)) ([cd23171](https://github.com/Vizzuality/agora-paraguay/commit/cd23171fe0f9b18190072dd2b3847bdbcaf397f8))
* Exportar informe prints Riesgo productivo as a PDF report (AGP-77) ([#164](https://github.com/Vizzuality/agora-paraguay/issues/164)) ([44cc555](https://github.com/Vizzuality/agora-paraguay/commit/44cc55589192ca4140d919ef11a01c57a4f5a279))
* Exposición climática map with districts, layers and indicators ([#213](https://github.com/Vizzuality/agora-paraguay/issues/213)) ([3201ace](https://github.com/Vizzuality/agora-paraguay/commit/3201ace9c919b08e2601a4da06d4a51e17138e68))
* global layers load as vector tiles from global_layer_tiles ([#215](https://github.com/Vizzuality/agora-paraguay/issues/215)) ([43895c6](https://github.com/Vizzuality/agora-paraguay/commit/43895c64eb388a920e5bb77aa6857ec6800e24e4))
* Personalización del análisis, the analysis type picked first ([#212](https://github.com/Vizzuality/agora-paraguay/issues/212)) ([7d89c27](https://github.com/Vizzuality/agora-paraguay/commit/7d89c272765b010ea86710419799f0fb1e82f8e2))
* Selección de parcelas resumes the selection on step 2 with the parcels (AGP-82) ([#180](https://github.com/Vizzuality/agora-paraguay/issues/180)) ([cafd656](https://github.com/Vizzuality/agora-paraguay/commit/cafd656b450729b731a4e575d5b131a7c66b7cdf))
* soy as the default crop, and the global layers API client ([#209](https://github.com/Vizzuality/agora-paraguay/issues/209)) ([402d4ef](https://github.com/Vizzuality/agora-paraguay/commit/402d4efc8ba4b51eb53978530f4f804e5c20cb7c))
* the AI summary is asked for the hero year and crop, and the open parcel alone ([#227](https://github.com/Vizzuality/agora-paraguay/issues/227)) ([a87e992](https://github.com/Vizzuality/agora-paraguay/commit/a87e9921ec5e7933c3d75c90c564c26bf447aff5))
* the drawn or uploaded areas may cover up to 200 000 ha, up from 100 000 ([#181](https://github.com/Vizzuality/agora-paraguay/issues/181)) ([1eb94fc](https://github.com/Vizzuality/agora-paraguay/commit/1eb94fc7d545d45258ea88ec01fad8289d60b3da))
* the map opens on Alto Paraná, with a banner saying so, while the cadastre covers that department only (AGP-81) ([#166](https://github.com/Vizzuality/agora-paraguay/issues/166)) ([8fc2a1c](https://github.com/Vizzuality/agora-paraguay/commit/8fc2a1c94e50a94db42aae636f214fa80fb99417))
* the PDF report follows the new print layout (AGP-77) ([#228](https://github.com/Vizzuality/agora-paraguay/issues/228)) ([8b986a4](https://github.com/Vizzuality/agora-paraguay/commit/8b986a4cfa727a8cd258db5f8a04809aa9d3faf6))
* the selected areas survive a page reload (AGP-78) ([#163](https://github.com/Vizzuality/agora-paraguay/issues/163)) ([5dc4ef3](https://github.com/Vizzuality/agora-paraguay/commit/5dc4ef31b67116db5226d85321dbc461248e0509))


### Bug Fixes

* a parcel column the analysis cannot read shows "Sin datos" instead of disappearing ([#196](https://github.com/Vizzuality/agora-paraguay/issues/196)) ([c20afb6](https://github.com/Vizzuality/agora-paraguay/commit/c20afb626c0d692503aa230b9d815f03d256feb7))
* an upload outside Paraguay says so, instead of the drawing's no-parcel message ([#162](https://github.com/Vizzuality/agora-paraguay/issues/162)) ([6153c19](https://github.com/Vizzuality/agora-paraguay/commit/6153c194f647517656e914d0d9ad1fcd3e924d5b))
* auth card titles take the design's line height and colour ([#217](https://github.com/Vizzuality/agora-paraguay/issues/217)) ([6c632fe](https://github.com/Vizzuality/agora-paraguay/commit/6c632fe883d2761922a9c669ad2d750a90191b9a))
* parcel number chips on the mini map are left out while they would be unreadable (AGP-83) ([#179](https://github.com/Vizzuality/agora-paraguay/issues/179)) ([46e3ce5](https://github.com/Vizzuality/agora-paraguay/commit/46e3ce5ba17b9a937e8d3eb01d665702dd65c820))
* productivo's year filter loads, beside the crop in the hero ([#216](https://github.com/Vizzuality/agora-paraguay/issues/216)) ([a62aaf8](https://github.com/Vizzuality/agora-paraguay/commit/a62aaf820ab20825740483f647d6ca4d1c590dc1))
* the Docker build takes API_PROXY_TARGET so /api reaches the backend ([#230](https://github.com/Vizzuality/agora-paraguay/issues/230)) ([6bc7b06](https://github.com/Vizzuality/agora-paraguay/commit/6bc7b06d6e4550f2c624ba3df3797c4ecab336f1))
* the login card and popover fit a phone screen ([#195](https://github.com/Vizzuality/agora-paraguay/issues/195)) ([8ce9fd6](https://github.com/Vizzuality/agora-paraguay/commit/8ce9fd65b4aa930812628815d1f2217b5600ef40))
* the server sends security headers that block framing and MIME sniffing ([#232](https://github.com/Vizzuality/agora-paraguay/issues/232)) ([00c639a](https://github.com/Vizzuality/agora-paraguay/commit/00c639af58ef154c5b845742a1bae6fe34745081))
* uploads reject zips that inflate past 100 MB ([#231](https://github.com/Vizzuality/agora-paraguay/issues/231)) ([21fa789](https://github.com/Vizzuality/agora-paraguay/commit/21fa7899b92734363e7f39f86ed3419cd8355555))

## [0.5.0](https://github.com/Vizzuality/agora-paraguay/compare/v0.4.0...v0.5.0) (2026-10-08)


### Features

* accounts are their email — no username on Añadir usuario, the list, the confirms or the login field (AGP-71) ([#155](https://github.com/Vizzuality/agora-paraguay/issues/155)) ([ba6f9eb](https://github.com/Vizzuality/agora-paraguay/commit/ba6f9eb0c7892e4eb58a49277ff77673fa310e74))
* an unknown URL lands on Página no encontrada, the message alone with the way back, instead of the router's bare fallback ([#157](https://github.com/Vizzuality/agora-paraguay/issues/157)) ([0c19295](https://github.com/Vizzuality/agora-paraguay/commit/0c192956d13033777f365349fefed27154fefe6c))
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
