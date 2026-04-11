-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: hospitaltrinidad
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admisiones`
--

DROP TABLE IF EXISTS `admisiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admisiones` (
  `id_admision` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `obra_social_id` int NOT NULL,
  `tipo_admision` enum('Guardia','Consultorio','Internación') DEFAULT 'Guardia',
  `estado_admision` enum('Ventanilla','Espera Triage','En Triage','Espera Médico','En Atención','Alta','Internado','Derivado') DEFAULT 'Ventanilla',
  `motivo_consulta` text,
  `fecha_ingreso` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_admision`),
  KEY `fk_admision_paciente` (`paciente_id`),
  KEY `fk_admision_os` (`obra_social_id`),
  CONSTRAINT `fk_admision_os` FOREIGN KEY (`obra_social_id`) REFERENCES `obras_sociales` (`id_obra_social`),
  CONSTRAINT `fk_admision_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id_paciente`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admisiones`
--

LOCK TABLES `admisiones` WRITE;
/*!40000 ALTER TABLE `admisiones` DISABLE KEYS */;
INSERT INTO `admisiones` VALUES (1,1,8,'Guardia','Alta','dolor\r\n','2026-04-10 22:11:46'),(2,2,18,'Guardia','Internado','Dolor agudo de espalda','2026-04-10 22:31:11'),(3,1,8,'Guardia','Internado','le duele','2026-04-10 22:47:39'),(4,2,18,'Guardia','Internado','hay hay dice','2026-04-11 13:51:50'),(5,2,18,'Guardia','Internado','asa','2026-04-11 15:13:20'),(6,1,8,'Guardia','Espera Médico','ss','2026-04-11 15:50:49'),(7,3,8,'Guardia','Espera Médico','ssss','2026-04-11 15:51:23');
/*!40000 ALTER TABLE `admisiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atenciones_medicas`
--

DROP TABLE IF EXISTS `atenciones_medicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atenciones_medicas` (
  `id_atencion_medica` int NOT NULL AUTO_INCREMENT,
  `admision_id` int NOT NULL,
  `diagnostico` text,
  `tratamiento_medicacion` text,
  `indicaciones_alta` text,
  `requiere_internacion` tinyint(1) DEFAULT '0',
  `estado_atencion` enum('borrador','completada','internacion') DEFAULT 'borrador',
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `tiempo_total_minutos` int DEFAULT NULL,
  `fecha_atencion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_atencion_medica`),
  KEY `fk_medico_admision` (`admision_id`),
  CONSTRAINT `fk_medico_admision` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id_admision`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_medicas`
--

LOCK TABLES `atenciones_medicas` WRITE;
/*!40000 ALTER TABLE `atenciones_medicas` DISABLE KEYS */;
INSERT INTO `atenciones_medicas` VALUES (1,2,'aaaa','sss','cc',1,'internacion','2026-04-11 13:38:40',907,'2026-04-11 13:38:40'),(2,1,'sss','ddd','z',0,'completada','2026-04-11 13:41:54',930,'2026-04-11 13:41:54'),(3,3,'ccc','dd','ee',1,'internacion','2026-04-11 13:49:32',901,'2026-04-11 13:49:32'),(4,4,'ss','ww','dd',1,'internacion','2026-04-11 13:53:00',1,'2026-04-11 13:53:00'),(5,5,'dd','eq','xx',1,'internacion','2026-04-11 15:18:31',5,'2026-04-11 15:18:31');
/*!40000 ALTER TABLE `atenciones_medicas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atenciones_triage`
--

DROP TABLE IF EXISTS `atenciones_triage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atenciones_triage` (
  `id_triage` int NOT NULL AUTO_INCREMENT,
  `admision_id` int NOT NULL,
  `prioridad` tinyint DEFAULT NULL,
  `presion_arterial` varchar(10) DEFAULT NULL,
  `temperatura` decimal(4,2) DEFAULT NULL,
  `frecuencia_cardiaca` int DEFAULT NULL,
  `saturacion_oxigeno` int DEFAULT NULL,
  `observaciones_enfermeria` text,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_triage`),
  KEY `fk_triage_admision` (`admision_id`),
  CONSTRAINT `fk_triage_admision` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id_admision`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_triage`
--

