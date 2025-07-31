# Guía Rápida para Subir el Proyecto a GitHub

Esta guía te llevará paso a paso para inicializar un repositorio Git local, conectarlo con un repositorio remoto en GitHub y subir tu código por primera vez.

**Requisitos Previos:**

- Tener una cuenta de [GitHub](https://github.com/).
- Tener [Git](https://git-scm.com/downloads) instalado en tu máquina.
- Haber configurado tus credenciales de Git localmente.

---

### **Paso 1: Crear un Repositorio en GitHub**

1.  Ve a [github.com](https://github.com/) y haz clic en el botón **"New"** para crear un nuevo repositorio.
2.  **Dale un nombre** a tu repositorio (ej. `biciregistro-app`).
3.  **No inicialices** el repositorio con un `README`, `.gitignore` o `LICENSE`. Como ya tenemos estos archivos en el proyecto, empezaremos con un repositorio vacío.
4.  Haz clic en **"Create repository"**.

GitHub te mostrará una página con varias instrucciones. Nos interesan los comandos de la sección **"…or push an existing repository from the command line"**.

### **Paso 2: Inicializar el Repositorio Git Local**

Ahora, en la terminal de tu entorno de desarrollo, ejecuta los siguientes comandos uno por uno.

1.  **Inicializa Git en tu proyecto:**

    ```bash
    git init
    ```

    _Esto crea un repositorio Git local en la carpeta actual._

2.  **Añade todos los archivos al área de "staging":**

    ```bash
    git add .
    ```

    _El `.` significa "todos los archivos y carpetas en el directorio actual"._

3.  **Crea tu primer "commit":**
    Un commit es como una instantánea guardada de tu código. Es una buena práctica que el primer commit sea descriptivo.
    ```bash
    git commit -m "Initial commit: Setup BiciRegistro project structure and core features"
    ```

### **Paso 3: Conectar tu Repositorio Local con GitHub**

1.  **Define la rama principal como `main`:**
    Este es el estándar moderno para nombrar la rama principal.

    ```bash
    git branch -M main
    ```

2.  **Conecta tu repositorio local al remoto que creaste en GitHub:**
    Copia el comando desde la página de tu repositorio en GitHub. Se verá similar a esto (¡usa tu propia URL!):
    ```bash
    git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
    ```
    _`origin` es el nombre por defecto para tu repositorio remoto._

### **Paso 4: Subir tu Código a GitHub**

1.  **"Empuja" (push) tu código a GitHub:**
    Este comando sube tu rama `main` al repositorio remoto `origin`. La opción `-u` establece una relación de seguimiento para que en el futuro solo necesites escribir `git push`.
    ```bash
    git push -u origin main
    ```

---

¡Y listo! Si refrescas la página de tu repositorio en GitHub, verás todos los archivos de tu proyecto. A partir de ahora, tu flujo de trabajo será:

- Hacer cambios en el código.
- Usar `git add .` para añadirlos.
- Usar `git commit -m "Mensaje descriptivo"` para guardarlos.
- Usar `git push` para subirlos a GitHub.

Espero que esta guía te sea de gran ayuda. ¡Sigamos construyendo!
