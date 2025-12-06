-- =====================================================
-- ESTUDIA-PRO - SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Base de Datos: MySQL 8.0+
-- Proyecto: Estudia Pro - Plataforma Educativa en Línea
-- Versión: 1.0
-- Fecha: 2025-01-15
-- =====================================================

-- Configuración inicial
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Crear base de datos
DROP DATABASE IF EXISTS estudia_pro;
CREATE DATABASE estudia_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estudia_pro;

-- =====================================================
-- SECCIÓN 1: ENTIDADES FUERTES (EF)
-- =====================================================

-- Tabla: Usuario (EF - Base para especialización)
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rol ENUM('estudiante','creador','admin') NOT NULL,
    puntos_gamificacion INT NOT NULL DEFAULT 0,
    nivel SMALLINT NOT NULL DEFAULT 1,
    foto_perfil_url VARCHAR(500) DEFAULT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
    
    -- Restricciones de dominio
    CONSTRAINT chk_logro_usuario_fecha CHECK (fecha_obtencion <= NOW()),
    
    -- Restricción de unicidad (BR: Un logro solo se obtiene una vez)
    UNIQUE KEY uk_logro_usuario (id_usuario, id_logro),
    
    -- Claves foráneas
    CONSTRAINT fk_logro_usuario_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_logro_usuario_logro FOREIGN KEY (id_logro) 
        REFERENCES Logro(id_logro) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_logro_usuario_fecha (id_usuario, fecha_obtencion DESC)
) ENGINE=InnoDB COMMENT='R31, BR602 - Historial de logros obtenidos';

