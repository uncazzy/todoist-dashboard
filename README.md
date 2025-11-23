# Todoist Dashboard

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

A powerful dashboard for Todoist users that provides deep insights into task management and productivity patterns. Visualize your most productive days and times, track task completion trends over time, and gain insights into your focus areas. Built with Next.js, React, and Tailwind CSS.

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

- Node.js 18.x or later
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

For development and testing purposes, you can use fake data instead of connecting to the Todoist API. This is useful for:
- Testing dashboard features without a Todoist account
- Developing new features with realistic data patterns
- Testing edge cases (overdue tasks, stale tasks, streaks, etc.)
- Performance testing with large datasets

#### Using Fake Data

1. **Generate fake dataset** (only needed once, or when you want fresh data):
```bash
cd test/scripts
python generate_full_dataset.py --projects 6 --active-tasks 75 --completed-tasks 1500 --months 12
```

2. **Enable fake data mode** by editing `config/dataSource.ts`:
```typescript
export const USE_FAKE_DATA = true;  // Change to true
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Switch back to real data** by setting `USE_FAKE_DATA = false` in `config/dataSource.ts`

#### Test Data Generators

The project includes several test data generators in `/test/scripts`:
- `generate_full_dataset.py`: Generate comprehensive fake dashboard data (projects, active tasks, completed tasks)
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

## Disclaimer

Todoist Dashboard is an independent project and is not affiliated with, sponsored by, or endorsed by Todoist or Doist. Todoist is a trademark of Doist.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software in accordance with the terms of the license. See the [LICENSE](LICENSE) file for details.