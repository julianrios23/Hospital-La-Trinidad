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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admisiones`
--

LOCK TABLES `admisiones` WRITE;
/*!40000 ALTER TABLE `admisiones` DISABLE KEYS */;
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
  `fecha_atencion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_atencion_medica`),
  KEY `fk_medico_admision` (`admision_id`),
  CONSTRAINT `fk_medico_admision` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id_admision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_medicas`
--

LOCK TABLES `atenciones_medicas` WRITE;
/*!40000 ALTER TABLE `atenciones_medicas` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atenciones_triage`
--

LOCK TABLES `atenciones_triage` WRITE;
/*!40000 ALTER TABLE `atenciones_triage` DISABLE KEYS */;
/*!40000 ALTER TABLE `atenciones_triage` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacientes`
--

LOCK TABLES `pacientes` WRITE;
/*!40000 ALTER TABLE `pacientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `pacientes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10 17:16:08
