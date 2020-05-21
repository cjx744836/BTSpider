/*
Navicat MySQL Data Transfer

Source Server         : cc
Source Server Version : 50720
Source Host           : localhost:3306
Source Database       : db_bt

Target Server Type    : MYSQL
Target Server Version : 50720
File Encoding         : 65001

Date: 2020-05-22 01:50:05
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for m_file
-- ----------------------------
DROP TABLE IF EXISTS `m_file`;
CREATE TABLE `m_file` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `size` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hash` (`id`,`hash`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=201868 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for m_hash
-- ----------------------------
DROP TABLE IF EXISTS `m_hash`;
CREATE TABLE `m_hash` (
  `id` varchar(256) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `filesize` varchar(10) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
