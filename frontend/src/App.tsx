
import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import "./styles.css";
import "./sprint2.css";
import "./sprint3.css";

const API = "http://localhost:3000/api";

const categorias = [
  "Electrónica",
  "Documentos",
  "Accesorios",
  "Ropa",
  "Libros",
  "Llaves",
  "Otros"
];

type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: string;
};

type Objeto = {
  id_objeto: number;
  titulo: string;
  categoria: string;
  tipo: string;
  estado: string;
  descripcion?: string;
  marca?: string;
  color?: string;
  tipo_conexion?: string;
  caracteristicas_privadas?: string;
  lugar?: string;
  fecha_evento?: string;
};

type Solicitud = {
  id_solicitud: number;
  id_objeto: number;
  objeto_titulo: string;
  categoria: string;
  marca_declarada: string | null;
  color_declarado: string | null;
  tipo_conexion_declarado: string | null;
  lugar_perdida: string | null;
  fecha_perdida: string | null;
  descripcion_propiedad: string;
  estado: string;
  estudiante_nombre?: string;
  estudiante_correo?: string;
};

type Pantalla =
  | "login"
  | "registro"
  | "inicio"
  | "buscar"
  | "publicar"
  | "gestionar"
  | "describir"
  | "mis-descripciones"
  | "revisar"
  | "perfil";

const formularioObjetoInicial = () => ({
  tipo: "encontrado",
  titulo: "",
  categoria: "Electrónica",
  descripcion: "",
  marca: "",
  color: "",
  tipo_conexion: "",
  caracteristicas_privadas: "",
  lugar: "",
  fecha_evento: ""
});

const descripcionInicial = () => ({
  marca_declarada: "",
  color_declarado: "",
  tipo_conexion_declarado: "",
  lugar_perdida: "",
  fecha_perdida: "",
  descripcion_propiedad: ""
});

