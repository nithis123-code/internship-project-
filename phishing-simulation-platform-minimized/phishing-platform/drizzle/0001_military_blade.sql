CREATE TABLE `awarenessPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`tips` text,
	`resources` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `awarenessPages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalClicks` int NOT NULL DEFAULT 0,
	`uniqueClicks` int NOT NULL DEFAULT 0,
	`clickRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignAnalytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaignAnalytics_campaignId_unique` UNIQUE(`campaignId`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateId` int NOT NULL,
	`status` enum('draft','scheduled','active','completed','paused') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`launchedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientId` int NOT NULL,
	`campaignId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`ipAddress` varchar(45),
	`referer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clicks_id` PRIMARY KEY(`id`),
	CONSTRAINT `clicks_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`department` varchar(255),
	`status` enum('pending','sent','clicked','reported') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`senderEmail` varchar(320) NOT NULL,
	`description` text,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
