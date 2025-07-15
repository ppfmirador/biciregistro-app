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

### **Paso 2: Inicializar el Repositorio Git Local (o Limpiarlo si ya lo hiciste)**

Ahora, en la terminal de tu entorno de desarrollo, ejecuta los siguientes comandos uno por uno.

1.  **(IMPORTANTE) Limpia el historial de Git anterior:**
    Si ya ejecutaste `git init` y `git add .` antes, los archivos grandes ya están en el historial de Git. Este comando limpia ese historial para que podamos empezar de nuevo.
    ```bash
    rm -rf .git
    ```

2.  **Inicializa un nuevo repositorio Git limpio:**
    ```bash
    git init
    ```
    *Esto crea un repositorio Git local en la carpeta actual.*

3.  **Añade todos los archivos al área de "staging":**
    El nuevo archivo `.gitignore` evitará que los archivos grandes se añadan.
    ```bash
    git add .
    ```

4.  **Crea tu primer "commit":**
    ```bash
    git commit -m "Initial commit: Setup BiciRegistro project structure"
    ```

### **Paso 3: Conectar tu Repositorio Local con GitHub**

1.  **Define la rama principal como `main`:**
    ```bash
    git branch -M main
    ```

2.  **Conecta tu repositorio local al remoto que creaste en GitHub:**
    Copia el comando desde la página de tu repositorio en GitHub. Se verá similar a esto (¡usa tu propia URL!):
    ```bash
    git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
    ```
    *`origin` es el nombre por defecto para tu repositorio remoto.*

### **Paso 4: Subir tu Código a GitHub**

1.  **"Empuja" (push) tu código a GitHub:**
    Este comando sube tu rama `main` al repositorio remoto `origin`. La opción `-u` establece una relación de seguimiento para que en el futuro solo necesites escribir `git push`.
    ```bash
    git push -u origin main
    ```

---

¡Y listo! Con esto, el error de los archivos grandes desaparecerá y podrás subir tu proyecto. A partir de ahora, tu flujo de trabajo será:

-   Hacer cambios en el código.
-   Usar `git add .` para añadirlos.
-   Usar `git commit -m "Mensaje descriptivo"` para guardarlos.
-   Usar `git push` para subirlos a GitHub.
