import React, { useState, useEffect } from 'react';
import { Save, User, Calendar, MapPin, Activity, Phone, FileText, Clock, Download } from 'lucide-react';

// ==========================================
// CONFIGURACIÓN DE SUPABASE (Comentada)
// ==========================================
// Para conectarlo a tu base de datos, descomenta esto e instala supabase-js:
// npm install @supabase/supabase-js
// 
// import { createClient } from '@supabase/supabase-js';
// const supabaseUrl = 'TU_URL_DE_SUPABASE';
// const supabaseKey = 'TU_KEY_ANONIMA_DE_SUPABASE';
// const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// DATOS EXTRAÍDOS DE LAS IMÁGENES
// ==========================================
const DISTRITOS_SUGERIDOS = [
  "El Agustino", "Santa Anita", "SJL", "Ate", "Provincia", 
  "Lima Cercado", "Pachacamac", "La Molina", "La Victoria", 
  "Cieneguilla", "Carabayllo"
];

const DIAGNOSTICOS_SUGERIDOS = [
  "Sepsis", "Ictericia", "EDA", "SALAM", "Síndrome Emético", "Hipoglicemia", 
  "Bronquiolitis", "SDR", "Síndrome Febril", "Síndrome Coqueluchoide", "Cólico de Gases", 
  "Cardiopatía", "Recién Nacido Sano", "Fractura de Clavícula", "Parto Domiciliario", 
  "Conjuntivitis", "Rinofaringitis", "Crisis Asmática", "Amigdalitis", "SOB", 
  "Neumonía", "Crup", "Bronquitis Aguda", "Faringitis Aguda", "Herpangina", "OMA", 
  "Derrame Pleural", "TBC", "Enf Membrana Hialina", "Insuficiencia Respiratoria Aguda", 
  "EDA sin deshidratación", "EDA con deshidratación", "EDA Disentérica", "Ascariasis", 
  "Deshidratación severa", "Estreñimiento", "Síndrome Doloroso Abdominal", "Pancreatitis aguda", 
  "Apendicitis", "Hepatitis viral", "Intolerancia Oral", "Otitis Media Aguda", "Otalgia", 
  "Gingivoestomatitis", "Chalazión", "Catarata congénita", "ITU", "Pielonefritis", 
  "Hematuria", "Urticaria", "Picadura de Insecto", "Absceso", "Candidiasis", "Adenitis", 
  "Celulitis", "Angioedema", "Dermatitis", "Acarosis", "Impétigo", "Exantema", 
  "Carbamatos", "Álcalis", "Benzodiacepinas", "Desconocido", "Alcohol", "Pesticidas", 
  "Edema", "Disuria", "Tuberculosis pulmonar", "Adenopatía", "Dengue sin signos de alarma", 
  "Cardiopatía congénita", "Cuerpo extraño", "Fiebre persistente", "Intoxicación", 
  "Dolor torácico", "Frenillo", "PIV", "Asfixia"
].sort();