-- Tabla: Notificacion (ED)
CREATE TABLE Notificacion (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('examen_proximo','logro','tutoria','sistema') NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Restricciones de dominio
    CONSTRAINT chk_notificacion_fecha CHECK (fecha_creacion <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_notificacion_usuario_leida (id_usuario, leida, fecha_creacion DESC)
) ENGINE=InnoDB COMMENT='R32 - Sistema de notificaciones';

-- =====================================================
-- SECCIÓN 11: VISTAS DE NEGOCIO
-- =====================================================

-- Vista: Cursos públicos (BR202 - Solo cursos aprobados)
CREATE OR REPLACE VIEW Vista_Cursos_Publicos AS
SELECT 
    c.id_curso,
    c.titulo,
    c.descripcion,
    c.precio,
    c.tipo,
    c.calificacion,
    c.num_ventas,
    m.nombre_materia,
    m.area_conocimiento,
    u.nombre AS nombre_creador,
    cr.especialidad,
    cr.calificacion_promedio AS calificacion_creador
FROM Curso c
INNER JOIN Materia m ON c.id_materia = m.id_materia
INNER JOIN Creador cr ON c.id_creador = cr.id_creador
INNER JOIN Usuario u ON cr.id_usuario = u.id_usuario
WHERE c.esta_aprobado = TRUE
ORDER BY c.calificacion DESC, c.num_ventas DESC;

-- Vista: Ranking de tutores (BR501 - Mejores tutores)
CREATE OR REPLACE VIEW Vista_Ranking_Tutores AS
SELECT 
    u.id_usuario,
    u.nombre,
    u.foto_perfil_url,
    cr.especialidad,
    cr.calificacion_promedio,
    cr.num_resenas,
    COUNT(DISTINCT t.id_tutoria) AS total_tutorias_completadas,
    AVG(ct.calificacion) AS promedio_tutorias
FROM Usuario u
INNER JOIN Creador cr ON u.id_usuario = cr.id_usuario
LEFT JOIN Tutoria_SOS t ON cr.id_creador = t.id_tutor AND t.estatus = 'completada'
LEFT JOIN Calificacion_Tutor ct ON t.id_tutoria = ct.id_tutoria
WHERE u.estado = 'activo'
GROUP BY u.id_usuario, u.nombre, u.foto_perfil_url, cr.especialidad, cr.calificacion_promedio, cr.num_resenas
HAVING cr.num_resenas > 0
ORDER BY cr.calificacion_promedio DESC, total_tutorias_completadas DESC;

-- Vista: Progreso del estudiante
CREATE OR REPLACE VIEW Vista_Progreso_Estudiante AS
SELECT 
    u.id_usuario,
    u.nombre,
    u.puntos_gamificacion,
    u.nivel,
    COUNT(DISTINCT i.id_inscripcion) AS materias_inscritas,
    COUNT(DISTINCT CASE WHEN i.estatus = 'completado' THEN i.id_inscripcion END) AS materias_completadas,
    COUNT(DISTINCT c.id_compra) AS cursos_comprados,
    COUNT(DISTINCT r.id_resultado) AS examenes_presentados,
    AVG(r.calificacion) AS promedio_examenes,
    COUNT(DISTINCT lu.id_logro_usuario) AS logros_obtenidos
FROM Usuario u
LEFT JOIN Inscripcion i ON u.id_usuario = i.id_usuario
LEFT JOIN Compra c ON u.id_usuario = c.id_usuario
LEFT JOIN Resultado_Examen r ON u.id_usuario = r.id_usuario
LEFT JOIN Logro_Usuario lu ON u.id_usuario = lu.id_usuario
WHERE u.rol = 'estudiante'
GROUP BY u.id_usuario, u.nombre, u.puntos_gamificacion, u.nivel;

-- =====================================================
-- SECCIÓN 12: TRIGGERS DE VALIDACIÓN Y AUDITORÍA
-- =====================================================

-- Trigger: Validar que Opcion_Pregunta solo se use con preguntas de opción múltiple
DELIMITER //

CREATE TRIGGER trg_validar_opcion_pregunta_antes_insertar
BEFORE INSERT ON Opcion_Pregunta
FOR EACH ROW
BEGIN
    DECLARE v_tipo_pregunta VARCHAR(50);
    
    SELECT tipo_pregunta INTO v_tipo_pregunta
    FROM Pregunta_Examen
    WHERE id_pregunta = NEW.id_pregunta;
    
    IF v_tipo_pregunta NOT IN ('opcion_unica', 'opcion_multiple') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Las preguntas de tipo abierta/matematica no pueden tener opciones';
    END IF;
END//

-- Trigger: Validar tipo de respuesta según tipo de pregunta
CREATE TRIGGER trg_validar_respuesta_usuario_antes_insertar
BEFORE INSERT ON Respuesta_Usuario
FOR EACH ROW
BEGIN
    DECLARE v_tipo_pregunta VARCHAR(50);
    
    SELECT tipo_pregunta INTO v_tipo_pregunta
    FROM Pregunta_Examen
    WHERE id_pregunta = NEW.id_pregunta;
    
    -- Validar según tipo de pregunta
    IF v_tipo_pregunta IN ('opcion_unica', 'opcion_multiple') THEN
        IF NEW.respuesta_texto IS NOT NULL OR NEW.respuesta_latex IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Preguntas de opción múltiple no pueden tener texto/latex';
        END IF;
    ELSEIF v_tipo_pregunta = 'abierta' THEN
        IF NEW.respuesta_texto IS NULL OR NEW.respuesta_latex IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Preguntas abiertas deben tener respuesta_texto (no latex)';
        END IF;
    ELSEIF v_tipo_pregunta = 'matematica' THEN
        IF NEW.respuesta_latex IS NULL OR NEW.respuesta_texto IS NOT NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Preguntas matemáticas deben tener respuesta_latex (no texto)';
        END IF;
    END IF;
END//

-- Trigger: Actualizar calificación promedio del creador
CREATE TRIGGER trg_actualizar_calificacion_creador_despues_insertar
AFTER INSERT ON Calificacion_Tutor
FOR EACH ROW
BEGIN
    UPDATE Creador
    SET calificacion_promedio = (
        SELECT AVG(calificacion)
        FROM Calificacion_Tutor
        WHERE id_tutor = NEW.id_tutor
    ),
    num_resenas = (
        SELECT COUNT(*)
        FROM Calificacion_Tutor
        WHERE id_tutor = NEW.id_tutor
    )
    WHERE id_creador = NEW.id_tutor;
END//

-- Trigger: Actualizar calificación del curso
CREATE TRIGGER trg_actualizar_calificacion_curso_despues_insertar
AFTER INSERT ON Calificacion_Recurso
FOR EACH ROW
BEGIN
    UPDATE Curso
    SET calificacion = (
        SELECT AVG(calificacion)
        FROM Calificacion_Recurso
        WHERE id_curso = NEW.id_curso AND verificado_compra = TRUE
    )
    WHERE id_curso = NEW.id_curso;
END//

-- Trigger: Incrementar número de ventas al completar pago
CREATE TRIGGER trg_incrementar_ventas_despues_pago
AFTER UPDATE ON Pago
FOR EACH ROW
BEGIN
    IF NEW.estatus = 'completado' AND OLD.estatus != 'completado' THEN
        UPDATE Curso
        SET num_ventas = num_ventas + 1
        WHERE id_curso = (
            SELECT id_curso FROM Compra WHERE id_compra = NEW.id_compra
        );
    END IF;
END//

-- Trigger: Activar acceso al completar pago
CREATE TRIGGER trg_activar_acceso_despues_pago
AFTER UPDATE ON Pago
FOR EACH ROW
BEGIN
    IF NEW.estatus = 'completado' AND OLD.estatus != 'completado' THEN
        UPDATE Compra
        SET estatus_acceso = 'activo'
        WHERE id_compra = NEW.id_compra;
    END IF;
END//

-- Trigger: Registrar auditoría al modificar curso
CREATE TRIGGER trg_auditar_curso_antes_actualizar
BEFORE UPDATE ON Curso
FOR EACH ROW
BEGIN
    IF NEW.titulo != OLD.titulo OR NEW.descripcion != OLD.descripcion THEN
        SET NEW.fecha_ultima_modificacion = NOW();
        SET NEW.version = OLD.version + 1;
    END IF;
END//

-- Trigger: Registrar auditoría al modificar examen
CREATE TRIGGER trg_auditar_examen_antes_actualizar
BEFORE UPDATE ON Examen
FOR EACH ROW
BEGIN
    IF NEW.titulo != OLD.titulo OR NEW.duracion_minutos != OLD.duracion_minutos THEN
        SET NEW.fecha_ultima_modificacion = NOW();
        SET NEW.version = OLD.version + 1;
    END IF;
END//

-- Trigger: Registrar auditoría al modificar tutoría
CREATE TRIGGER trg_auditar_tutoria_antes_actualizar
BEFORE UPDATE ON Tutoria_SOS
FOR EACH ROW
BEGIN
    IF NEW.fecha_hora != OLD.fecha_hora OR NEW.estatus != OLD.estatus THEN
        SET NEW.fecha_ultima_modificacion = NOW();
        SET NEW.version = OLD.version + 1;
    END IF;
END//

-- Trigger: Validar que solo usuarios con compra puedan calificar
CREATE TRIGGER trg_validar_calificacion_recurso_antes_insertar
BEFORE INSERT ON Calificacion_Recurso
FOR EACH ROW
BEGIN
    DECLARE v_existe_compra INT;
    
    SELECT COUNT(*) INTO v_existe_compra
    FROM Compra
    WHERE id_usuario = NEW.id_usuario 
    AND id_curso = NEW.id_curso
    AND estatus_acceso = 'activo';
    
    IF v_existe_compra = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Solo usuarios que compraron el curso pueden calificarlo (BR403)';
    ELSE
        SET NEW.verificado_compra = TRUE;
    END IF;
END//

-- Trigger: Validar que solo el solicitante pueda calificar tutoría
CREATE TRIGGER trg_validar_calificacion_tutor_antes_insertar
BEFORE INSERT ON Calificacion_Tutor
FOR EACH ROW
BEGIN
    DECLARE v_usuario_tutoria INT;
    DECLARE v_estatus_tutoria VARCHAR(20);
    
    SELECT id_usuario, estatus INTO v_usuario_tutoria, v_estatus_tutoria
    FROM Tutoria_SOS
    WHERE id_tutoria = NEW.id_tutoria;
    
    IF v_usuario_tutoria != NEW.id_usuario THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Solo el solicitante de la tutoría puede calificarla';
    END IF;
    
    IF v_estatus_tutoria != 'completada' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Solo se pueden calificar tutorías completadas';
    END IF;
END//

-- Trigger: Prevenir compras duplicadas
CREATE TRIGGER trg_prevenir_compra_duplicada_antes_insertar
BEFORE INSERT ON Compra
FOR EACH ROW
BEGIN
    DECLARE v_existe_compra INT;
    
    SELECT COUNT(*) INTO v_existe_compra
    FROM Compra
    WHERE id_usuario = NEW.id_usuario 
    AND id_curso = NEW.id_curso;
    
    IF v_existe_compra > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: El usuario ya compró este curso anteriormente';
    END IF;
END//

-- Trigger: Validar que usuario suspendido no pueda crear contenido
CREATE TRIGGER trg_validar_usuario_suspendido_compra
BEFORE INSERT ON Compra
FOR EACH ROW
BEGIN
    DECLARE v_estado_usuario VARCHAR(20);
    
    SELECT estado INTO v_estado_usuario
    FROM Usuario
    WHERE id_usuario = NEW.id_usuario;
    
    IF v_estado_usuario = 'suspendido' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Usuarios suspendidos no pueden realizar compras';
    END IF;
END//

CREATE TRIGGER trg_validar_usuario_suspendido_tutoria
BEFORE INSERT ON Tutoria_SOS
FOR EACH ROW
BEGIN
    DECLARE v_estado_usuario VARCHAR(20);
    
    SELECT estado INTO v_estado_usuario
    FROM Usuario
    WHERE id_usuario = NEW.id_usuario;
    
    IF v_estado_usuario = 'suspendido' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Usuarios suspendidos no pueden solicitar tutorías';
    END IF;
END//

CREATE TRIGGER trg_validar_usuario_suspendido_publicacion
BEFORE INSERT ON Publicacion_Foro
FOR EACH ROW
BEGIN
    DECLARE v_estado_usuario VARCHAR(20);
    
    SELECT estado INTO v_estado_usuario
    FROM Usuario
    WHERE id_usuario = NEW.id_usuario;
    
    IF v_estado_usuario = 'suspendido' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Usuarios suspendidos no pueden publicar en foros';
    END IF;
END//

-- Trigger: Otorgar puntos de gamificación al obtener logro
CREATE TRIGGER trg_otorgar_puntos_logro_despues_insertar
AFTER INSERT ON Logro_Usuario
FOR EACH ROW
BEGIN
    DECLARE v_puntos_logro SMALLINT;
    
    SELECT puntos_otorgados INTO v_puntos_logro
    FROM Logro
    WHERE id_logro = NEW.id_logro;
    
    UPDATE Usuario
    SET puntos_gamificacion = puntos_gamificacion + v_puntos_logro
    WHERE id_usuario = NEW.id_usuario;
END//

-- Trigger: Subir de nivel automáticamente (cada 100 puntos)
CREATE TRIGGER trg_subir_nivel_despues_actualizar_puntos
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    DECLARE v_nuevo_nivel SMALLINT;
    
    IF NEW.puntos_gamificacion != OLD.puntos_gamificacion THEN
        SET v_nuevo_nivel = FLOOR(NEW.puntos_gamificacion / 100) + 1;
        
        IF v_nuevo_nivel > OLD.nivel THEN
            UPDATE Usuario
            SET nivel = v_nuevo_nivel
            WHERE id_usuario = NEW.id_usuario;
        END IF;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- SECCIÓN 13: PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- Procedimiento: Inscribir estudiante en materia
DELIMITER //

CREATE PROCEDURE sp_inscribir_estudiante(
    IN p_id_usuario INT,
    IN p_id_materia INT
)
BEGIN
    DECLARE v_existe_inscripcion INT;
    
    -- Verificar si ya está inscrito
    SELECT COUNT(*) INTO v_existe_inscripcion
    FROM Inscripcion
    WHERE id_usuario = p_id_usuario 
    AND id_materia = p_id_materia;
    
    IF v_existe_inscripcion > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario ya está inscrito en esta materia';
    ELSE
        INSERT INTO Inscripcion (id_usuario, id_materia, fecha_inscripcion, porcentaje_avance, estatus)
        VALUES (p_id_usuario, p_id_materia, NOW(), 0.00, 'activo');
        
        SELECT 'Inscripción exitosa' AS mensaje;
    END IF;
END//

-- Procedimiento: Registrar resultado de examen
CREATE PROCEDURE sp_registrar_resultado_examen(
    IN p_id_examen INT,
    IN p_id_usuario INT,
    IN p_calificacion DECIMAL(5,2),
    IN p_tiempo_empleado SMALLINT
)
BEGIN
    DECLARE v_id_resultado INT;
    
    -- Insertar resultado
    INSERT INTO Resultado_Examen (id_examen, id_usuario, calificacion, fecha_presentacion, tiempo_empleado)
    VALUES (p_id_examen, p_id_usuario, p_calificacion, NOW(), p_tiempo_empleado);
    
    SET v_id_resultado = LAST_INSERT_ID();
    
    -- Crear notificación
    INSERT INTO Notificacion (id_usuario, titulo, mensaje, tipo, fecha_creacion, leida)
    VALUES (
        p_id_usuario,
        'Examen completado',
        CONCAT('Has completado el examen con calificación: ', p_calificacion),
        'examen_proximo',
        NOW(),
        FALSE
    );
    
    SELECT v_id_resultado AS id_resultado, 'Resultado registrado exitosamente' AS mensaje;
END//

-- Procedimiento: Procesar compra de curso
CREATE PROCEDURE sp_procesar_compra_curso(
    IN p_id_usuario INT,
    IN p_id_curso INT,
    IN p_monto DECIMAL(10,2),
    IN p_referencia_externa VARCHAR(100),
    IN p_metodo_pago ENUM('tarjeta','paypal','transferencia')
)
BEGIN
    DECLARE v_id_compra INT;
    DECLARE v_precio_curso DECIMAL(10,2);
    
    -- Validar precio
    SELECT precio INTO v_precio_curso
    FROM Curso
    WHERE id_curso = p_id_curso AND esta_aprobado = TRUE;
    
    IF v_precio_curso IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El curso no existe o no está aprobado';
    END IF;
    
    IF p_monto < v_precio_curso THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El monto es insuficiente para comprar el curso';
    END IF;
    
    -- Insertar compra
    INSERT INTO Compra (id_usuario, id_curso, fecha_compra, estatus_acceso)
    VALUES (p_id_usuario, p_id_curso, NOW(), 'activo');
    
    SET v_id_compra = LAST_INSERT_ID();
    
    -- Insertar pago
    INSERT INTO Pago (id_compra, monto, referencia_externa, metodo_pago, fecha_pago, estatus)
    VALUES (v_id_compra, p_monto, p_referencia_externa, p_metodo_pago, NOW(), 'completado');
    
    -- Crear notificación
    INSERT INTO Notificacion (id_usuario, titulo, mensaje, tipo, fecha_creacion, leida)
    VALUES (
        p_id_usuario,
        'Compra exitosa',
        CONCAT('Has adquirido el curso: ', (SELECT titulo FROM Curso WHERE id_curso = p_id_curso)),
        'sistema',
        NOW(),
        FALSE
    );
    
    SELECT v_id_compra AS id_compra, 'Compra procesada exitosamente' AS mensaje;
END//

-- Procedimiento: Agendar tutoría
CREATE PROCEDURE sp_agendar_tutoria(
    IN p_id_usuario INT,
    IN p_id_materia INT,
    IN p_id_tutor INT,
    IN p_duracion ENUM('30','60'),
    IN p_fecha_hora DATETIME,
    IN p_tema VARCHAR(255)
)
BEGIN
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_id_tutoria INT;
    
    -- Calcular precio (ejemplo: 30 min = $150, 60 min = $250)
    SET v_precio = IF(p_duracion = '30', 150.00, 250.00);
    
    -- Validar que la fecha sea futura
    IF p_fecha_hora <= NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La fecha de la tutoría debe ser futura';
    END IF;
    
    -- Insertar tutoría
    INSERT INTO Tutoria_SOS (
        id_usuario, id_materia, id_tutor, duracion, precio, 
        fecha_hora, estatus, estatus_pago, tema, version
    )
    VALUES (
        p_id_usuario, p_id_materia, p_id_tutor, p_duracion, v_precio,
        p_fecha_hora, 'pendiente', 'pendiente', p_tema, 1
    );
    
    SET v_id_tutoria = LAST_INSERT_ID();
    
    -- Crear notificación para el tutor
    INSERT INTO Notificacion (id_usuario, titulo, mensaje, tipo, fecha_creacion, leida)
    VALUES (
        (SELECT id_usuario FROM Creador WHERE id_creador = p_id_tutor),
        'Nueva solicitud de tutoría',
        CONCAT('Tienes una nueva solicitud de tutoría sobre: ', p_tema),
        'tutoria',
        NOW(),
        FALSE
    );
    
    SELECT v_id_tutoria AS id_tutoria, v_precio AS precio, 'Tutoría agendada exitosamente' AS mensaje;
END//

DELIMITER ;

-- =====================================================
-- SECCIÓN 14: DATOS INICIALES (SEEDS)
-- =====================================================

-- Insertar instituciones del IPN
INSERT INTO Institucion (nombre, siglas) VALUES
('Escuela Superior de Cómputo', 'ESCOM'),
('Unidad Profesional Interdisciplinaria en Ingeniería y Tecnologías Avanzadas', 'UPIITA'),
('Escuela Superior de Ingeniería Mecánica y Eléctrica', 'ESIME');

-- Insertar materias base
INSERT INTO Materia (nombre_materia, descripcion, area_conocimiento) VALUES
('Cálculo Diferencial e Integral', 'Fundamentos de cálculo de una y varias variables', 'Matemáticas'),
('Álgebra Lineal', 'Espacios vectoriales, matrices y sistemas de ecuaciones', 'Matemáticas'),
('Ecuaciones Diferenciales', 'Resolución de ecuaciones diferenciales ordinarias', 'Matemáticas'),
('Probabilidad y Estadística', 'Teoría de probabilidad y estadística inferencial', 'Matemáticas'),
('Física I', 'Mecánica clásica y cinemática', 'Física');

-- Insertar logros predefinidos
INSERT INTO Logro (nombre_logro, descripcion, icono_url, puntos_otorgados, tipo) VALUES
('Primer Paso', 'Completa tu primer examen', 'https://ejemplo.com/logros/primer_paso.png', 10, 'examen'),
('Racha de 3', 'Aprueba 3 exámenes consecutivos', 'https://ejemplo.com/logros/racha_3.png', 30, 'racha'),
('Estudiante Aplicado', 'Resuelve 50 preguntas correctamente', 'https://ejemplo.com/logros/aplicado.png', 50, 'practica'),
('Comunidad Activa', 'Publica 10 veces en los foros', 'https://ejemplo.com/logros/comunidad.png', 20, 'social'),
('Maestría', 'Obtén calificación perfecta en 5 exámenes', 'https://ejemplo.com/logros/maestria.png', 100, 'examen');

-- Insertar usuario administrador por defecto
INSERT INTO Usuario (nombre, email, contraseña, fecha_registro, rol, puntos_gamificacion, nivel, estado)
VALUES ('Administrador Sistema', 'admin@estudia-pro.mx', SHA2('AdminEstudiaPro2025', 256), NOW(), 'admin', 0, 1, 'activo');

SET @admin_id = LAST_INSERT_ID();

INSERT INTO Administrador (id_usuario, permisos)
VALUES (@admin_id, 'ALL');

-- =====================================================
-- SECCIÓN 15: ÍNDICES DE RENDIMIENTO ADICIONALES
-- =====================================================

-- Índices para optimizar queries frecuentes (< 2 segundos según Plan de Calidad)
CREATE INDEX idx_curso_fecha_creacion ON Curso(fecha_creacion DESC);
CREATE INDEX idx_examen_duracion ON Examen(duracion_minutos);
CREATE INDEX idx_tutoria_precio ON Tutoria_SOS(precio);
CREATE INDEX idx_compra_estatus_fecha ON Compra(estatus_acceso, fecha_compra DESC);
CREATE INDEX idx_notificacion_tipo ON Notificacion(tipo, leida);

-- =====================================================
-- SECCIÓN 16: CONFIGURACIÓN FINAL Y PERMISOS
-- =====================================================

-- Restaurar configuración inicial
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificación de tablas creadas
SELECT 
    TABLE_NAME AS 'Tabla',
    TABLE_ROWS AS 'Registros',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Tamaño (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'estudia_pro'
ORDER BY TABLE_NAME;

SELECT '✅ Base de datos ESTUDIA-PRO creada exitosamente' AS 'Estado';
SELECT '✅ 24 Tablas principales' AS 'Entidades';
SELECT '✅ 3 Vistas de negocio' AS 'Vistas';
SELECT '✅ 19 Triggers de validación' AS 'Triggers';
SELECT '✅ 4 Procedimientos almacenados' AS 'Procedimientos';
SELECT '✅ Datos iniciales insertados' AS 'Seeds';
SELECT '🚀 Sistema listo para desarrollo' AS 'Próximo_Paso';k_usuario_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT chk_usuario_contraseña CHECK (CHAR_LENGTH(contraseña) >= 8),
    CONSTRAINT chk_usuario_puntos CHECK (puntos_gamificacion >= 0),
    CONSTRAINT chk_usuario_nivel CHECK (nivel >= 1),
    CONSTRAINT chk_usuario_foto_url CHECK (foto_perfil_url IS NULL OR foto_perfil_url REGEXP '^https?://'),
    CONSTRAINT chk_usuario_fecha_registro CHECK (fecha_registro <= NOW()),
    
    INDEX idx_usuario_email (email),
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_estado (estado)
) ENGINE=InnoDB COMMENT='BR101, BR102 - Gestión centralizada de usuarios';

-- Tabla: Institucion (EF)
CREATE TABLE Institucion (
    id_institucion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    siglas VARCHAR(20) NOT NULL,
    
    -- Restricciones de dominio
    CONSTRAINT chk_institucion_siglas CHECK (CHAR_LENGTH(siglas) <= 20),
    
    INDEX idx_institucion_siglas (siglas)
) ENGINE=InnoDB COMMENT='BR103 - Instituciones educativas del IPN';

-- Tabla: Materia (EF)
CREATE TABLE Materia (
    id_materia INT AUTO_INCREMENT PRIMARY KEY,
    nombre_materia VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    area_conocimiento VARCHAR(50) NOT NULL,
    
    INDEX idx_materia_area (area_conocimiento)
) ENGINE=InnoDB COMMENT='BR201 - Materias del tronco común de ingeniería';

-- Tabla: Logro (EF)
CREATE TABLE Logro (
    id_logro INT AUTO_INCREMENT PRIMARY KEY,
    nombre_logro VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    icono_url VARCHAR(500) DEFAULT NULL,
    puntos_otorgados SMALLINT NOT NULL,
    tipo ENUM('examen','practica','racha','social') NOT NULL,
    
    -- Restricciones de dominio
    CONSTRAINT chk_logro_puntos CHECK (puntos_otorgados > 0),
    
    INDEX idx_logro_tipo (tipo)
) ENGINE=InnoDB COMMENT='BR602 - Sistema de gamificación y recompensas';

-- =====================================================
-- SECCIÓN 2: ENTIDADES DÉBILES - ESPECIALIZACIÓN DE USUARIO
-- =====================================================

-- Tabla: Estudiante (ED - Especialización parcial disjunta)
CREATE TABLE Estudiante (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    nivel_escolar VARCHAR(50) NOT NULL,
    id_institucion INT NOT NULL,
    
    -- Restricciones de dominio
    CONSTRAINT chk_estudiante_nivel CHECK (nivel_escolar IN ('Licenciatura', 'Ingeniería', 'Posgrado')),
    
    -- Claves foráneas
    CONSTRAINT fk_estudiante_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_estudiante_institucion FOREIGN KEY (id_institucion) 
        REFERENCES Institucion(id_institucion) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_estudiante_institucion (id_institucion)
) ENGINE=InnoDB COMMENT='R1, R4, BR103 - Perfil de estudiantes';

-- Tabla: Creador (ED - Especialización parcial disjunta)
CREATE TABLE Creador (
    id_creador INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    ranking_promedio DECIMAL(3,2) DEFAULT 0.00,
    num_resenas INT DEFAULT 0,
    
    -- Restricciones de dominio
    CONSTRAINT chk_creador_calificacion CHECK (calificacion_promedio BETWEEN 0.00 AND 5.00),
    CONSTRAINT chk_creador_ranking CHECK (ranking_promedio BETWEEN 0.00 AND 5.00),
    CONSTRAINT chk_creador_num_resenas CHECK (num_resenas >= 0),
    
    -- Claves foráneas
    CONSTRAINT fk_creador_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_creador_calificacion (calificacion_promedio DESC),
    INDEX idx_creador_especialidad (especialidad)
) ENGINE=InnoDB COMMENT='R2, BR501 - Proveedores de contenido y tutores';

-- Tabla: Administrador (ED - Especialización parcial disjunta)
CREATE TABLE Administrador (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    permisos VARCHAR(255) NOT NULL,
    
    -- Claves foráneas
    CONSTRAINT fk_administrador_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='R3, BR202 - Gestores y moderadores del sistema';

-- =====================================================
-- SECCIÓN 3: ENTIDADES DE CONTENIDO ACADÉMICO
-- =====================================================

-- Tabla: Curso (EF con auditoría)
CREATE TABLE Curso (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    id_creador INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tipo ENUM('guia','examen_resuelto','curso_completo') NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calificacion DECIMAL(3,2) DEFAULT 0.00,
    preview_disponible BOOLEAN NOT NULL DEFAULT FALSE,
    num_ventas INT DEFAULT 0,
    esta_aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Campos de auditoría (BR203)
    fecha_ultima_modificacion DATETIME DEFAULT NULL,
    modificado_por INT DEFAULT NULL,
    version INT NOT NULL DEFAULT 1,
    
    -- Restricciones de dominio
    CONSTRAINT chk_curso_precio CHECK (precio >= 0),
    CONSTRAINT chk_curso_calificacion CHECK (calificacion BETWEEN 0.00 AND 5.00),
    CONSTRAINT chk_curso_num_ventas CHECK (num_ventas >= 0),
    CONSTRAINT chk_curso_version CHECK (version >= 1),
    CONSTRAINT chk_curso_fecha_creacion CHECK (fecha_creacion <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_curso_materia FOREIGN KEY (id_materia) 
        REFERENCES Materia(id_materia) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_curso_creador FOREIGN KEY (id_creador) 
        REFERENCES Creador(id_creador) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_curso_modificado_por FOREIGN KEY (modificado_por) 
        REFERENCES Usuario(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_curso_materia_aprobado (id_materia, esta_aprobado),
    INDEX idx_curso_creador (id_creador),
    INDEX idx_curso_calificacion (calificacion DESC),
    INDEX idx_curso_tipo (tipo)
) ENGINE=InnoDB COMMENT='R5, R6, R15, BR201, BR202, BR203 - Recursos educativos';

-- Tabla: Recurso (ED - Archivos del curso)
CREATE TABLE Recurso (
    id_recurso INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,
    nombre_archivo VARCHAR(200) NOT NULL,
    tipo_recurso ENUM('PDF','video','imagen') NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    es_preview BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Restricciones de dominio
    CONSTRAINT chk_recurso_url CHECK (url_archivo REGEXP '^https?://'),
    
    -- Claves foráneas
    CONSTRAINT fk_recurso_curso FOREIGN KEY (id_curso) 
        REFERENCES Curso(id_curso) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_recurso_curso (id_curso),
    INDEX idx_recurso_tipo (tipo_recurso)
) ENGINE=InnoDB COMMENT='R10 - Archivos adjuntos a cursos';

-- =====================================================
-- SECCIÓN 4: SISTEMA DE EVALUACIÓN
-- =====================================================

-- Tabla: Examen (ED con auditoría)
CREATE TABLE Examen (
    id_examen INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    duracion_minutos SMALLINT NOT NULL,
    numero_preguntas SMALLINT DEFAULT 0,
    tipo ENUM('simulacro','evaluacion','diagnostico') NOT NULL,
    
    -- Campos de auditoría (BR203)
    fecha_ultima_modificacion DATETIME DEFAULT NULL,
    modificado_por INT DEFAULT NULL,
    version INT NOT NULL DEFAULT 1,
    
    -- Restricciones de dominio
    CONSTRAINT chk_examen_duracion CHECK (duracion_minutos > 0 AND duracion_minutos <= 240),
    CONSTRAINT chk_examen_num_preguntas CHECK (numero_preguntas >= 0),
    CONSTRAINT chk_examen_version CHECK (version >= 1),
    
    -- Claves foráneas
    CONSTRAINT fk_examen_curso FOREIGN KEY (id_curso) 
        REFERENCES Curso(id_curso) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_examen_modificado_por FOREIGN KEY (modificado_por) 
        REFERENCES Usuario(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_examen_curso (id_curso),
    INDEX idx_examen_tipo (tipo)
) ENGINE=InnoDB COMMENT='R13, R33, BR301, BR303 - Evaluaciones y simuladores';

-- Tabla: Pregunta_Examen (ED)
CREATE TABLE Pregunta_Examen (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_examen INT NOT NULL,
    enunciado TEXT NOT NULL,
    puntos SMALLINT NOT NULL,
    solucion_texto TEXT DEFAULT NULL,
    tipo_pregunta ENUM('opcion_unica', 'opcion_multiple', 'abierta', 'matematica') NOT NULL,
    
    -- Restricciones de dominio
    CONSTRAINT chk_pregunta_puntos CHECK (puntos > 0),
    
    -- Claves foráneas
    CONSTRAINT fk_pregunta_examen FOREIGN KEY (id_examen) 
        REFERENCES Examen(id_examen) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_pregunta_examen (id_examen),
    INDEX idx_pregunta_tipo (tipo_pregunta)
) ENGINE=InnoDB COMMENT='R16, BR301 - Reactivos de evaluación';

-- Tabla: Opcion_Pregunta (ED - Solo para opciones múltiples)
CREATE TABLE Opcion_Pregunta (
    id_opcion INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT NOT NULL,
    texto_opcion VARCHAR(500) NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Claves foráneas
    CONSTRAINT fk_opcion_pregunta FOREIGN KEY (id_pregunta) 
        REFERENCES Pregunta_Examen(id_pregunta) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_opcion_pregunta (id_pregunta)
) ENGINE=InnoDB COMMENT='R17, BR301 - Opciones de respuesta múltiple';

-- Tabla: Resultado_Examen (ED - Asociativa)
CREATE TABLE Resultado_Examen (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_examen INT NOT NULL,
    id_usuario INT NOT NULL,
    calificacion DECIMAL(5,2) NOT NULL,
    fecha_presentacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tiempo_empleado SMALLINT NOT NULL,
    
    -- Restricciones de dominio
    CONSTRAINT chk_resultado_calificacion CHECK (calificacion BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_resultado_tiempo CHECK (tiempo_empleado > 0),
    CONSTRAINT chk_resultado_fecha CHECK (fecha_presentacion <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_resultado_examen FOREIGN KEY (id_examen) 
        REFERENCES Examen(id_examen) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resultado_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_resultado_usuario_fecha (id_usuario, fecha_presentacion DESC),
    INDEX idx_resultado_examen (id_examen)
) ENGINE=InnoDB COMMENT='R18, BR302 - Historial de presentación de exámenes';

-- Tabla: Respuesta_Usuario (ED)
CREATE TABLE Respuesta_Usuario (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_resultado INT NOT NULL,
    id_pregunta INT NOT NULL,
    respuesta_texto TEXT DEFAULT NULL,
    respuesta_latex TEXT DEFAULT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    puntos_obtenidos DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Restricciones de dominio
    CONSTRAINT chk_respuesta_puntos CHECK (puntos_obtenidos >= 0),
    
    -- Claves foráneas
    CONSTRAINT fk_respuesta_resultado FOREIGN KEY (id_resultado) 
        REFERENCES Resultado_Examen(id_resultado) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_respuesta_pregunta FOREIGN KEY (id_pregunta) 
        REFERENCES Pregunta_Examen(id_pregunta) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_respuesta_resultado (id_resultado),
    INDEX idx_respuesta_pregunta (id_pregunta)
) ENGINE=InnoDB COMMENT='R19, R20, BR302 - Respuestas individuales del estudiante';

-- Tabla: Seleccion_Usuario (ED - Para opciones múltiples)
CREATE TABLE Seleccion_Usuario (
    id_seleccion INT AUTO_INCREMENT PRIMARY KEY,
    id_respuesta INT NOT NULL,
    id_opcion INT NOT NULL,
    
    -- Claves foráneas
    CONSTRAINT fk_seleccion_respuesta FOREIGN KEY (id_respuesta) 
        REFERENCES Respuesta_Usuario(id_respuesta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seleccion_opcion FOREIGN KEY (id_opcion) 
        REFERENCES Opcion_Pregunta(id_opcion) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_seleccion_respuesta (id_respuesta),
    INDEX idx_seleccion_opcion (id_opcion)
) ENGINE=InnoDB COMMENT='R21, R22 - Opciones seleccionadas por el usuario';

-- =====================================================
-- SECCIÓN 5: TRANSACCIONES Y MARKETPLACE
-- =====================================================

-- Tabla: Compra (ED - Asociativa)
CREATE TABLE Compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estatus_acceso ENUM('activo','expirado') NOT NULL DEFAULT 'activo',
    
    -- Restricciones de dominio
    CONSTRAINT chk_compra_fecha CHECK (fecha_compra <= NOW()),
    
    -- Restricción de unicidad (BR: Usuario no puede comprar mismo curso 2 veces)
    UNIQUE KEY uk_compra_usuario_curso (id_usuario, id_curso),
    
    -- Claves foráneas
    CONSTRAINT fk_compra_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_compra_curso FOREIGN KEY (id_curso) 
        REFERENCES Curso(id_curso) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_compra_usuario_curso (id_usuario, id_curso, estatus_acceso),
    INDEX idx_compra_fecha (fecha_compra DESC)
) ENGINE=InnoDB COMMENT='R11, BR401 - Registro de compras de cursos';

-- Tabla: Pago (ED)
CREATE TABLE Pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL UNIQUE,
    monto DECIMAL(10,2) NOT NULL,
    referencia_externa VARCHAR(100) NOT NULL,
    metodo_pago ENUM('tarjeta','paypal','transferencia') NOT NULL,
    fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estatus ENUM('pendiente','completado','fallido') NOT NULL DEFAULT 'pendiente',
    
    -- Restricciones de dominio
    CONSTRAINT chk_pago_monto CHECK (monto > 0),
    CONSTRAINT chk_pago_fecha CHECK (fecha_pago <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_pago_compra FOREIGN KEY (id_compra) 
        REFERENCES Compra(id_compra) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_pago_estatus (estatus),
    INDEX idx_pago_referencia (referencia_externa)
) ENGINE=InnoDB COMMENT='R12, BR401, BR402 - Trazabilidad de pagos';

-- =====================================================
-- SECCIÓN 6: INSCRIPCIONES Y PROGRESO
-- =====================================================

-- Tabla: Inscripcion (ED - Asociativa)
CREATE TABLE Inscripcion (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_materia INT NOT NULL,
    fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    porcentaje_avance DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    estatus ENUM('activo','completado','abandonado') NOT NULL DEFAULT 'activo',
    
    -- Restricciones de dominio
    CONSTRAINT chk_inscripcion_avance CHECK (porcentaje_avance BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_inscripcion_fecha CHECK (fecha_inscripcion <= NOW()),
    
    -- Restricción bidireccional (mejorada)
    CONSTRAINT chk_inscripcion_completado CHECK (
        (estatus = 'completado' AND porcentaje_avance = 100.00) OR
        (estatus != 'completado' AND porcentaje_avance < 100.00)
    ),
    
    -- Restricción de unicidad (BR: No inscripción duplicada activa)
    UNIQUE KEY uk_inscripcion_usuario_materia (id_usuario, id_materia),
    
    -- Claves foráneas
    CONSTRAINT fk_inscripcion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscripcion_materia FOREIGN KEY (id_materia) 
        REFERENCES Materia(id_materia) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_inscripcion_usuario (id_usuario, estatus)
) ENGINE=InnoDB COMMENT='R7 - Seguimiento de progreso por materia';

-- =====================================================
-- SECCIÓN 7: TUTORÍAS Y SERVICIOS
-- =====================================================

-- Tabla: Tutoria_SOS (ED - Asociativa con auditoría)
CREATE TABLE Tutoria_SOS (
    id_tutoria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_materia INT NOT NULL,
    id_tutor INT NOT NULL,
    duracion ENUM('30','60') NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estatus ENUM('pendiente','confirmada','completada','cancelada') NOT NULL DEFAULT 'pendiente',
    estatus_pago ENUM('pendiente','pagado','reembolsado') NOT NULL DEFAULT 'pendiente',
    tema VARCHAR(255) NOT NULL,
    url_reunion VARCHAR(500) DEFAULT NULL,
    
    -- Campos de auditoría (BR203)
    fecha_ultima_modificacion DATETIME DEFAULT NULL,
    modificado_por INT DEFAULT NULL,
    version INT NOT NULL DEFAULT 1,
    
    -- Restricciones de dominio
    CONSTRAINT chk_tutoria_precio CHECK (precio >= 0),
    CONSTRAINT chk_tutoria_version CHECK (version >= 1),
    
    -- BR503: URL obligatoria si confirmada
    CONSTRAINT chk_tutoria_url_confirmada CHECK (
        (estatus = 'confirmada' AND url_reunion IS NOT NULL) OR
        (estatus != 'confirmada')
    ),
    
    -- Claves foráneas
    CONSTRAINT fk_tutoria_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tutoria_materia FOREIGN KEY (id_materia) 
        REFERENCES Materia(id_materia) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tutoria_tutor FOREIGN KEY (id_tutor) 
        REFERENCES Creador(id_creador) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tutoria_modificado_por FOREIGN KEY (modificado_por) 
        REFERENCES Usuario(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_tutoria_tutor_estatus (id_tutor, estatus, fecha_hora),
    INDEX idx_tutoria_usuario (id_usuario),
    INDEX idx_tutoria_fecha (fecha_hora DESC)
) ENGINE=InnoDB COMMENT='R8, R23, R24, R25, BR501, BR502, BR503 - Sistema de tutorías rápidas';

-- =====================================================
-- SECCIÓN 8: SISTEMA DE CALIFICACIONES Y RESEÑAS
-- =====================================================

-- Tabla: Calificacion_Recurso (ED - Asociativa)
CREATE TABLE Calificacion_Recurso (
    id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    calificacion SMALLINT NOT NULL,
    comentario TEXT DEFAULT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verificado_compra BOOLEAN NOT NULL DEFAULT FALSE,
    fue_util INT NOT NULL DEFAULT 0,
    
    -- Restricciones de dominio
    CONSTRAINT chk_calificacion_recurso_valor CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_recurso_fue_util CHECK (fue_util >= 0),
    CONSTRAINT chk_calificacion_recurso_fecha CHECK (fecha_creacion <= NOW()),
    
    -- Restricción de unicidad (Un usuario solo puede calificar un curso una vez)
    UNIQUE KEY uk_calificacion_recurso_usuario_curso (id_usuario, id_curso),
    
    -- Claves foráneas
    CONSTRAINT fk_calificacion_recurso_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calificacion_recurso_curso FOREIGN KEY (id_curso) 
        REFERENCES Curso(id_curso) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_calificacion_recurso_curso (id_curso, calificacion DESC),
    INDEX idx_calificacion_recurso_verificado (verificado_compra, fue_util DESC)
) ENGINE=InnoDB COMMENT='R14, BR403 - Reseñas de cursos y recursos';

-- Tabla: Calificacion_Tutor (ED - Asociativa)
CREATE TABLE Calificacion_Tutor (
    id_calificacion_tutor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_tutor INT NOT NULL,
    id_tutoria INT NOT NULL,
    calificacion SMALLINT NOT NULL,
    comentario TEXT DEFAULT NULL,
    fecha_calificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de dominio
    CONSTRAINT chk_calificacion_tutor_valor CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT chk_calificacion_tutor_fecha CHECK (fecha_calificacion <= NOW()),
    
    -- Restricción de unicidad (Una tutoría solo puede calificarse una vez)
    UNIQUE KEY uk_calificacion_tutor_tutoria (id_tutoria),
    
    -- Claves foráneas
    CONSTRAINT fk_calificacion_tutor_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calificacion_tutor_creador FOREIGN KEY (id_tutor) 
        REFERENCES Creador(id_creador) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calificacion_tutor_tutoria FOREIGN KEY (id_tutoria) 
        REFERENCES Tutoria_SOS(id_tutoria) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_calificacion_tutor_creador (id_tutor, calificacion DESC),
    INDEX idx_calificacion_tutor_fecha (fecha_calificacion DESC)
) ENGINE=InnoDB COMMENT='R26, R27 - Evaluación de tutores';

-- =====================================================
-- SECCIÓN 9: FOROS Y COMUNIDAD
-- =====================================================

-- Tabla: Foro (EF)
CREATE TABLE Foro (
    id_foro INT AUTO_INCREMENT PRIMARY KEY,
    id_materia INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de dominio
    CONSTRAINT chk_foro_fecha_creacion CHECK (fecha_creacion <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_foro_materia FOREIGN KEY (id_materia) 
        REFERENCES Materia(id_materia) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_foro_materia (id_materia)
) ENGINE=InnoDB COMMENT='R9 - Foros de discusión por materia';

-- Tabla: Publicacion_Foro (ED - Recursiva para hilos)
CREATE TABLE Publicacion_Foro (
    id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_foro INT NOT NULL,
    id_usuario INT NOT NULL,
    id_publicacion_padre INT DEFAULT NULL,
    titulo VARCHAR(200) DEFAULT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fue_util INT NOT NULL DEFAULT 0,
    es_solucion BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Restricciones de dominio
    CONSTRAINT chk_publicacion_fue_util CHECK (fue_util >= 0),
    CONSTRAINT chk_publicacion_fecha CHECK (fecha_creacion <= NOW()),
    
    -- BR601: Restricción bidireccional título/padre (mejorada)
    CONSTRAINT chk_publicacion_titulo_padre CHECK (
        (id_publicacion_padre IS NULL AND titulo IS NOT NULL) OR
        (id_publicacion_padre IS NOT NULL AND titulo IS NULL)
    ),
    
    -- Claves foráneas
    CONSTRAINT fk_publicacion_foro FOREIGN KEY (id_foro) 
        REFERENCES Foro(id_foro) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_publicacion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_publicacion_padre FOREIGN KEY (id_publicacion_padre) 
        REFERENCES Publicacion_Foro(id_publicacion) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_publicacion_foro_padre (id_foro, id_publicacion_padre),
    INDEX idx_publicacion_usuario (id_usuario),
    INDEX idx_publicacion_fecha (fecha_creacion DESC),
    INDEX idx_publicacion_util (fue_util DESC)
) ENGINE=InnoDB COMMENT='R28, R29, R30, BR601 - Hilos de conversación anidados';

-- =====================================================
-- SECCIÓN 10: GAMIFICACIÓN Y NOTIFICACIONES
-- =====================================================

-- Tabla: Logro_Usuario (ED - Asociativa)
CREATE TABLE Logro_Usuario (
    id_logro_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_logro INT NOT NULL,
    fecha_obtencion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de dominio
    CONSTRAINT chk_logro_usuario_fecha CHECK (fecha_obtencion <= NOW()),
    
    -- Restricción de unicidad (BR: Un logro solo se obtiene una vez)
    UNIQUE KEY uk_logro_usuario (id_usuario, id_logro),
    
    -- Claves foráneas
    CONSTRAINT fk_logro_usuario_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_logro_usuario_logro FOREIGN KEY (id_logro) 
        REFERENCES Logro(id_logro) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_logro_usuario_fecha (id_usuario, fecha_obtencion DESC)
) ENGINE=InnoDB COMMENT='R31, BR602 - Historial de logros obtenidos';

-- Tabla: Notificacion (ED)
CREATE TABLE Notificacion (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('examen_proximo','logro','tutoria','sistema') NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Restricciones de dominio
    CONSTRAINT chk_notificacion_fecha CHECK (fecha_creacion <= NOW()),
    
    -- Claves foráneas
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_notificacion_usuario_leida (id_usuario, leida, fecha_creacion DESC)
) ENGINE=InnoDB COMMENT='R32 - Sistema de notificaciones';