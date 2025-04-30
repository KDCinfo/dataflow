## Testing

### Testing | Jest

@3/30/2025 11:22:31 PM
- Skeleton: Dataflow
	- Mac
		- To install Jest:
			- Upgraded Homebrew
				> brew --version | 4.4.12
				> brew upgrade
				> brew --version | 4.4.26
			- Install pnpm
				> brew install node
				> brew install pnpm
				> node --version | 23.10.0
				> pnpm --version | 10.7.0
			- Install Jest
				> pnpm add --save-dev jest
					| devDependencies: + jest 29.7.0
					| Done in 5.5s using pnpm v10.7.0
				> pnpm add -D @babel/core babel-jest @babel/preset-env
				> pnpm install --save-dev jest-environment-jsdom

#### TL;DR

From `/dataflow`:

> cd data_clump_flow_app
> pnpm run test

### Testing | Automa

> See: ../data_clump_flow_app_src/automa/README.md

-----

## Older flows

Unsure of the validity of the following flows.

### Testing: The Active Index Doesn't Change on Reload

Part 1

- Open an incognito Chrome browser window (or another browser with dev tools)
- Open Dev Tools -> Application -> Local Storage
  - [Observe] It should be empty.
- Open the app in the incognito window.
- Dev Tools: Local Storage should now have the app settings.
  - > AppSettings: AppSettingsInfo:
  - > `{ gridRepeatRangeValue: 2, storageNames: Array(1), storageIndex: 0 }`
- Change to Dev Tools: Session Storage
  - [Observe] { 'dataClumpFlowAppSessionStorageKey': 0 }

Part 2

- Open a 2nd incognito Chrome browser window
- Open Dev Tools -> Application -> Local Storage
- [Observe] It should be empty.
- Open the app in the 2nd incognito window.
- Dev Tools: Local Storage should now have the app settings.
  - > AppSettings: AppSettingsInfo:
  - > `{ gridRepeatRangeValue: 2, storageNames: Array(1), storageIndex: 0 }`
- Change to Dev Tools: Session Storage
- [Observe] { 'dataClumpFlowAppSessionStorageKey': 0 }

Part 3

- In the 2nd browser, create a new storage: t1
- [Observe] Message is displayed in 1st browser
- In the 2nd browser, Select the new storage and click the 'Use Selected' button.
- [Observe] Message is displayed in 1st browser

Part 4

- In the 1st browser, refresh the page.
- [Observe] The selected storage is still 'default'.
- In the 2nd browser, refresh the page.
- [Observe] The selected storage is still 't1'.

```
StorageEvent {
  isTrusted: true,
  key: 'dataClumpFlowAppSettings',
  oldValue: '{"gridRepeatRangeValue":2,"storageNames":["default","t1","t2","t3","t4","t5"],"storageIndex":0}',
  newValue: '{"gridRepeatRangeValue":2,"storageNames":["default","t1","t2","t3","t4","t5","t6"],"storageIndex":0}',
  ...}
```

### Testing: Delete Prevents Adding Clumps

Part 1

- Open an incognito Chrome browser window (or another browser with dev tools)
- Open the app in the incognito window.
- Create a new storage: t1
- Use the new storage: t1
- Add a clump: AA11
- Create a new storage: t2
- Use the new storage: t2
- Add a clump: BB22
- Use the new storage: t1
  - [Observe] Clump AA11 is displayed.

Part 2

- Open a 2nd incognito Chrome browser window
- Open the app in the 2nd incognito window.
- Select the storage: default
- Click the 'Use Selected' button
  - [Observe] Empty page message is displayed
- Select the storage: t1
- Click the 'Delete Selected' button
- Confirm the deletion
  - [Observe] Message is displayed in 1st browser

Part 3

- Back in the 1st browser, try to add a clump
  - [Observe] An alert dialog is displayed
  - [Observe] The clump is not added

-----
