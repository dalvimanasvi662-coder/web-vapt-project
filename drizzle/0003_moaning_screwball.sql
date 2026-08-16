CREATE TABLE `lab_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` int NOT NULL,
	`ownerUsername` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(32) NOT NULL,
	CONSTRAINT `lab_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_invoices_externalId_unique` UNIQUE(`externalId`)
);
