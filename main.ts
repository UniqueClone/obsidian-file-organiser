import { Notice, Plugin, TFolder } from "obsidian";

export default class FolderOrganisationPlugin extends Plugin {
	async onload() {
		// await this.loadSettings();

		this.moveFilesToFolder();

		this.addCommand({
			id: "move-files-to-folder",
			name: "Move Files to Folder",
			callback: () => {
				this.moveFilesToFolder();
			},
		});
	}

	onunload() {}

	// async loadSettings() {
	// 	this.settings = Object.assign(
	// 		{},
	// 		DEFAULT_SETTINGS,
	// 		await this.loadData()
	// 	);
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }

	async moveFilesToFolder() {
		// Get all files in the vault
		const files = await this.app.vault.getMarkdownFiles();
		//

		// Get all folders in the vault
		const folders: TFolder[] = []; // = this.app.vault.getRoot();
		// files.map((file) => file.parent).unique();

		for (const file of files) {
			const parent = file.parent;
			if (parent && !folders.includes(parent) && !parent.isRoot()) {
				folders.push(parent);
			}
		}

		for (const file of files) {
			// Find the folder that the file should be in
			const folder = folders.find((folder) =>
				file.basename
					.toLowerCase()
					.contains(folder?.name.toLowerCase() ?? "")
			);

			let shouldMove = false;

			// Make sure there is no space before or after the matching folder name in the file name
			if (folder) {
				const folderName = folder.name.toLowerCase();
				const fileName = file.basename.toLowerCase();

				// Check if the folder name is in the file name
				const folderNameIndex = fileName.indexOf(folderName);
				const folderNameLength = folderName.length;
				const folderNameEndIndex = folderNameIndex + folderNameLength;

				// Check if there is a space before the folder name
				const hasSpaceBefore =
					folderNameIndex > 0 &&
					fileName[folderNameIndex - 1] === " ";

				// Check if there is a space after the folder name
				const hasSpaceAfter =
					folderNameEndIndex < fileName.length &&
					fileName[folderNameEndIndex] === " ";

				// Check if the folder name is at the beginning of the file name
				const isAtBeginning = folderNameIndex === 0;

				// Check if the folder name is at the end of the file name
				const isAtEnd = folderNameEndIndex === fileName.length;

				// Check if the folder name is the entire file name
				const isEntireName =
					folderNameIndex === 0 &&
					folderNameEndIndex === fileName.length;

				shouldMove =
					isEntireName ||
					(isAtBeginning && hasSpaceAfter) ||
					(isAtEnd && hasSpaceBefore) ||
					(hasSpaceBefore && hasSpaceAfter);
			}

			// If the file is not in the correct folder, move it
			// Also, don't move the file if it's in the .obsidian folder
			// Also, don't move the file if the folder is the root folder
			if (
				folder &&
				file?.parent?.path !== folder.path &&
				// !file.path.contains(".obsidian") &&
				!folder.isRoot() &&
				shouldMove
			) {
				// Move the file to the correct folder
				await this.app.fileManager
					.renameFile(
						this.app.vault.getFileByPath(file.path) ?? file,
						folder.path + "/" + file.name
					)
					.catch((error) => {
						new Notice(`Error moving file...${file.basename}`);
						new Notice(error);
					});

				new Notice(`Moved ${file.basename} to ${folder.name} folder.`);
			}
		}
	}
}
