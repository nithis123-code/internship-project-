CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(2048) NOT NULL,
	`status` enum('pending','scanning','completed','failed') NOT NULL DEFAULT 'pending',
	`severity` enum('critical','high','medium','low','info') DEFAULT 'info',
	`totalVulnerabilities` int DEFAULT 0,
	`criticalCount` int DEFAULT 0,
	`highCount` int DEFAULT 0,
	`mediumCount` int DEFAULT 0,
	`lowCount` int DEFAULT 0,
	`infoCount` int DEFAULT 0,
	`scanDuration` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`remediation` text,
	`evidence` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vulnerabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scans` ADD CONSTRAINT `scans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vulnerabilities` ADD CONSTRAINT `vulnerabilities_scanId_scans_id_fk` FOREIGN KEY (`scanId`) REFERENCES `scans`(`id`) ON DELETE no action ON UPDATE no action;