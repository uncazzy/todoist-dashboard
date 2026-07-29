# Todoist Dashboard

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

A powerful dashboard for Todoist users that provides deep insights into task management and productivity patterns. Visualize your most productive days and times, track task completion trends over time, and gain insights into your focus areas. Built with Next.js, React, and Tailwind CSS.

> [!NOTE]
> I no longer use Todoist, but I continue to maintain this project for fun. It's completely free and open source - no ads, no subscriptions, no monetization. If you find it useful and want to show support, you can [buy me a coffee](https://buymeacoffee.com/azurd) ☕

## Features

- 📊 Comprehensive task analytics and insights
- 📈 Productivity scoring and trends
- 🔄 Recurring task tracking and habit analytics
- 🎯 Focus time recommendations
- 📈 Project distribution analysis
- 📥 HTML export with customizable section selection
- 🌙 Dark mode interface
- 📱 Responsive design

## Technology Stack

- **React** - A JavaScript library for building user interfaces
- **Next.js** - The React Framework for Production
- **TypeScript** - Typed superset of JavaScript
- **Tailwind CSS** - A utility-first CSS framework
- **NextAuth.js** - Authentication for Next.js
- **ECharts** - A powerful charting and visualization library

## Getting Started

### Prerequisites

- Node.js 20.9 or later
- A Todoist account
- Todoist OAuth integration credentials

### Installation
1. Clone the repository:
```bash
git clone https://github.com/uncazzy/todoist-dashboard.git
cd todoist-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up OAuth and environment variables:

   a. Create a Todoist OAuth integration:
   - Go to [Todoist App Management Console](https://developer.todoist.com/appconsole.html)
   - Create a new app
   - Set your OAuth redirect URI to `http://localhost:3000/api/auth/callback/todoist` (for development)
   - Copy your Client ID and Client Secret

   b. Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Todoist OAuth
   TODOIST_CLIENT_ID=your-todoist-client-id
   TODOIST_CLIENT_SECRET=your-todoist-client-secret
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key
   ```
   Note: Generate a secure NEXTAUTH_SECRET using `openssl rand -base64 32` or another secure method

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser and authenticate with your Todoist account.

## Contributing

Contributions to Todoist Dashboard are welcome! Whether it's reporting a bug, suggesting an enhancement, or submitting a code change, your help is appreciated.

Please check out [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions on how to get started.

### Test Data & Development Mode

For development and testing purposes, you can use dummy data instead of connecting to the Todoist API. This is useful for:
- Testing dashboard features without a Todoist account
- Developing new features with realistic data patterns
- Testing edge cases (overdue tasks, stale tasks, streaks, etc.)
- Performance testing with large datasets

#### Using Fake Data

1. **Generate dummy dataset** (only needed once, or when you want fresh data):
```bash
cd test/scripts
python generate_full_dataset.py --projects 6 --active-tasks 75 --completed-tasks 1500 --months 12
```

2. **Enable dummy data mode** by editing `config/dataSource.ts`:
```typescript
export const USE_DUMMY_DATA = true;  // Change to true
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Switch back to real data** by setting `USE_DUMMY_DATA = false` in `config/dataSource.ts`

#### Test Data Generators

The project includes several test data generators in `/test/scripts`:
- `generate_full_dataset.py`: Generate comprehensive dummy dashboard data (projects, active tasks, completed tasks)
- `generate_recurring_tasks.py`: Generate test data for recurring tasks with various patterns

See [test/README.md](test/README.md) for detailed usage instructions and examples.

### Development Guidelines

- Follow the existing code style and conventions
- Keep code clean and maintainable
- Update documentation as needed
- Keep commits atomic and well-described

## Privacy

