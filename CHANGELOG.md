# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [5.1.1](https://github.com/PabloFerrari027/the-shortener-02/compare/v5.0.0...v5.1.1) (2025-11-30)


### 📚 Documentação

* add detailed comments and SMTP configuration to environment variables ([efd9d74](https://github.com/PabloFerrari027/the-shortener-02/commit/efd9d74a0217e1aaaeadd01294e38925779d86e4))


### ♻️ Refatoração

* consolidate utility functions and convert setup to plain ([10066b3](https://github.com/PabloFerrari027/the-shortener-02/commit/10066b3c71eecdab8da405cd177a5afc70eeb6d0))
* improve hash generation algorithm with offset for better distribution ([e79e5e8](https://github.com/PabloFerrari027/the-shortener-02/commit/e79e5e83d21792e9f17ed3fb49e9f4aedd8f3f66))
* remove unused in-memory queue adapter ([821014e](https://github.com/PabloFerrari027/the-shortener-02/commit/821014e0b42c592d2221acc7271401d97d6904bd))


### 🐛 Correções

* correct language enum value format to uppercase ([21fc83f](https://github.com/PabloFerrari027/the-shortener-02/commit/21fc83f7b41c2d5e2f114bade48afc21b21a0317))


### 💄 Estilo

* remove Portuguese comments from test files ([002083f](https://github.com/PabloFerrari027/the-shortener-02/commit/002083f222c54fbc2295e501d923bc67cbe7bcbc))


### ✨ Novidades

* add nodemailer integration for email notifications ([3aef5fa](https://github.com/PabloFerrari027/the-shortener-02/commit/3aef5fa1b4a23dd7657937ef8e6f48f0b8f014c8))
* add nodemailer support and remove test environment configuration ([b49fc0d](https://github.com/PabloFerrari027/the-shortener-02/commit/b49fc0da175bc071f1d507f3e3dfa2b4901d5646))


### 🔧 Manutenção

* **release:** 5.1.0 ([23c6478](https://github.com/PabloFerrari027/the-shortener-02/commit/23c647875592689b99154190319414e808dc6b0d))
* remove e2e test configuration and simplify test scripts ([0957f20](https://github.com/PabloFerrari027/the-shortener-02/commit/0957f20ba59eb66c9964b8e5e547288fab109e06))
* remove test environment docker compose configuration ([a2dc0af](https://github.com/PabloFerrari027/the-shortener-02/commit/a2dc0af46f1932738671c9fb7b603358342d0ab5))

## [5.1.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v5.0.0...v5.1.0) (2025-11-30)


### 📚 Documentação

* add detailed comments and SMTP configuration to environment variables ([efd9d74](https://github.com/PabloFerrari027/the-shortener-02/commit/efd9d74a0217e1aaaeadd01294e38925779d86e4))


### 🔧 Manutenção

* remove e2e test configuration and simplify test scripts ([0957f20](https://github.com/PabloFerrari027/the-shortener-02/commit/0957f20ba59eb66c9964b8e5e547288fab109e06))
* remove test environment docker compose configuration ([a2dc0af](https://github.com/PabloFerrari027/the-shortener-02/commit/a2dc0af46f1932738671c9fb7b603358342d0ab5))


### ♻️ Refatoração

* consolidate utility functions and convert setup to plain ([10066b3](https://github.com/PabloFerrari027/the-shortener-02/commit/10066b3c71eecdab8da405cd177a5afc70eeb6d0))
* improve hash generation algorithm with offset for better distribution ([e79e5e8](https://github.com/PabloFerrari027/the-shortener-02/commit/e79e5e83d21792e9f17ed3fb49e9f4aedd8f3f66))
* remove unused in-memory queue adapter ([821014e](https://github.com/PabloFerrari027/the-shortener-02/commit/821014e0b42c592d2221acc7271401d97d6904bd))


### 🐛 Correções

* correct language enum value format to uppercase ([21fc83f](https://github.com/PabloFerrari027/the-shortener-02/commit/21fc83f7b41c2d5e2f114bade48afc21b21a0317))


### 💄 Estilo

* remove Portuguese comments from test files ([002083f](https://github.com/PabloFerrari027/the-shortener-02/commit/002083f222c54fbc2295e501d923bc67cbe7bcbc))


### ✨ Novidades

* add nodemailer integration for email notifications ([3aef5fa](https://github.com/PabloFerrari027/the-shortener-02/commit/3aef5fa1b4a23dd7657937ef8e6f48f0b8f014c8))
* add nodemailer support and remove test environment configuration ([b49fc0d](https://github.com/PabloFerrari027/the-shortener-02/commit/b49fc0da175bc071f1d507f3e3dfa2b4901d5646))

## [5.0.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v4.0.0...v5.0.0) (2025-11-29)


### ✨ Novidades

* add authorization to create, update and delete ([7a5bfa0](https://github.com/PabloFerrari027/the-shortener-02/commit/7a5bfa00bddfcc7127743c1b76d84b3b945e99f1))
* add NotAllowedError for authorization failures ([51b7841](https://github.com/PabloFerrari027/the-shortener-02/commit/51b7841b182969ed08a4d27c51720b3e316e2195))
* add user ownership to short URLs ([c11ca8b](https://github.com/PabloFerrari027/the-shortener-02/commit/c11ca8bfa5e289b9c03a5535be68e59575a476c5))
* create session decorator and guard ([cfbd17e](https://github.com/PabloFerrari027/the-shortener-02/commit/cfbd17e6e121c2f676d83efc1e8402d2d268dbe4))
* enhance users controller with proper guards ([6304c67](https://github.com/PabloFerrari027/the-shortener-02/commit/6304c672e5f98c13c00555a538db9bf35a918f6c))
* implement user-specific URL listing ([b519a27](https://github.com/PabloFerrari027/the-shortener-02/commit/b519a271de6e7e6a0bda7199234cb9de5cc6525a))
* integrate session and auth guards in controller ([3cc4e74](https://github.com/PabloFerrari027/the-shortener-02/commit/3cc4e7444f5b3d1f29bcdd04a950841767963ac9))


### 🐛 Correções

* correct token expiration validation logic ([f9fcb2d](https://github.com/PabloFerrari027/the-shortener-02/commit/f9fcb2d1d3b03f334a483737610b7f0fcfce6d4b))
* improve user deletion with transaction ([3091779](https://github.com/PabloFerrari027/the-shortener-02/commit/3091779fa2246e364931e052a276839cb60b1758))


### ♻️ Refatoração

* remove Session.generateId() method ([c2267ad](https://github.com/PabloFerrari027/the-shortener-02/commit/c2267ade8b7d89322d1edba473f1ca2c022b5a56))
* rename and improve role guard ([d3d20dc](https://github.com/PabloFerrari027/the-shortener-02/commit/d3d20dc9cbf6b9a89a3685cf9501be24ba127a49))
* reorder module imports ([7148a5f](https://github.com/PabloFerrari027/the-shortener-02/commit/7148a5fffc5919703b7020772d1cb03be63b47a4))


### 🔧 Manutenção

* remove debug console.log statements ([e1b7351](https://github.com/PabloFerrari027/the-shortener-02/commit/e1b735124bc04109d3b6adda3e608e1e1e41f462))
* update start scripts and add concurrently ([7ee8c8a](https://github.com/PabloFerrari027/the-shortener-02/commit/7ee8c8a362d897ac47ff20b5ff4ca63bf9f601ff))

## [4.0.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v3.0.0...v4.0.0) (2025-11-29)


### ✅ Testes

* add authentication guard tests to controller ([df0f139](https://github.com/PabloFerrari027/the-shortener-02/commit/df0f13945502e9ce240e7e3db5b4cf7b1ac69fcc))


### 🐛 Correções

* fixes local Git conflicts ([e3b4081](https://github.com/PabloFerrari027/the-shortener-02/commit/e3b408134640b9dcde74e758e302a3f0a0fd61a6))


### ✨ Novidades

* add AdminGuard for role-based access control ([3e19e21](https://github.com/PabloFerrari027/the-shortener-02/commit/3e19e21959cd3abde796738efa0cbb9d405f831c))
* add authentication and authorization guards to users controller ([523b75d](https://github.com/PabloFerrari027/the-shortener-02/commit/523b75d54652079b99cca237303a120df40436e7))
* add authentication guard to protected endpoints ([de11d71](https://github.com/PabloFerrari027/the-shortener-02/commit/de11d71b4a99411c6433d8a568ee1a9fbee70a6a))
* implement authentication and authorization for user management ([6fd0f3f](https://github.com/PabloFerrari027/the-shortener-02/commit/6fd0f3f802f0a9b220e977ef9e8d923700c42af4))

## [3.0.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v2.0.0...v3.0.0) (2025-11-29)


### 🐛 Correções

* use currentPage from repository response ([4045407](https://github.com/PabloFerrari027/the-shortener-02/commit/40454070dfa06242e7ee2286cfd0515a5dce2856))


### ♻️ Refatoração

* rename ListingResponse to ListShortUrlsResponse ([bf68d19](https://github.com/PabloFerrari027/the-shortener-02/commit/bf68d1939f22d8e96ea876ed78cc8064cfe2fa21))


### ✨ Novidades

* add list method to users repository ([b53a33a](https://github.com/PabloFerrari027/the-shortener-02/commit/b53a33a92480651240f05965098a608d5b2a21c6))
* add list users service with tests ([bfa9672](https://github.com/PabloFerrari027/the-shortener-02/commit/bfa96721a9461705a1542c0ca98cf11f6fe02bd4))
* add remove user service with tests ([6a1706f](https://github.com/PabloFerrari027/the-shortener-02/commit/6a1706f518f1cccd4a9fe19b109182cc19c92930))
* add update user service with tests ([0eef89a](https://github.com/PabloFerrari027/the-shortener-02/commit/0eef89a40af252d58cef0e39523d84442199144c))
* add user presentation layer ([e2ae58b](https://github.com/PabloFerrari027/the-shortener-02/commit/e2ae58b67bc28b4c64cc7814e6881139068be195))
* add user role change functionality ([a235503](https://github.com/PabloFerrari027/the-shortener-02/commit/a235503d3ddfba98e293f6615acc24130819d720))
* add users controller with CRUD endpoints ([66df85d](https://github.com/PabloFerrari027/the-shortener-02/commit/66df85daeb059436db8162eb68479c0781851c94))
* add users module and register in app ([cbb1658](https://github.com/PabloFerrari027/the-shortener-02/commit/cbb16587f5e0f24adc269e8e2092487259531d73))

## [2.0.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v1.0.0...v2.0.0) (2025-11-29)


### 🐛 Correções

* remove trailing space from hasher.port import path ([7c047ff](https://github.com/PabloFerrari027/the-shortener-02/commit/7c047ffdf600aff44f9430ec02ff9056b5a25a99))


### 🔧 Manutenção

* add @ alias to module name mapper in jest configs ([7731a68](https://github.com/PabloFerrari027/the-shortener-02/commit/7731a689c8f48b5f2732fb94a08a09aebd2cef24))
* configure environment and Docker setup ([2c51d8c](https://github.com/PabloFerrari027/the-shortener-02/commit/2c51d8c66817d779efba09db599369275e4647cf))
* update app module and environment ([7a31279](https://github.com/PabloFerrari027/the-shortener-02/commit/7a312799cd00f644fbf62d1b353d822ef7c89b73))


### ✨ Novidades

* add auth controller and guard ([991cf4f](https://github.com/PabloFerrari027/the-shortener-02/commit/991cf4fb51b9e7b56be61bab41e80e3ca7776e43))
* add Auth domain layer ([6b4cafc](https://github.com/PabloFerrari027/the-shortener-02/commit/6b4cafc166620326309d427b40c8c84e76abb8ce))
* add auth event and queue handlers ([6921ad3](https://github.com/PabloFerrari027/the-shortener-02/commit/6921ad34da7e37c509a8b1346f5a2432859b6aee))
* add auth module ([2b8b606](https://github.com/PabloFerrari027/the-shortener-02/commit/2b8b6069172beadf2f06fec2b500399432cbc6f3))
* add auth repositories implementation ([53e989a](https://github.com/PabloFerrari027/the-shortener-02/commit/53e989a93c3ef572c4db12b984ca8ea8475dbb18))
* add auth services ([2a285ef](https://github.com/PabloFerrari027/the-shortener-02/commit/2a285ef8003b98bb91b5d2a33f2298a6e62bf3b6))
* add authentication domain error classes ([4e38872](https://github.com/PabloFerrari027/the-shortener-02/commit/4e388721dfaf70df7c7979048d0555d69d72a132))
* add core ports and adapters ([3bb4beb](https://github.com/PabloFerrari027/the-shortener-02/commit/3bb4beb22e096bc931fa04c4c39f0fb99806b83c))
* add database migrations for auth ([77cbccb](https://github.com/PabloFerrari027/the-shortener-02/commit/77cbccbd1783dee65f80c00f7bc41db8e8396d6e))
* add domain events infrastructure ([39e8e8c](https://github.com/PabloFerrari027/the-shortener-02/commit/39e8e8cb30dccb0ecbe52b3479a530b59b0c4baa))
* add infrastructure managers ([2e5f093](https://github.com/PabloFerrari027/the-shortener-02/commit/2e5f093e44ce7bc9ef7b8753654f1648907c0dd3))
* add queue worker application ([f38e2ee](https://github.com/PabloFerrari027/the-shortener-02/commit/f38e2ee0588aa34ba6bdba6f5bc9597ec2e32de4))
* add queue worker, authentication, and development tooling ([5ad118f](https://github.com/PabloFerrari027/the-shortener-02/commit/5ad118fab2fe6114137c80fad59341375dfd1926))
* add User domain layer ([804d9b1](https://github.com/PabloFerrari027/the-shortener-02/commit/804d9b14ac8b8362987abe0e38c019355adef6fb))
* add users repository implementation ([028959d](https://github.com/PabloFerrari027/the-shortener-02/commit/028959d7e5c998e2179bb0e8f8af858096b0af37))
* reate hasher port interface ([ee2e823](https://github.com/PabloFerrari027/the-shortener-02/commit/ee2e823323e9bb67c870dde1a06eb1dc4b0c6a22))


### ♻️ Refatoração

* integrate domain events in short-url ([3a322d4](https://github.com/PabloFerrari027/the-shortener-02/commit/3a322d4722e678058b9417775fe84f070e541894))
* remove eslint disable comment to top of file ([2aadfc2](https://github.com/PabloFerrari027/the-shortener-02/commit/2aadfc22dd4b9365a665a70443ce8259fef1f36c))
* remove pg-short-url-repository implementation` ([9fc7eea](https://github.com/PabloFerrari027/the-shortener-02/commit/9fc7eea29244d34eb27ae800b9bdb58b0b5751ec))
* rename pool parameter to pg in migration ([8c3536b](https://github.com/PabloFerrari027/the-shortener-02/commit/8c3536bc30b8d2daa27721fff779c2db119c7aef))

## [1.0.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v0.3.0...v1.0.0) (2025-11-28)


### 🔧 Manutenção

* remove setup script ([5f315f2](https://github.com/PabloFerrari027/the-shortener-02/commit/5f315f20040dcc729a54cd2e6fa3f1daaf95217d))
* setup project structure and development environment ([59889ca](https://github.com/PabloFerrari027/the-shortener-02/commit/59889caac3575c138a679bf72a762366231cd808))


### 💄 Estilo

* fixes lint ([3346fe1](https://github.com/PabloFerrari027/the-shortener-02/commit/3346fe14fa84eff632ffab2b32b14173b81dafca))


### ♻️ Refatoração

* configure main application module and bootstrap with Swagger ([fa3de6a](https://github.com/PabloFerrari027/the-shortener-02/commit/fa3de6af3f97ad558df9892140c95cb54547b78e))
* replace hardcoded credentials with environment variables in docker compose files ([e992b87](https://github.com/PabloFerrari027/the-shortener-02/commit/e992b873710fa31de326d00c4726ed8b284990b8))


### ✨ Novidades

* add automatic environment files creation to setup script ([0e37d00](https://github.com/PabloFerrari027/the-shortener-02/commit/0e37d00b422d5f945572d9b337e67456e3e24476))
* add domain errors for ShortUrl module ([46f213f](https://github.com/PabloFerrari027/the-shortener-02/commit/46f213fefebd07deda7d219ab1ae3e633e6fd424))
* add environment variables example file ([97ac71e](https://github.com/PabloFerrari027/the-shortener-02/commit/97ac71e74e705110ac182cbe61bbbb34437ef0de))
* add migration to create short_urls table with indexes ([30b4157](https://github.com/PabloFerrari027/the-shortener-02/commit/30b41576c73aa5a80742f2fdd68cabd794fa873a))
* add PostgreSQL database configuration and migration system ([d60d4dc](https://github.com/PabloFerrari027/the-shortener-02/commit/d60d4dca978f8263e3d734cae83020457fcc83bb))
* add REST API controller for short URL operations ([9f71650](https://github.com/PabloFerrari027/the-shortener-02/commit/9f716506841c1dfb469b56d3e30684e5c847087f))
* add shared utilities, types and common classes ([4b7d6d0](https://github.com/PabloFerrari027/the-shortener-02/commit/4b7d6d036ffd9c48654cc6c92ce7d7afd9228e32))
* add ShortUrl domain entity with validation and serialization ([302e73f](https://github.com/PabloFerrari027/the-shortener-02/commit/302e73f6cf25880d844db5c76d0266cb4ce71f71))
* add ShortUrl repository interface ([80ba4d0](https://github.com/PabloFerrari027/the-shortener-02/commit/80ba4d04c18b1a6bed8cf4f850e95319fdbfd5a5))
* configure short URL module with dependency injection ([19c74c7](https://github.com/PabloFerrari027/the-shortener-02/commit/19c74c7ce36aba8888151c0bf5b0193f15236426))
* implement global exception handler for HTTP errors ([6a1d259](https://github.com/PabloFerrari027/the-shortener-02/commit/6a1d259c165b4fc56d041bd6ed9886641ced5a33))
* implement PostgreSQL repository for short URLs ([33c736e](https://github.com/PabloFerrari027/the-shortener-02/commit/33c736e293eb7be4797931d6d6c655d714b2756e))
* implement presentation layer for short URL responses ([9560184](https://github.com/PabloFerrari027/the-shortener-02/commit/9560184e4dfe361e476241a2dd37830f276b81d2))
* implement services for short URL management ([426156f](https://github.com/PabloFerrari027/the-shortener-02/commit/426156fc588889935a7d2a5822e940818c781f36))
* implement update and delete endpoints for short urls ([5a1b431](https://github.com/PabloFerrari027/the-shortener-02/commit/5a1b431d7e9b47dd8dce211cc003f7322d48723a))


### ✅ Testes

* add test case for list endpoint default parameters ([8a2f5d7](https://github.com/PabloFerrari027/the-shortener-02/commit/8a2f5d7548c09472ba643289ba06d4cdaac4039b))
* add tests for update and delete short url endpoints ([e4467a2](https://github.com/PabloFerrari027/the-shortener-02/commit/e4467a2cb8b5facd511aef0b0083ff612c29490e))

## [0.3.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v0.2.0...v0.3.0) (2025-11-27)


### 🐛 Correções

* remove the package manager cache ([5a15a0c](https://github.com/PabloFerrari027/the-shortener-02/commit/5a15a0c7a15fd9a9a20b05a46ce257c7efb1f8f1))


### ✨ Novidades

* add Docker Compose configurations for prod and test environments ([9e8c38e](https://github.com/PabloFerrari027/the-shortener-02/commit/9e8c38e10c8157dad125607b4e44912e5cf1e20c))

## [0.2.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v0.1.0...v0.2.0) (2025-11-27)


### 🔧 Manutenção

* remove default test files ([0645c52](https://github.com/PabloFerrari027/the-shortener-02/commit/0645c52a521c4a635b0add39c771d0980aaaa091))


### ✨ Novidades

* add ES modules support with .js extensions in imports ([7c6ad97](https://github.com/PabloFerrari027/the-shortener-02/commit/7c6ad9768d7f75f85117ddaa7da906c2bb3a969a))
* add GitHub Actions CI workflow ([729c08c](https://github.com/PabloFerrari027/the-shortener-02/commit/729c08c2c1a7023eb24918ec437888f77e47b29a))
* migrate Jest configuration to TypeScript and separate unit/e2e tests ([6983a55](https://github.com/PabloFerrari027/the-shortener-02/commit/6983a557ddf0d8f1f9d4a0b3ec53abd4d6ef16a0))

## [0.1.0](https://github.com/PabloFerrari027/the-shortener-02/compare/v0.0.2...v0.1.0) (2025-11-27)


### 🔧 Manutenção

* add scripts directory to ignore list and fix quote consistency ([f36cd9a](https://github.com/PabloFerrari027/the-shortener-02/commit/f36cd9a018a238ad907decdd1f5b09e964d46616))


### ✨ Novidades

* add project setup script with automated initialization ([504193e](https://github.com/PabloFerrari027/the-shortener-02/commit/504193e0f62b7c577447e36dd263e2391d1a7d08))

### 0.0.2 (2025-11-27)


### 🔧 Manutenção

* ignore package-lock.json file ([b0877da](https://github.com/PabloFerrari027/the-shortener-02/commit/b0877dac890e33160725bc04a4673dfbb0ddc384))


### ✨ Novidades

* add commit conventions and release automation ([f4c1530](https://github.com/PabloFerrari027/the-shortener-02/commit/f4c15303825ba6ec3e0308929da77976ef25b986))