// ==========================================
// COMPONENTE DE AUTOCOMPLETADO
// Permite sugerencias pero acepta texto libre
// ==========================================
const AutocompleteInput = ({ value, onChange, options, name, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (!value) {
      setFilteredOptions(options);
    } else {
      const lowerValue = value.toLowerCase();
      setFilteredOptions(
        options.filter((opt) => opt.toLowerCase().includes(lowerValue))
      );
    }
  }, [value, options]);

  return (
    <div className="relative w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          type="text"
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(name, e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border ${Icon ? 'pl-10' : 'pl-3'} pr-3 bg-white text-slate-900 transition-colors`}
          autoComplete="off"
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onMouseDown={() => {
                onChange(name, option);
                setIsOpen(false);
              }}
              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL DEL FORMULARIO
// ==========================================
export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estado inicial del formulario basado en las columnas de la imagen
  const initialFormState = {
    nombre: '',
    edad: '',
    hcl: '',
    dni: '',
    fechaIngreso: '',
    alta: '',
    telemonitoreo: '',
    hb: '',
    distrito: '',
    direccion: '',
    telefono: '',
    telefono2: '',
    dniMama: '',
    dx1: '',
    dx2: '',
    dx3: '',
    pendientes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setMessage({ type: '', text: '' });

    try {
      // ==========================================
      // LÓGICA DE EXPORTACIÓN CON SUPABASE
      // ==========================================
      // Descomenta esto cuando configures Supabase para descargar todos los registros:
      // 
      // const { data, error } = await supabase
      //   .from('egresos_junio') // Tu tabla
      //   .select('*');
      // 
      // if (error) throw error;
      // 
      // let datosAExportar = data;

      // SIMULACIÓN: Si no hay Supabase aún, exportamos los datos actuales del formulario a modo de prueba
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulando carga
      let datosAExportar = [formData];

      if (!datosAExportar || datosAExportar.length === 0) {
        setMessage({ type: 'error', text: 'No hay datos para exportar.' });
        setIsExporting(false);
        return;
      }

      // Convertir a formato CSV
      // Obtenemos las cabeceras (nombres de las columnas)
      const cabeceras = Object.keys(datosAExportar[0]);
      
      const filasCSV = [
        cabeceras.join(','), // Fila de cabeceras
        ...datosAExportar.map(fila => 
          cabeceras.map(cabecera => {
            let valor = fila[cabecera] === null || fila[cabecera] === undefined ? '' : String(fila[cabecera]);
            // Escapar comillas dobles y comas para que Excel lo lea bien
            valor = valor.replace(/"/g, '""');
            return `"${valor}"`;
          }).join(',')
        )
      ];

      const contenidoCSV = filasCSV.join('\n');
      
      // Añadir BOM (\uFEFF) para que Excel reconozca correctamente los acentos y caracteres especiales (UTF-8)
      const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga y simular clic
      const enlace = document.createElement('a');
      const url = URL.createObjectURL(blob);
      enlace.setAttribute('href', url);
      enlace.setAttribute('download', 'Registro_Egresos_Junio.csv');
      enlace.style.visibility = 'hidden';
      
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      setMessage({ type: 'success', text: 'Archivo CSV descargado correctamente.' });

    } catch (error) {
      console.error('Error al exportar:', error);
      setMessage({ type: 'error', text: 'Hubo un error al exportar los datos.' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // AQUÍ VA LA LÓGICA DE SUPABASE:
      // const { data, error } = await supabase
      //   .from('egresos_junio') // Reemplaza con el nombre de tu tabla
      //   .insert([formData]);
      // 
      // if (error) throw error;

      // Simulación de carga para demostración
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos a guardar en Supabase:', formData);
      setMessage({ type: 'success', text: 'Registro guardado exitosamente en la base de datos.' });
      setFormData(initialFormState); // Limpiar formulario

    } catch (error) {
      console.error('Error al guardar:', error);
      setMessage({ type: 'error', text: 'Hubo un error al guardar los datos. Revisa la consola.' });
    } finally {
      setIsSubmitting(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabecera */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Registro de Egresos - Junio 2026
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Complete los datos del paciente. Los campos de Distrito y DX aceptan sugerencias o texto libre.
          </p>
        </div>

        {/* Notificaciones */}
        {message.text && (
          <div className={`p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border-l-4 shadow-sm`}>
            {message.text}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-xl shadow-sm p-6 space-y-8">
          
          {/* SECCIÓN 1: Datos del Paciente */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> Datos del Paciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ej. AGUILAR SALAZAR ALESIA" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Edad</label>
                <input type="text" name="edad" value={formData.edad} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ej. 2A, 6M" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">HCL</label>
                <input type="text" name="hcl" value={formData.hcl} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Historia Clínica" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">DNI Paciente</label>
                <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="DNI" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">DNI Mamá</label>
                <input type="text" name="dniMama" value={formData.dniMama} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="DNI de la madre" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Fechas y Tiempos */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" /> Fechas y Control
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">FI (Fecha Ingreso)</label>
                <input type="text" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ej. 27-may" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alta</label>
                <input type="text" name="alta" value={formData.alta} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-blue-50" placeholder="Ej. 1-jun" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telemonitoreo</label>
                <input type="text" name="telemonitoreo" value={formData.telemonitoreo} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ej. 8-jun" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3"/> HR
                </label>
                <input type="text" name="hr" value={formData.hr} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Ej. 10.8" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Localización y Contacto */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" /> Localización
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Distrito</label>
                {/* AUTOCOMPLETADO PARA DISTRITO */}
                <AutocompleteInput 
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleAutocompleteChange}
                  options={DISTRITOS_SUGERIDOS}
                  placeholder="Escriba o seleccione un distrito"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Dirección completa" />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3"/> Teléfono 1
                </label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Número principal" />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3"/> Teléfono 2
                </label>
                <input type="text" name="telefono2" value={formData.telefono2} onChange={handleInputChange} 
                  className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="Número opcional" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Diagnósticos */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" /> Diagnósticos (DX)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50/50 p-4 rounded-lg border border-orange-100">
              <div>
                <label className="block text-xs font-medium text-orange-800 mb-1">DX 1 (Principal)</label>
                <AutocompleteInput 
                  name="dx1"
                  value={formData.dx1}
                  onChange={handleAutocompleteChange}
                  options={DIAGNOSTICOS_SUGERIDOS}
                  placeholder="Diagnóstico 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-orange-800 mb-1">DX 2</label>
                <AutocompleteInput 
                  name="dx2"
                  value={formData.dx2}
                  onChange={handleAutocompleteChange}
                  options={DIAGNOSTICOS_SUGERIDOS}
                  placeholder="Diagnóstico 2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-orange-800 mb-1">DX 3</label>
                <AutocompleteInput 
                  name="dx3"
                  value={formData.dx3}
                  onChange={handleAutocompleteChange}
                  options={DIAGNOSTICOS_SUGERIDOS}
                  placeholder="Diagnóstico 3"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: Pendientes */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Pendientes / Notas</h2>
            <textarea 
              name="pendientes" 
              value={formData.pendientes} 
              onChange={handleInputChange} 
              rows="3"
              className="w-full rounded-md border-slate-300 py-2 px-3 border focus:border-blue-500 focus:ring-blue-500 text-sm bg-yellow-50/30" 
              placeholder="Ej. CONTROL POR CE, CONTINUAR CON B2..." 
            ></textarea>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting || isSubmitting}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all ${(isExporting || isSubmitting) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isExporting ? 'Exportando...' : (
                <>
                  <Download className="w-5 h-5" />
                  Exportar CSV
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isExporting}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${(isSubmitting || isExporting) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Guardando...' : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Registro
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}