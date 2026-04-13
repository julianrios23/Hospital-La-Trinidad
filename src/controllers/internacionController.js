const internacionModel = require('../models/internacionModel');

const internacionController = {
    // 1. cargo el mapa de camas dinamico
    getMapaCamas: async (req, res) => {
        try {
            const camasData = await internacionModel.getCamasMapaData();

            const alasMap = new Map();
            camasData.forEach(cama => {
                if (!alasMap.has(cama.nombre_ala)) {
                    alasMap.set(cama.nombre_ala, new Map());
                }

                const habitacionesAla = alasMap.get(cama.nombre_ala);
                if (!habitacionesAla.has(cama.habitacion_numero)) {
                    habitacionesAla.set(cama.habitacion_numero, []);
                }

                habitacionesAla.get(cama.habitacion_numero).push({
                    id_cama: cama.id_cama,
                    nombre_cama: cama.nombre_cama,
                    estado_cama: cama.estado_cama,
                    paciente_nombre: cama.paciente_nombre,
                    dni: cama.dni,
                    id_internacion: cama.id_internacion,
                    autorizado_alta_medica: cama.autorizado_alta_medica
                });
            });

            const alas = Array.from(alasMap.entries()).map(([nombreAla, habitacionesMap]) => ({
                nombre_ala: nombreAla,
                habitaciones: Array.from(habitacionesMap.entries()).map(([numeroHab, camas]) => ({
                    numero: numeroHab,
                    camas: camas
                }))
            }));

            let selectedPatient = null;
            if (req.session.idAdmisionPendiente) {
                selectedPatient = await internacionModel.getSelectedPatientByAdmisionId(req.session.idAdmisionPendiente);
            }

            res.render('internacion/mapa-camas', {
                alas,
                user: req.session.user,
                idAdmisionPendiente: req.session.idAdmisionPendiente,
                selectedPatient,
                tieneCamas: camasData.length > 0
            });
        } catch (error) {
            console.error('Error en getMapaCamas:', error);
            res.status(500).send('Error al cargar el mapa');
        }
    },

    // 2. obtengo pacientes en espera
    getPacientesEspera: async (req, res) => {
        try {
            const pacientesEspera = await internacionModel.getPacientesEspera();
            res.render('internacion/espera', { pacientesEspera, user: req.session.user });
        } catch (error) {
            console.error('Error en getPacientesEspera:', error);
            res.status(500).send('Error al obtener pacientes');
        }
    },

    // 3. Captura el paciente seleccionado y lo lleva al mapa
    iniciarAsignacion: (req, res) => {
        req.session.idAdmisionPendiente = parseInt(req.params.idAdmision, 10);
        req.session.save((err) => {
            if (err) {
                return res.status(500).send('Error al iniciar asignación');
            }
            res.redirect('/internacion/mapa-camas');
        });
    },

    // 4. proceso la internacion final en transaccion
    asignarCama: async (req, res) => {
        const { idAdmision, idCama } = req.body;
        try {
            await internacionModel.assignCamaTransaction({ idAdmision, idCama });
            delete req.session.idAdmisionPendiente;
            res.redirect('/internacion/pacientes-espera');
        } catch (error) {
            console.error('Error en asignarCama:', error);
            res.status(500).send('Error en la internacion');
        }
    },

    // 5. veo la evolucion del paciente
    getEvolucion: async (req, res) => {
        const { idInternacion } = req.params;
        try {
            const internacionRow = await internacionModel.getInternacionById(idInternacion);
            const evoluciones = await internacionModel.getEvolucionesByInternacion(idInternacion);

            res.render('internacion/evolucion', {
                internacion: internacionRow,
                evoluciones,
                user: req.session.user,
                successMessage: req.session.successMessage,
                errorMessage: req.session.errorMessage
            });
            delete req.session.successMessage;
            delete req.session.errorMessage;
        } catch (error) {
            console.error('Error en getEvolucion:', error);
            res.status(500).send('Error al cargar evolucion');
        }
    },

    // 7. guardo la evolucion clinica
    guardarEvolucion: async (req, res) => {
        const { idInternacion } = req.params;
        const { evolucion, tratamiento } = req.body;
        try {
            const idMedico = await internacionModel.getMedicoIdByUsuarioId(req.session.user.id);

            if (!idMedico) {
                return res.status(403).send('el usuario actual no tiene perfil de medico asociado');
            }

            await internacionModel.saveEvolucion({
                idInternacion,
                idMedico,
                evolucion,
                tratamiento
            });
            res.redirect(`/internacion/evolucion/${idInternacion}`);
        } catch (error) {
            console.error('Error al guardar evolucion:', error);
            res.status(500).send('Error al guardar la evolucion');
        }
    },

    // 7. autorizo el alta medica
    autorizarAlta: async (req, res) => {
        try {
            const idMedico = await internacionModel.getMedicoIdByUsuarioId(req.session.user.id);

            if (idMedico) {
                await internacionModel.authorizeAltaInternacion({
                    idInternacion: req.params.idInternacion,
                    idMedico
                });
            } else {
                console.warn(`Usuario ${req.session.user.id} sin id_medico. Alta autorizada sin asignar médico.`);
                await internacionModel.autorizarAltaMedica(req.params.idInternacion);
            }

            res.redirect('/internacion/mapa-camas');
        } catch (error) {
            console.error('Error al autorizar alta:', error);
            res.status(500).send('Error al autorizar');
        }
    },

    // 8. finalizo la internacion y libero la cama
    finalizarInternacion: async (req, res) => {
        const { idInternacion, idCama } = req.body;
        try {
            await internacionModel.finalizeInternacionTransaction({ idInternacion, idCama });
            res.redirect('/internacion/mapa-camas');
        } catch (error) {
            console.error('Error al finalizar internacion:', error);
            res.status(500).send('Error al finalizar');
        }
    }
};

module.exports = internacionController;