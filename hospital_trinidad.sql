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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admisiones`
--

LOCK TABLES `admisiones` WRITE;
/*!40000 ALTER TABLE `admisiones` DISABLE KEYS */;
INSERT INTO `admisiones` VALUES (1,35,1,'Guardia','Alta','Dificultad respiratoria','2026-04-13 05:39:47'),(2,33,2,'Guardia','Alta','Presion alta mareos vomitos','2026-04-13 05:40:14'),(3,36,15,'Guardia','Alta','aaaa','2026-04-13 05:55:13'),(4,23,5,'Guardia','Alta','eeee','2026-04-13 05:55:25'),(5,36,15,'Guardia','Alta','dolor agudo espalda','2026-04-13 06:13:21'),(6,33,2,'Guardia','Alta','Tos seca ','2026-04-13 06:13:46'),(7,41,15,'Guardia','Alta','dolor pelvico','2026-04-13 17:21:30'),(8,23,5,'Guardia','Alta','ssss','2026-04-13 17:41:41');
/*!40000 ALTER TABLE `admisiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alas`
--

DROP TABLE IF EXISTS `alas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alas` (
  `id_ala` int NOT NULL AUTO_INCREMENT,
  `nombre_ala` varchar(50) NOT NULL,
  PRIMARY KEY (`id_ala`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alas`
--

