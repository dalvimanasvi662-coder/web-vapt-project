CREATE TABLE `evidence_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingId` varchar(32) NOT NULL,
	`filename` varchar(180) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`capturedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finding_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingId` varchar(32) NOT NULL,
	`status` enum('Open','Remediated','Retested') NOT NULL DEFAULT 'Open',
	`retestLog` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finding_tracker_id` PRIMARY KEY(`id`),
	CONSTRAINT `finding_tracker_findingId_unique` UNIQUE(`findingId`)
);
--> statement-breakpoint
CREATE TABLE `lab_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`role` enum('admin','analyst','viewer') NOT NULL DEFAULT 'viewer',
	`passwordHint` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lab_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_accounts_username_unique` UNIQUE(`username`)
);