function App() {

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [pantalla, setPantalla] =
    useState<Pantalla>("login");

  const [objetos, setObjetos] =
    useState<Objeto[]>([]);

  const [solicitudes, setSolicitudes] =
    useState<Solicitud[]>([]);

  const [objetoElegido, setObjetoElegido] =
    useState<Objeto | null>(null);

  const [formObjeto, setFormObjeto] =
    useState(formularioObjetoInicial());

  const [formDescripcion, setFormDescripcion] =
    useState(descripcionInicial());

  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [nombrePerfil, setNombrePerfil] = useState("");
  const [correoPerfil, setCorreoPerfil] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const admin = usuario?.rol === "administrador";

  // ====================================
  // API
  // ====================================

  async function api(
    ruta: string,
    opciones: RequestInit = {}
  ) {

    const token = localStorage.getItem("refind_token");
    const headers = new Headers(opciones.headers);

    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", "Bearer " + token);
    }

    let respuesta: Response;

    try {
      respuesta = await fetch(API + ruta, {
        ...opciones,
        headers
      });
    } catch {
      throw new Error("No se pudo conectar con el servidor");
    }

    const datos = await respuesta.json();

    if (!respuesta.ok) {

      if (respuesta.status === 401 && token) {
        localStorage.removeItem("refind_token");
        setUsuario(null);
        setPantalla("login");
      }

      throw new Error(
        datos.mensaje || "No se pudo completar la operación"
      );
    }

    return datos;
  }

  function limpiar() {
    setMensaje("");
    setError("");
  }

  function navegar(p: Pantalla) {
    limpiar();
    setPantalla(p);
    window.scrollTo(0, 0);
  }

  // ====================================
  // RECUPERAR SESIÓN
  // ====================================

  useEffect(() => {

    async function recuperar() {

      if (!localStorage.getItem("refind_token")) {
        return;
      }

      try {
        const datos = await api("/users/me");

        setUsuario(datos.usuario);
        setNombrePerfil(datos.usuario.nombre);
        setCorreoPerfil(datos.usuario.correo);
        setPantalla("inicio");

      } catch {
        localStorage.removeItem("refind_token");
      }
    }

    recuperar();

  }, []);

  // ====================================
  // REGISTRO
  // ====================================

  async function registrar(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();
    limpiar();

    const datos = new FormData(e.currentTarget);

    const password = String(datos.get("password") || "");
    const confirmar = String(datos.get("confirmar") || "");

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: String(datos.get("nombre") || ""),
          correo: String(datos.get("correo") || ""),
          password
        })
      });

      setPantalla("login");
      setMensaje("Cuenta creada correctamente. Inicia sesión.");

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // ====================================
  // LOGIN
  // ====================================

  async function login(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();
    limpiar();
    setCargando(true);

    const datos = new FormData(e.currentTarget);

    try {
      const respuesta = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          correo: String(datos.get("correo") || ""),
          password: String(datos.get("password") || "")
        })
      });

      localStorage.setItem(
        "refind_token",
        respuesta.token
      );

      setUsuario(respuesta.usuario);
      setNombrePerfil(respuesta.usuario.nombre);
      setCorreoPerfil(respuesta.usuario.correo);
      setPantalla("inicio");

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // ====================================
  // CERRAR SESIÓN
  // ====================================

  async function salir() {

    try {
      await api("/auth/logout", {
        method: "POST"
      });
    } catch {
      // Cerramos la sesión local igualmente.
    }

    localStorage.removeItem("refind_token");

    setUsuario(null);
    setObjetos([]);
    setSolicitudes([]);
    navegar("login");
  }

  // ====================================
  // EDITAR PERFIL
  // ====================================

  async function guardarPerfil(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();
    limpiar();
    setCargando(true);

    try {
      const datos = await api("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          nombre: nombrePerfil,
          correo: correoPerfil
        })
      });

      setUsuario(datos.usuario);
      setMensaje("Perfil actualizado correctamente");

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // ====================================
  // CONSULTAR OBJETOS
  // ====================================

  async function cargarObjetos(conFiltros = false) {

    setCargando(true);
    limpiar();

    try {

      const parametros = new URLSearchParams();

      if (conFiltros) {
        if (busqueda) parametros.set("busqueda", busqueda);
        if (tipoFiltro) parametros.set("tipo", tipoFiltro);
        if (categoriaFiltro) {
          parametros.set("categoria", categoriaFiltro);
        }
      }

      const datos = await api(
        "/objetos?" + parametros.toString()
      );

      setObjetos(datos.objetos);

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function abrirObjetos(p: Pantalla) {
    navegar(p);
    await cargarObjetos();
  }

  async function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await cargarObjetos(true);
  }

  // ====================================
  // PUBLICAR - SOLO ADMIN
  // ====================================

  async function publicar(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();
    limpiar();
    setCargando(true);

    try {
      await api("/objetos", {
        method: "POST",
        body: JSON.stringify(formObjeto)
      });

      setFormObjeto(formularioObjetoInicial());
      setPantalla("gestionar");
      await cargarObjetos();
      setMensaje("Objeto guardado correctamente");

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // ====================================
  // ELIMINAR - SOLO ADMIN
  // ====================================

  async function eliminarObjeto(objeto: Objeto) {

    if (!window.confirm(
      "¿Eliminar el objeto " + objeto.titulo + "?"
    )) return;

    limpiar();

    try {
      await api("/objetos/" + objeto.id_objeto, {
        method: "DELETE"
      });

      await cargarObjetos();
      setMensaje("Objeto eliminado correctamente");

    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ====================================
  // ABRIR FORMULARIO ESTUDIANTE
  // ====================================

  function abrirDescripcion(objeto: Objeto) {

    setObjetoElegido(objeto);
    setFormDescripcion(descripcionInicial());
    navegar("describir");
  }

  // ====================================
  // GUARDAR DESCRIPCIÓN
  // ====================================

  async function guardarDescripcion(
    e: FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    if (!objetoElegido) return;

    limpiar();
    setCargando(true);

    try {

      await api("/solicitudes", {
        method: "POST",
        body: JSON.stringify({
          id_objeto: objetoElegido.id_objeto,
          ...formDescripcion
        })
      });

      setPantalla("mis-descripciones");
      await cargarSolicitudes(false);

      setMensaje(
        "Descripción registrada. La comparación automática estará disponible en un próximo Sprint."
      );

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  // ====================================
  // CONSULTAR DESCRIPCIONES
  // ====================================

  async function cargarSolicitudes(esAdmin: boolean) {

    setCargando(true);
    limpiar();

    try {

      const ruta = esAdmin
        ? "/solicitudes"
        : "/solicitudes/mis-solicitudes";

      const datos = await api(ruta);
      setSolicitudes(datos.solicitudes);

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  async function abrirDescripciones(esAdmin: boolean) {
    navegar(esAdmin ? "revisar" : "mis-descripciones");
    await cargarSolicitudes(esAdmin);
  }

  // ====================================
  // ALERTAS
  // ====================================

  const alertas = (
    <>
      {error && (
        <div className="mensaje error" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="mensaje exito" role="status">
          {mensaje}
        </div>
      )}
    </>
  );

  // ====================================
  // LOGIN
  // ====================================

  if (pantalla === "login") {
    return (
      <div className="auth-layout">

        <section className="hero">
          <div className="logo">
            <div className="logo-box">R</div>
            <span>ReFind</span>
          </div>

          <div className="hero-content">
            <p className="etiqueta amarillo">
              SISTEMA UNIVERSITARIO
            </p>
            <h1>Cada objeto<br />tiene dueño.</h1>
            <p className="hero-text">
              Encuentra objetos mediante descripciones
              privadas y un proceso seguro de verificación.
            </p>
          </div>

          <div className="hero-footer">
            <div>
              <strong>Privacidad</strong>
              <span>de los objetos</span>
            </div>
            <div>
              <strong>Registro</strong>
              <span>centralizado</span>
            </div>
            <div>
              <strong>Verificación</strong>
              <span>en desarrollo</span>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="form-box">
            <p className="etiqueta">BIENVENIDO</p>
            <h2>Iniciar sesión</h2>

            {alertas}

            <form onSubmit={login}>
              <label>CORREO ELECTRÓNICO</label>
              <input
                name="correo"
                type="email"
                placeholder="usuario@universidad.edu"
                required
              />

              <label>CONTRASEÑA</label>
              <input
                name="password"
                type="password"
                required
              />

              <button
                className="btn-primary"
                disabled={cargando}
              >
                Ingresar
              </button>
            </form>

            <div className="divider">o</div>

            <button
              className="btn-secondary"
              onClick={() => navegar("registro")}
            >
              Crear cuenta
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ====================================
  // REGISTRO
  // ====================================

  if (pantalla === "registro") {
    return (
      <div className="page-center">
        <div className="card registro-card">

          <button
            className="back"
            onClick={() => navegar("login")}
          >
            ← Volver
          </button>

          <p className="etiqueta">REFIND</p>
          <h2>Crear cuenta estudiante</h2>

          {alertas}

          <form onSubmit={registrar}>
            <label>NOMBRE COMPLETO</label>
            <input name="nombre" maxLength={100} required />

            <label>CORREO ELECTRÓNICO</label>
            <input name="correo" type="email" required />

            <label>CONTRASEÑA</label>
            <input
              name="password"
              type="password"
              minLength={6}
              required
            />

            <label>CONFIRMAR CONTRASEÑA</label>
            <input
              name="confirmar"
              type="password"
              required
            />

            <button
              className="btn-primary"
              disabled={cargando}
            >
              Registrarme
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  // ====================================
  // APLICACIÓN
  // ====================================

  return (
    <div className="app-layout">

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">R</div>
          <div>
            <strong>ReFind</strong>
            <span>
              {admin ? "ADMINISTRADOR" : "ESTUDIANTE"}
            </span>
          </div>
        </div>

        <nav>
          <button
            className={pantalla === "inicio" ? "active" : ""}
            onClick={() => navegar("inicio")}
          >
            Dashboard
          </button>

          <button
            className={pantalla === "buscar" ? "active" : ""}
            onClick={() => abrirObjetos("buscar")}
          >
            Buscar objetos
          </button>

          {admin ? (
            <>
              <button
                className={pantalla === "publicar" ? "active" : ""}
                onClick={() => {
                  setFormObjeto(formularioObjetoInicial());
                  navegar("publicar");
                }}
              >
                Registrar objeto
              </button>

              <button
                className={pantalla === "gestionar" ? "active" : ""}
                onClick={() => abrirObjetos("gestionar")}
              >
                Gestionar objetos
              </button>

              <button
                className={pantalla === "revisar" ? "active" : ""}
                onClick={() => abrirDescripciones(true)}
              >
                Descripciones recibidas
              </button>
            </>
          ) : (
            <button
              className={
                pantalla === "mis-descripciones" ? "active" : ""
              }
              onClick={() => abrirDescripciones(false)}
            >
              Mis descripciones
            </button>
          )}

          <button
            className={pantalla === "perfil" ? "active" : ""}
            onClick={() => navegar("perfil")}
          >
            Mi perfil
          </button>
        </nav>

        <button className="logout" onClick={salir}>
          Cerrar sesión →
        </button>
      </aside>

      <main className="content">

        {/* DASHBOARD */}

        {pantalla === "inicio" && (
          <>
            <div className="topbar">
              <div>
                <p className="etiqueta">REFIND / SPRINT 3</p>
                <h1>Dashboard</h1>
              </div>

              <div className="usuario-top">
                <div>
                  <strong>{usuario.nombre}</strong>
                  <span>{usuario.rol}</span>
                </div>
                <div className="avatar-small">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <section className="welcome-card">
              <p className="etiqueta amarillo">
                {admin ? "MODO ADMINISTRADOR" : "MODO ESTUDIANTE"}
              </p>

              <h2>¡Hola, {usuario.nombre}!</h2>

              <p>
                {admin
                  ? "Registra objetos y conserva sus características privadas."
                  : "Consulta objetos generales y describe lo que perdiste."}
              </p>
            </section>

            <div className="s3-dashboard-actions">
              {admin ? (
                <>
                  <button onClick={() => navegar("publicar")}>
                    <span>📦</span>
                    <strong>Registrar objeto</strong>
                    <small>Información privada</small>
                  </button>

                  <button onClick={() => abrirObjetos("gestionar")}>
                    <span>📋</span>
                    <strong>Gestionar objetos</strong>
                    <small>Consultar registros</small>
                  </button>

                  <button onClick={() => abrirDescripciones(true)}>
                    <span>📝</span>
                    <strong>Descripciones recibidas</strong>
                    <small>Consultar información de estudiantes</small>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => abrirObjetos("buscar")}>
                    <span>🔎</span>
                    <strong>Buscar objetos</strong>
                    <small>Sin revelar características privadas</small>
                  </button>

                  <button onClick={() => abrirDescripciones(false)}>
                    <span>📝</span>
                    <strong>Mis descripciones</strong>
                    <small>Información que enviaste</small>
                  </button>

                  <button onClick={() => navegar("perfil")}>
                    <span>👤</span>
                    <strong>Mi perfil</strong>
                    <small>Actualizar mis datos</small>
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* BUSCADOR */}

        {pantalla === "buscar" && (
          <>
            <Encabezado
              titulo="Buscar objetos"
              descripcion="Solo se muestra información general de cada objeto."
            />

            <div className="card s2-search-card">
              <form onSubmit={buscar}>

                <label>BUSCAR OBJETO</label>
                <input
                  value={busqueda}
                  maxLength={120}
                  placeholder="Ej. cargador, celular, mochila"
                  onChange={e => setBusqueda(e.target.value)}
                />

                <div className="s2-filter-grid">
                  <div>
                    <label>TIPO</label>
                    <select
                      value={tipoFiltro}
                      onChange={e => setTipoFiltro(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="perdido">Perdido</option>
                      <option value="encontrado">Encontrado</option>
                    </select>
                  </div>

                  <div>
                    <label>CATEGORÍA</label>
                    <select
                      value={categoriaFiltro}
                      onChange={e => setCategoriaFiltro(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {categorias.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  disabled={cargando}
                >
                  Buscar
                </button>
              </form>
            </div>

            {alertas}

            <div className="s2-object-grid">
              {objetos.map(objeto => (
                <div className="s2-object-card" key={objeto.id_objeto}>
                  <div className="s2-card-top">
                    <div className="s2-object-icon">📦</div>
                    <span className={`s2-tag ${objeto.tipo}`}>
                      {objeto.tipo.toUpperCase()}
                    </span>
                  </div>

                  <h3>{objeto.titulo}</h3>
                  <p>Categoría: {objeto.categoria}</p>
                  <p>Estado: {objeto.estado}</p>

                  {!admin &&
                    objeto.tipo === "encontrado" &&
                    objeto.estado === "activo" && (
                      <button
                        className="btn-primary"
                        onClick={() => abrirDescripcion(objeto)}
                      >
                        Describir mi objeto perdido
                      </button>
                    )}
                </div>
              ))}
            </div>

            {!cargando && objetos.length === 0 && (
              <Vacio texto="No se encontraron objetos." />
            )}
          </>
        )}

        {/* PUBLICACIÓN PRIVADA ADMIN */}

        {pantalla === "publicar" && admin && (
          <>
            <Encabezado
              titulo="Registrar objeto"
              descripcion="Los detalles de este formulario son privados."
            />

            {alertas}

            <div className="card s2-form-card">
              <form onSubmit={publicar}>

                <label>TIPO</label>
                <select
                  value={formObjeto.tipo}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    tipo: e.target.value
                  })}
                >
                  <option value="encontrado">Encontrado</option>
                  <option value="perdido">Perdido</option>
                </select>

                <label>NOMBRE GENÉRICO VISIBLE</label>
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Ej. Cargador"
                  value={formObjeto.titulo}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    titulo: e.target.value
                  })}
                />

                <label>CATEGORÍA</label>
                <select
                  value={formObjeto.categoria}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    categoria: e.target.value
                  })}
                >
                  {categorias.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

                <label>MARCA PRIVADA</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={formObjeto.marca}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    marca: e.target.value
                  })}
                />

                <label>COLOR PRIVADO</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={formObjeto.color}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    color: e.target.value
                  })}
                />

                <label>TIPO / CARACTERÍSTICA TÉCNICA</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ej. USB-C"
                  value={formObjeto.tipo_conexion}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    tipo_conexion: e.target.value
                  })}
                />

                <label>DESCRIPCIÓN PRIVADA</label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  value={formObjeto.descripcion}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    descripcion: e.target.value
                  })}
                />

                <label>SEÑALES PARTICULARES</label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Detalles que solo el propietario conocería"
                  value={formObjeto.caracteristicas_privadas}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    caracteristicas_privadas: e.target.value
                  })}
                />

                <label>LUGAR DEL HALLAZGO</label>
                <input
                  required
                  minLength={3}
                  maxLength={150}
                  value={formObjeto.lugar}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    lugar: e.target.value
                  })}
                />

                <label>FECHA</label>
                <input
                  type="date"
                  required
                  max={new Date().toLocaleDateString("en-CA")}
                  value={formObjeto.fecha_evento}
                  onChange={e => setFormObjeto({
                    ...formObjeto,
                    fecha_evento: e.target.value
                  })}
                />

                <button
                  className="btn-primary"
                  disabled={cargando}
                >
                  Guardar objeto
                </button>

              </form>
            </div>
          </>
        )}

        {/* GESTIONAR - ADMIN */}

        {pantalla === "gestionar" && admin && (
          <>
            <Encabezado
              titulo="Gestionar objetos"
              descripcion="Información completa visible únicamente para administradores."
            />

            {alertas}

            <button
              className="btn-secondary"
              onClick={() => cargarObjetos()}
            >
              Actualizar lista
            </button>

            <div className="s3-list" style={{ marginTop: 20 }}>
              {objetos.map(o => (
                <div className="s3-request" key={o.id_objeto}>
                  <h3>{o.titulo}</h3>

                  <p><strong>Categoría:</strong> {o.categoria}</p>
                  <p><strong>Tipo:</strong> {o.tipo}</p>
                  <p><strong>Marca:</strong> {o.marca || "Sin registrar"}</p>
                  <p><strong>Color:</strong> {o.color || "Sin registrar"}</p>
                  <p><strong>Conexión:</strong> {o.tipo_conexion || "Sin registrar"}</p>
                  <p><strong>Descripción:</strong> {o.descripcion}</p>
                  <p><strong>Señas particulares:</strong> {o.caracteristicas_privadas || "Sin registrar"}</p>
                  <p><strong>Lugar:</strong> {o.lugar}</p>
                  <p><strong>Fecha:</strong> {String(o.fecha_evento || "").slice(0, 10)}</p>
                  <p><strong>Estado:</strong> {o.estado}</p>

                  <button
                    className="s3-reject"
                    style={{ padding: 12, borderRadius: 7 }}
                    onClick={async () => {
                      if (!window.confirm("¿Eliminar publicación?")) return;
                      await eliminarObjeto(o);
                    }}
                  >
                    Eliminar publicación
                  </button>
                </div>
              ))}
            </div>

            {!cargando && objetos.length === 0 && (
              <Vacio texto="No hay objetos registrados." />
            )}
          </>
        )}

        {/* FORMULARIO DEL ESTUDIANTE */}

        {pantalla === "describir" && !admin && objetoElegido && (
          <>
            <Encabezado
              titulo="Describir mi objeto perdido"
              descripcion="Completa los datos según lo que recuerdes. No verás las características registradas por el administrador."
            />

            <div className="card s2-form-card">
              <h2>{objetoElegido.titulo}</h2>
              <p className="subtitulo">
                Categoría: {objetoElegido.categoria}
              </p>

              {alertas}

              <form onSubmit={guardarDescripcion}>

                <label>MARCA DEL OBJETO QUE PERDISTE</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="¿De qué marca era?"
                  value={formDescripcion.marca_declarada}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    marca_declarada: e.target.value
                  })}
                />

                <label>COLOR</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={formDescripcion.color_declarado}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    color_declarado: e.target.value
                  })}
                />

                <label>TIPO O CARACTERÍSTICA TÉCNICA</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ej. USB-C"
                  value={formDescripcion.tipo_conexion_declarado}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    tipo_conexion_declarado: e.target.value
                  })}
                />

                <label>¿DÓNDE CREES QUE LO PERDISTE?</label>
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  placeholder="Lugar aproximado"
                  value={formDescripcion.lugar_perdida}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    lugar_perdida: e.target.value
                  })}
                />

                <label>FECHA APROXIMADA</label>
                <input
                  type="date"
                  required
                  max={new Date().toLocaleDateString("en-CA")}
                  value={formDescripcion.fecha_perdida}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    fecha_perdida: e.target.value
                  })}
                />

                <label>CARACTERÍSTICAS ADICIONALES</label>
                <textarea
                  rows={5}
                  required
                  minLength={15}
                  maxLength={2000}
                  placeholder="Describe señales, accesorios o detalles especiales que recuerdes"
                  value={formDescripcion.descripcion_propiedad}
                  onChange={e => setFormDescripcion({
                    ...formDescripcion,
                    descripcion_propiedad: e.target.value
                  })}
                />

                <p className="subtitulo">
                  Tu descripción será guardada de forma
                  privada. La comparación automática con
                  IA se implementará posteriormente.
                </p>

                <button
                  className="btn-primary"
                  disabled={cargando}
                >
                  Enviar descripción
                </button>
              </form>
            </div>
          </>
        )}

        {/* MIS DESCRIPCIONES */}

        {pantalla === "mis-descripciones" && !admin && (
          <>
            <Encabezado
              titulo="Mis descripciones"
              descripcion="Consulta la información que has enviado."
            />

            {alertas}

            <div className="s3-list">
              {solicitudes.map(s => (
                <div className="s3-request" key={s.id_solicitud}>
                  <h3>{s.objeto_titulo}</h3>
                  <p><strong>Categoría:</strong> {s.categoria}</p>
                  <p><strong>Marca declarada:</strong> {s.marca_declarada}</p>
                  <p><strong>Color:</strong> {s.color_declarado}</p>
                  <p><strong>Tipo:</strong> {s.tipo_conexion_declarado}</p>
                  <p><strong>Lugar:</strong> {s.lugar_perdida}</p>
                  <p><strong>Fecha:</strong> {String(s.fecha_perdida || "").slice(0, 10)}</p>
                  <p><strong>Descripción:</strong> {s.descripcion_propiedad}</p>

                  <span className="s3-status s3-pendiente">
                    {s.estado === "pendiente"
                      ? "PENDIENTE DE COMPARACIÓN"
                      : "HISTORIAL: " + s.estado.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {!cargando && solicitudes.length === 0 && (
              <Vacio texto="Todavía no enviaste descripciones." />
            )}
          </>
        )}

        {/* DESCRIPCIONES RECIBIDAS ADMIN */}

        {pantalla === "revisar" && admin && (
          <>
            <Encabezado
              titulo="Descripciones recibidas"
              descripcion="Consulta los datos enviados. La comparación IA y entrevistas llegarán después."
            />

            {alertas}

            <div className="s3-list">
              {solicitudes.map(s => (
                <div className="s3-request" key={s.id_solicitud}>
                  <h3>{s.objeto_titulo}</h3>

                  <p><strong>Estudiante:</strong> {s.estudiante_nombre}</p>
                  <p><strong>Correo:</strong> {s.estudiante_correo}</p>
                  <p><strong>Marca declarada:</strong> {s.marca_declarada}</p>
                  <p><strong>Color declarado:</strong> {s.color_declarado}</p>
                  <p><strong>Tipo:</strong> {s.tipo_conexion_declarado}</p>
                  <p><strong>Lugar de pérdida:</strong> {s.lugar_perdida}</p>
                  <p><strong>Fecha:</strong> {String(s.fecha_perdida || "").slice(0, 10)}</p>
                  <p><strong>Características:</strong> {s.descripcion_propiedad}</p>

                  <span className="s3-status s3-pendiente">
                    {s.estado === "pendiente"
                      ? "PENDIENTE DE COMPARACIÓN"
                      : "HISTORIAL: " + s.estado.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {!cargando && solicitudes.length === 0 && (
              <Vacio texto="No hay descripciones recibidas." />
            )}
          </>
        )}

        {/* PERFIL */}

        {pantalla === "perfil" && (
          <>
            <Encabezado
              titulo="Mi perfil"
              descripcion="Actualiza tu información personal."
            />

            <div className="profile-header">
              <div className="avatar">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1>{usuario.nombre}</h1>
                <p>{usuario.correo}</p>
                <span className="badge">{usuario.rol}</span>
              </div>
            </div>

            <div className="card perfil-card">
              {alertas}

              <form onSubmit={guardarPerfil}>
                <label>NOMBRE COMPLETO</label>
                <input
                  required
                  maxLength={100}
                  value={nombrePerfil}
                  onChange={e => setNombrePerfil(e.target.value)}
                />

                <label>CORREO</label>
                <input
                  required
                  type="email"
                  value={correoPerfil}
                  onChange={e => setCorreoPerfil(e.target.value)}
                />

                <button
                  className="btn-primary"
                  disabled={cargando}
                >
                  Guardar cambios
                </button>
              </form>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

// ====================================
// COMPONENTES AUXILIARES
// ====================================

function Encabezado({
  titulo,
  descripcion
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="s2-page-heading">
      <p className="etiqueta">REFIND / SPRINT 3</p>
      <h1>{titulo}</h1>
      <p>{descripcion}</p>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="s2-empty">
      <div>📦</div>
      <h3>{texto}</h3>
    </div>
  );
}

export default App;