LOCK TABLES `atenciones_triage` WRITE;
/*!40000 ALTER TABLE `atenciones_triage` DISABLE KEYS */;
INSERT INTO `atenciones_triage` VALUES (1,1,4,'120/99',33.00,66,66,'le duele','2026-04-10 22:34:44'),(2,2,2,'116/98',35.00,66,88,'grita le guele','2026-04-10 22:35:54'),(3,3,4,'120/80',35.00,88,99,'dolor punzante','2026-04-10 22:48:22'),(4,4,5,'122/34',22.00,33,33,'ss','2026-04-11 13:52:42'),(5,5,2,'160/11',35.00,55,44,'cdaa','2026-04-11 15:18:02'),(6,6,3,'160/11',36.00,77,55,'hay','2026-04-11 16:39:36'),(7,7,2,'120/99',36.00,66,77,'fff','2026-04-11 16:43:06');
/*!40000 ALTER TABLE `atenciones_triage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especialidades`
--

DROP TABLE IF EXISTS `especialidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especialidades` (
  `IdEspecialidad` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `estado` enum('activa','inactiva') DEFAULT 'activa',
  PRIMARY KEY (`IdEspecialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especialidades`
--

LOCK TABLES `especialidades` WRITE;
/*!40000 ALTER TABLE `especialidades` DISABLE KEYS */;
INSERT INTO `especialidades` VALUES (1,'Clínica Médica','activa'),(2,'Pediatría','activa'),(3,'Cardiología','activa'),(4,'Traumatología','activa'),(5,'Ginecología','activa'),(6,'Obstetricia','activa'),(7,'Neurología','activa'),(8,'Dermatología','activa'),(9,'Oftalmología','activa'),(10,'Otorrinolaringología','activa'),(11,'Urología','activa'),(12,'Psiquiatría','activa'),(13,'Endocrinología','activa'),(14,'Gastroenterología','activa'),(15,'Neumonología','activa');
/*!40000 ALTER TABLE `especialidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicos`
--

DROP TABLE IF EXISTS `medicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicos` (
  `IdMedico` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) NOT NULL,
  `Apellido` varchar(50) NOT NULL,
  `Matricula` varchar(30) NOT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Telefono` bigint DEFAULT NULL,
  `IdEspecialidad` int NOT NULL,
  `estado` enum('activo','inactivo','vacaciones') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`IdMedico`),
  UNIQUE KEY `Matricula` (`Matricula`),
  KEY `fk_medico_especialidad` (`IdEspecialidad`),
  CONSTRAINT `fk_medico_especialidad` FOREIGN KEY (`IdEspecialidad`) REFERENCES `especialidades` (`IdEspecialidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicos`
--

LOCK TABLES `medicos` WRITE;
/*!40000 ALTER TABLE `medicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `obras_sociales`
--

DROP TABLE IF EXISTS `obras_sociales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `obras_sociales` (
  `id_obra_social` int NOT NULL AUTO_INCREMENT,
  `nombre_obra_social` varchar(100) NOT NULL,
  PRIMARY KEY (`id_obra_social`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `obras_sociales`
--

LOCK TABLES `obras_sociales` WRITE;
/*!40000 ALTER TABLE `obras_sociales` DISABLE KEYS */;
INSERT INTO `obras_sociales` VALUES (1,'No posee'),(2,'PAMI (INSSJP)'),(3,'OSDE'),(4,'OSECAC (Comercio)'),(5,'Swiss Medical'),(6,'IOSCOR (Corrientes)'),(7,'IOMA'),(8,'Galeno'),(9,'Sancor Salud'),(10,'Medifé'),(11,'OSDEPYM'),(12,'OSPRERA (Rurales)'),(13,'UPCN (Civiles de la Nación)'),(14,'OSSEG (Seguros)'),(15,'UOCRA (Construcción)'),(16,'OSMATA (Mecánicos)'),(17,'OSPE (Petroleros)'),(18,'OMINT'),(19,'Unión Personal'),(20,'Obra Social del Personal de Sanidad');
/*!40000 ALTER TABLE `obras_sociales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pacientes`
--

DROP TABLE IF EXISTS `pacientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pacientes` (
  `id_paciente` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` enum('Masculino','Femenino','Otro') NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `obrasocial` int DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_paciente`),
  UNIQUE KEY `dni` (`dni`),
  KEY `idx_dni_paciente` (`dni`),
  KEY `fk_paciente_obra_social` (`obrasocial`),
  CONSTRAINT `fk_paciente_obra_social` FOREIGN KEY (`obrasocial`) REFERENCES `obras_sociales` (`id_obra_social`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacientes`
--

LOCK TABLES `pacientes` WRITE;
/*!40000 ALTER TABLE `pacientes` DISABLE KEYS */;
INSERT INTO `pacientes` VALUES (1,'11','Juan','Garcia','2025-06-13','Masculino','333','rree',8,'2026-04-10 21:53:19'),(2,'12','Maria','Gomez','2000-08-19','Femenino','345678','Los Alerces 987',18,'2026-04-10 22:31:11'),(3,'14','cc','sss','2026-04-02','Masculino','33333','ddddd',8,'2026-04-11 15:51:23');
/*!40000 ALTER TABLE `pacientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admision_guardia','admision_internacion','administrador','medico','enfermeria') NOT NULL,
  `id_medico` int DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuario_medico` (`id_medico`),
  CONSTRAINT `fk_usuario_medico` FOREIGN KEY (`id_medico`) REFERENCES `medicos` (`IdMedico`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'Julian','Rios','1234','3777000000','admin@hospital.com','$2b$10$./EpyBRO6lu4LqifjY/wKei.R.MbUzIXqUf1BElILnsTbUA8DpiPi','administrador',NULL,'activo','2026-04-11 15:02:55'),(3,'Luis','Mercado','20111222','26634633333','luis@hospital.com','$2b$10$B5pbUWA9posTYlHqKTlTXeocczAufnfx07c4zsVnXC2eYShJ3MhFK','admision_guardia',NULL,'activo','2026-04-11 15:42:44'),(4,'Mariano','Torres','19222111','265435252562','mariano@hospital.com','$2b$10$pkTaGG33beIz6i1DjG0DiOM90WAmYjQn5pubroMfJbg9zi7tVA856','enfermeria',NULL,'activo','2026-04-11 16:35:41');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:51:33
