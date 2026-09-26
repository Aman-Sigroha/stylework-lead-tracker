export type MigrationDefinition = {
  version: string;
  name: string;
  upFileName: string;
  downFileName: string;
};

export type AppliedMigration = {
  version: string;
  name: string;
};

export type MigrationRunnerFileSystem = {
  listFiles: (directory: string) => string[];
  readFile: (filePath: string) => string;
};