Todoist Dashboard respects your privacy. It accesses your Todoist data only with your explicit permission and does not store any personal data or task information beyond the active session. See the [Privacy Policy](https://todoist.azzy.cloud/legal) for more details.

## Security

If you discover any security vulnerabilities, please report them directly to [todoist-dashboard@azzy.cloud](mailto:todoist-dashboard@azzy.cloud). Your efforts in making the project more secure are greatly appreciated.

### Dependency overrides

`package.json` pins several transitive dependencies via `overrides`, each to pull a security patch that the direct dependency's own range would otherwise hold back:

| Package | Pin | Reason | Remove when |
|---------|-----|--------|-------------|
| `sharp` | `^0.35.3` | [GHSA-f88m-g3jw-g9cj](https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj) — libvips CVEs in the GIF/TIFF/VIPS decoders affect `sharp < 0.35.0`. Next.js pulls `sharp` in as an optional dependency but pins it below `0.35`, so `npm audit fix` cannot resolve this on its own. | A published Next.js release widens its own `sharp` range to `>=0.35`. |
| `form-data` | `^4.0.6` | [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) — CRLF injection via unescaped multipart field names. Reached through `@doist/todoist-api-typescript`. | That package's own `form-data` dependency reaches `>=4.0.6`. |
| `uuid` | `^11.1.1` | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — missing buffer bounds check in v3/v5/v6. Reached through `@doist/todoist-api-typescript`. | That package's own `uuid` dependency reaches `>=11.1.1`. |
| `postcss` | `$postcss` | [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) (patched in `8.5.12`) and [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) (patched in `8.5.18`) — path traversal and arbitrary `.map` disclosure via `sourceMappingURL`. Next.js hard-pins `postcss` to an exact, patched-out version internally; `$postcss` forces its copy to the same version as our direct dependency. | Next.js bumps its internal `postcss` pin past `8.5.17`. |

`form-data` and `uuid` are pinned rather than fixed by upgrading `@doist/todoist-api-typescript` to `7.x`, because that release depends on `@doist/todoist-sdk >= 8`, which resolves to a major requiring Node.js `>= 24` and which itself ships an `undici` version still inside a known-vulnerable range. The overrides achieve the same patch level without either regression.

`sharp` is only ever loaded by the Next.js image optimizer, which this project disables outright (`images.unoptimized` in `next.config.js`) since it renders no `<Image>` components. The override is belt-and-braces: it protects against the optimizer being re-enabled later.

Note that `sharp 0.35` requires Node.js >= 20.9, which sets the project's Node floor (enforced by `engine-strict` in `.npmrc`).

### Accepted `npm audit` findings

Two advisories are knowingly left unresolved. Both are inapplicable to this project, and both would cost more than they buy:

- **`brace-expansion` ([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), high)** — reached only through the ESLint and Tailwind build toolchains, so it is never shipped to users. The advisory is patched only in `brace-expansion@5.0.8`, whose CommonJS entry point exports an object rather than a callable, so forcing it makes `minimatch@3.x` throw `TypeError: expand is not a function`. `npm audit`'s suggested alternative is `eslint@4.0.0`, a four-major downgrade. Revisit when ESLint's dependency tree reaches a patched `brace-expansion` on its own.
- **`echarts` ([GHSA-fgmj-fm8m-jvvx](https://github.com/advisories/GHSA-fgmj-fm8m-jvvx), moderate XSS)** — the vulnerable path is the *built-in* tooltip formatter of the `lines` series. This project uses no `lines` series (only `bar`, `line`, `pie` and `heatmap`), and every chart supplies its own `formatter`, so neither precondition holds. The fix requires `echarts@6`, which changes the default theme and legend placement and would visibly regress the dashboard's design for no security gain.

Because `npm audit` counts every dependent of a vulnerable package separately, the ESLint chain alone accounts for most of the reported total. The distinct advisory count is two.

## Disclaimer

Todoist Dashboard is an independent project and is not affiliated with, sponsored by, or endorsed by Todoist or Doist. Todoist is a trademark of Doist.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software in accordance with the terms of the license. See the [LICENSE](LICENSE) file for details.