LOCK TABLES `alas` WRITE;
/*!40000 ALTER TABLE `alas` DISABLE KEYS */;
INSERT INTO `alas` VALUES (1,'Coronaria'),(2,'Medicina General'),(3,'Cirugía');
/*!40000 ALTER TABLE `alas` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_medicas`
--

LOCK TABLES `atenciones_medicas` WRITE;
/*!40000 ALTER TABLE `atenciones_medicas` DISABLE KEYS */;
INSERT INTO `atenciones_medicas` VALUES (1,2,'Palpitaciones elevadas','Enalapril',NULL,1,'internacion','2026-04-13 05:42:35',2,'2026-04-13 05:42:35'),(2,1,'Bronqios obstruidos','Desinflamatorio ',NULL,1,'internacion','2026-04-13 05:43:13',3,'2026-04-13 05:43:13'),(3,4,'ff','ff',NULL,1,'internacion','2026-04-13 05:56:52',1,'2026-04-13 05:56:52'),(4,3,'ggg','cccc',NULL,1,'internacion','2026-04-13 05:57:05',1,'2026-04-13 05:57:05'),(5,6,'dificultad respiratoria aguda','desinflamatrios',NULL,1,'internacion','2026-04-13 06:16:24',2,'2026-04-13 06:16:24'),(6,5,'posible daño vertebral',NULL,'se deriva a traumatologia urgencia',1,'internacion','2026-04-13 06:17:10',3,'2026-04-13 06:17:10'),(7,7,'sin diagnostico','se deriva a internacion para estudios mas completos',NULL,1,'internacion','2026-04-13 17:24:26',2,'2026-04-13 17:24:26'),(8,8,'frfv','bgg','t6tt',1,'internacion','2026-04-13 17:42:37',0,'2026-04-13 17:42:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_triage`
--

LOCK TABLES `atenciones_triage` WRITE;
/*!40000 ALTER TABLE `atenciones_triage` DISABLE KEYS */;
INSERT INTO `atenciones_triage` VALUES (1,1,3,'116/98',35.00,77,66,'Aparente pulmonia','2026-04-13 05:41:10'),(2,2,2,'116/98',36.00,89,76,'Sintomas coronarios graves','2026-04-13 05:41:46'),(3,3,4,'116/98',35.00,40,66,'fff','2026-04-13 05:55:54'),(4,4,2,'120/80',35.00,55,66,'ffffffffff','2026-04-13 05:56:24'),(5,5,3,'120/80',36.00,88,77,'se observa inflamacion zona espalda baja','2026-04-13 06:14:56'),(6,6,2,'117/11',36.00,99,55,'posible neumonia','2026-04-13 06:15:35'),(7,7,3,'120/80',36.00,79,77,'Dolor pelvico','2026-04-13 17:23:18'),(8,8,2,'120/99',36.00,88,77,'gftvfr','2026-04-13 17:42:07');
/*!40000 ALTER TABLE `atenciones_triage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `camas`
--

DROP TABLE IF EXISTS `camas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `camas` (
  `id_cama` int NOT NULL AUTO_INCREMENT,
  `nombre_cama` enum('A','B') NOT NULL,
  `habitacion_id` int NOT NULL,
  `estado_cama` enum('Libre','Ocupada') DEFAULT 'Libre',
  PRIMARY KEY (`id_cama`),
  KEY `habitacion_id` (`habitacion_id`),
  CONSTRAINT `camas_ibfk_1` FOREIGN KEY (`habitacion_id`) REFERENCES `habitaciones` (`id_habitacion`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `camas`
--

LOCK TABLES `camas` WRITE;
/*!40000 ALTER TABLE `camas` DISABLE KEYS */;
INSERT INTO `camas` VALUES (1,'A',1,'Libre'),(2,'A',2,'Libre'),(3,'A',3,'Libre'),(4,'A',4,'Libre'),(5,'A',5,'Libre'),(6,'A',6,'Libre'),(7,'A',7,'Libre'),(8,'A',8,'Libre'),(9,'A',9,'Libre'),(10,'A',10,'Libre'),(11,'A',11,'Libre'),(12,'A',12,'Libre'),(13,'A',13,'Libre'),(14,'A',14,'Libre'),(15,'A',15,'Libre'),(16,'B',1,'Libre'),(17,'B',2,'Libre'),(18,'B',3,'Libre'),(19,'B',4,'Libre'),(20,'B',5,'Libre'),(21,'B',6,'Libre'),(22,'B',7,'Libre'),(23,'B',8,'Libre'),(24,'B',9,'Libre'),(25,'B',10,'Libre'),(26,'B',11,'Libre'),(27,'B',12,'Libre'),(28,'B',13,'Libre'),(29,'B',14,'Libre'),(30,'B',15,'Libre');
/*!40000 ALTER TABLE `camas` ENABLE KEYS */;
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
-- Table structure for table `evoluciones_internacion`
--

DROP TABLE IF EXISTS `evoluciones_internacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evoluciones_internacion` (
  `id_evolucion` int NOT NULL AUTO_INCREMENT,
  `internacion_id` int NOT NULL,
  `medico_id` int NOT NULL,
  `evolucion_clinica` text NOT NULL,
  `tratamiento_actual` text,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evolucion`),
  KEY `internacion_id` (`internacion_id`),
  KEY `medico_id` (`medico_id`),
  CONSTRAINT `evoluciones_internacion_ibfk_1` FOREIGN KEY (`internacion_id`) REFERENCES `internaciones` (`id_internacion`),
  CONSTRAINT `evoluciones_internacion_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`IdMedico`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evoluciones_internacion`
--

LOCK TABLES `evoluciones_internacion` WRITE;
/*!40000 ALTER TABLE `evoluciones_internacion` DISABLE KEYS */;
INSERT INTO `evoluciones_internacion` VALUES (1,2,1,'mejoro','papota','2026-04-13 05:49:41'),(2,1,1,'re bien','','2026-04-13 05:49:58'),(3,3,1,'ffff','rrrr','2026-04-13 05:57:49'),(4,4,1,'ggdd','ss','2026-04-13 05:57:59'),(5,5,1,'evolucion favoravle','mucha atencion','2026-04-13 06:18:35'),(6,6,1,'viene bien','va a safar','2026-04-13 06:19:11'),(7,5,2,'genial','','2026-04-13 06:19:43'),(8,7,1,'asdc','fds','2026-04-13 17:31:10');
/*!40000 ALTER TABLE `evoluciones_internacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `habitaciones`
--

DROP TABLE IF EXISTS `habitaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `habitaciones` (
  `id_habitacion` int NOT NULL AUTO_INCREMENT,
  `numero` int NOT NULL,
  `ala_id` int NOT NULL,
  PRIMARY KEY (`id_habitacion`),
  KEY `ala_id` (`ala_id`),
  CONSTRAINT `habitaciones_ibfk_1` FOREIGN KEY (`ala_id`) REFERENCES `alas` (`id_ala`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `habitaciones`
--

LOCK TABLES `habitaciones` WRITE;
/*!40000 ALTER TABLE `habitaciones` DISABLE KEYS */;
INSERT INTO `habitaciones` VALUES (1,101,1),(2,102,1),(3,103,1),(4,104,1),(5,105,1),(6,201,2),(7,202,2),(8,203,2),(9,204,2),(10,205,2),(11,301,3),(12,302,3),(13,303,3),(14,304,3),(15,305,3);
/*!40000 ALTER TABLE `habitaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internaciones`
--

DROP TABLE IF EXISTS `internaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internaciones` (
  `id_internacion` int NOT NULL AUTO_INCREMENT,
  `admision_id` int NOT NULL,
  `cama_id` int NOT NULL,
  `medico_id` int DEFAULT NULL,
  `fecha_ingreso_piso` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_alta_piso` timestamp NULL DEFAULT NULL,
  `autorizado_alta_medica` tinyint(1) DEFAULT '0',
  `estado_registro` enum('Activo','Finalizado') DEFAULT 'Activo',
  PRIMARY KEY (`id_internacion`),
  KEY `admision_id` (`admision_id`),
  KEY `cama_id` (`cama_id`),
  KEY `fk_internacion_medico` (`medico_id`),
  CONSTRAINT `fk_internacion_medico` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`IdMedico`),
  CONSTRAINT `internaciones_ibfk_1` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id_admision`),
  CONSTRAINT `internaciones_ibfk_2` FOREIGN KEY (`cama_id`) REFERENCES `camas` (`id_cama`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internaciones`
--

LOCK TABLES `internaciones` WRITE;
/*!40000 ALTER TABLE `internaciones` DISABLE KEYS */;
INSERT INTO `internaciones` VALUES (1,1,23,1,'2026-04-13 05:46:23','2026-04-13 05:50:11',1,'Finalizado'),(2,2,4,2,'2026-04-13 05:48:56','2026-04-13 05:51:13',1,'Finalizado'),(3,4,1,2,'2026-04-13 05:57:21','2026-04-13 05:59:36',1,'Finalizado'),(4,3,8,1,'2026-04-13 05:57:26','2026-04-13 06:18:47',1,'Finalizado'),(5,6,6,1,'2026-04-13 06:17:34','2026-04-13 06:20:26',1,'Finalizado'),(6,5,12,1,'2026-04-13 06:17:43','2026-04-13 17:31:27',1,'Finalizado'),(7,7,6,1,'2026-04-13 17:28:17','2026-04-13 17:31:14',1,'Finalizado'),(8,8,18,NULL,'2026-04-13 17:42:49',NULL,1,'Finalizado');
/*!40000 ALTER TABLE `internaciones` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicos`
--

LOCK TABLES `medicos` WRITE;
/*!40000 ALTER TABLE `medicos` DISABLE KEYS */;
INSERT INTO `medicos` VALUES (1,'Sofia','Mendez','54664',NULL,NULL,2,'activo'),(2,'Gabriel','Torrez','3456',NULL,NULL,1,'activo');
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacientes`
--

LOCK TABLES `pacientes` WRITE;
/*!40000 ALTER TABLE `pacientes` DISABLE KEYS */;
INSERT INTO `pacientes` VALUES (1,'12','Felipe','Garcia','2014-06-23','Masculino','47777777','San Luis 343',1,'2026-04-11 17:49:58'),(22,'10','Juan','Perez','1985-01-10','Masculino','3777000001','Calle 101',1,'2026-04-12 21:13:35'),(23,'11','Maria','Gomez','1990-02-11','Femenino','3777000002','Calle 102',5,'2026-04-12 21:13:35'),(24,'13','Ana','Martinez','2000-04-13','Femenino','3777000004','Calle 104',8,'2026-04-12 21:13:35'),(25,'14','Luis','Rodriguez','1995-05-14','Masculino','3777000005','Calle 105',1,'2026-04-12 21:13:35'),(26,'15','Laura','Fernandez','1988-06-15','Femenino','3777000006','Calle 106',12,'2026-04-12 21:13:35'),(27,'16','Pedro','Sanchez','1975-07-16','Masculino','3777000007','Calle 107',6,'2026-04-12 21:13:35'),(28,'17','Sofia','Ramirez','1999-08-17','Femenino','3777000008','Calle 108',1,'2026-04-12 21:13:35'),(29,'18','Diego','Torres','1983-09-18','Masculino','3777000009','Calle 109',9,'2026-04-12 21:13:35'),(30,'19','Valeria','Flores','1992-10-19','Femenino','3777000010','Calle 110',4,'2026-04-12 21:13:35'),(31,'20','Martin','Acosta','1981-11-20','Masculino','3777000011','Calle 111',3,'2026-04-12 21:13:35'),(32,'21','Lucia','Benitez','2001-12-21','Femenino','3777000012','Calle 112',7,'2026-04-12 21:13:35'),(33,'22','Jorge','Herrera','1979-01-22','Masculino','3777000013','Calle 113',2,'2026-04-12 21:13:35'),(34,'23','Paula','Medina','1993-02-23','Femenino','3777000014','Sarmiento 888',10,'2026-04-12 21:13:35'),(35,'24','Ricardo','Aguirre','1987-03-24','Masculino','3777000015','Calle 115',1,'2026-04-12 21:13:35'),(36,'25','Natalia','Rojas','1996-04-25','Femenino','3777000016','Calle 116',15,'2026-04-12 21:13:35'),(37,'26','Fernando','Silva','1984-05-26','Masculino','3777000017','Calle 117',11,'2026-04-12 21:13:35'),(38,'27','Gabriela','Castro','1998-06-27','Femenino','3777000018','Calle 118',1,'2026-04-12 21:13:35'),(39,'28','Hector','Vega','1976-07-28','Masculino','3777000019','Calle 119',13,'2026-04-12 21:13:35'),(40,'29','Daniela','Morales','2002-08-29','Femenino','3777000020','Calle 120',14,'2026-04-12 21:13:35'),(41,'31','Paula','Martin','1978-08-31','Femenino','265343546','San Pedro 1234',15,'2026-04-13 17:21:30');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'Julian','Rios','1234','3777000000','admin@hospital.com','$2b$10$./EpyBRO6lu4LqifjY/wKei.R.MbUzIXqUf1BElILnsTbUA8DpiPi','administrador',NULL,'activo','2026-04-11 15:02:55'),(3,'Luis','Mercado','20111222','26634633333','luisguardia@hospital.com','$2b$10$2UqfbVEXqk2FUuYzXz3w7ueODlGGs5Kh4Jy8A3hzaxeT5arJVpLiW','admision_guardia',NULL,'activo','2026-04-11 15:42:44'),(4,'Mariano','Torres','19222111','265435252562','marianoenferm@hospital.com','$2b$10$RkJT.jI11Lb/Xc.5DbBNdOFViId6NP1.8GbtcMmPwPXvYEixbawdK','enfermeria',NULL,'activo','2026-04-11 16:35:41'),(5,'Sofia','Mendez','19123321','1176564433','sofiadoc@mail.com','$2b$10$gcIpx0tugvrLrCtC/h0l7uGPnFVEp3OI1rsrDOqJA2OY1wjMHfrYy','medico',1,'activo','2026-04-11 17:05:32'),(6,'Marta','Toledo','23444333','1123455432','martaadmision@mail.com','$2b$10$PKq2QnXauh34b524yW0gl.V2GMTSb31cyxyq/V/cKsGuXEfLjcAfa','admision_internacion',NULL,'activo','2026-04-11 17:13:49'),(7,'Gabriel','Torrez','20111333','2654534554','gabrieldoc@mail.com','$2b$10$ejnJ/8zxRaxMSQV5jaD9j.KlT9ovjDnvQDGWkdNaNHPYviP9K0bzi','medico',NULL,'activo','2026-04-11 17:48:28');
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

-- Dump completed on 2026-04-13 16:30:40
