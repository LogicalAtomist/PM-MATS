# Principia LaTeX-to-SVG Conversion Service

This guide describes how to set up a LaTeX-to-SVG conversion service using Apache, PHP-FPM, TeX Live, and `pdf2svg`. It is written with **Amazon Linux 2023** in mind, but similar steps can be adapted to other distributions. You can host both the back-end (the API) and the front-end (the HTML/JS interface) on the same server to avoid CORS or mixed-content issues.

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Install System Packages](#install-system-packages)
4. [Install and Configure Apache + PHP-FPM](#install-and-configure-apache--php-fpm)
5. [Install TeX Live and Build `pdf2svg`](#install-tex-live-and-build-pdf2svg)
6. [Set Up Principia Package (Optional)](#set-up-principia-package-optional)
7. [Set Up Working Directories](#set-up-working-directories)
8. [Install the API Script](#install-the-api-script)
9. [Install the Front-End](#install-the-front-end)
10. [Testing and Verification](#testing-and-verification)
11. [Troubleshooting](#troubleshooting)
12. [Security Notes](#security-notes)
13. [Maintenance](#maintenance)

---

## Overview

The goal is to:
- Accept LaTeX input via a POST request
- Compile to PDF using `pdflatex`
- Convert PDF to SVG using `pdf2svg`
- Return the SVG to the user, displayed in a browser or used by another service

We’ll use:
- **Apache** to serve both static HTML/JS and the PHP script
- **PHP-FPM** to run PHP code
- **TeX Live** for LaTeX
- **pdf2svg** to convert from PDF to SVG

---

## System Requirements

- **Amazon Linux 2023** (or a similar RPM-based distro)
- Ability to install EPEL or equivalent repositories
- Basic development tools (GCC, make, etc.)

---

## Install System Packages

1. **Update the system**:

    ```bash
    sudo dnf update -y
    ```

2. **Enable EPEL** (choose one of the following methods):

    **Method A (direct RPM):**
    ```bash
    sudo dnf install \
      https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm \
      https://dl.fedoraproject.org/pub/epel/epel-next-release-latest-9.noarch.rpm
    ```

    **Method B (Amazon Linux Extras):**
    ```bash
    sudo amazon-linux-extras enable epel
    sudo dnf install epel-release -y
    ```

3. **(Optional) Enable CRB (codeready-builder)** if needed:
    ```bash
    sudo dnf config-manager --set-enabled crb
    ```

---

## Install and Configure Apache + PHP-FPM

1. **Install Apache, PHP, and PHP-FPM**:

    ```bash
    sudo dnf install -y httpd php php-fpm
    ```

2. **Start and enable services**:

    ```bash
    sudo systemctl start httpd
    sudo systemctl enable httpd
    sudo systemctl start php-fpm
    sudo systemctl enable php-fpm
    ```

3. **Configure PHP-FPM** (if desired) at `/etc/php-fpm.d/www.conf`:

    ```bash
    sudo tee /etc/php-fpm.d/www.conf << 'EOF'
    [www]
    user = apache
    group = apache
    listen = /var/run/php-fpm/www.sock
    listen.owner = apache
    listen.group = apache
    listen.mode = 0660
    pm = dynamic
    pm.max_children = 50
    pm.start_servers = 5
    pm.min_spare_servers = 5
    pm.max_spare_servers = 35
    EOF
    ```

4. **Configure Apache** to use PHP-FPM at `/etc/httpd/conf.d/php.conf`:

    ```bash
    sudo tee /etc/httpd/conf.d/php.conf << 'EOF'
    <FilesMatch \.php$>
      SetHandler "proxy:unix:/var/run/php-fpm/www.sock|fcgi://localhost"
    </FilesMatch>
    EOF
    ```

5. **Restart Services**:

    ```bash
    sudo systemctl restart php-fpm
    sudo systemctl restart httpd
    ```

6. **Open HTTP (and optionally HTTPS) ports** in your AWS Security Group if needed.

---

## Install TeX Live and Build `pdf2svg`

1. **Install TeX Live** (basic + latex extras):

    ```bash
    sudo dnf install -y \
      texlive-scheme-basic \
      texlive-collection-latex \
      texlive-collection-latexextra
    ```

2. **Install development libraries** needed to compile `pdf2svg`:

    ```bash
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y cairo-devel poppler-devel poppler-glib-devel
    ```

3. **Download and compile `pdf2svg`** (version 0.2.3 as an example):

    ```bash
    cd /tmp
    wget https://github.com/dawbarton/pdf2svg/archive/refs/tags/v0.2.3.tar.gz
    tar xf v0.2.3.tar.gz
    cd pdf2svg-0.2.3

    ./configure
    make
    sudo make install
    ```

4. **Confirm `pdf2svg` is installed**:

    ```bash
    which pdf2svg
    pdf2svg --version
    ```

---

## Set Up Principia Package (Optional)

If you have a custom LaTeX package named `principia.sty`:

1. **Create the directory** for the LaTeX package:

    ```bash
    sudo mkdir -p /usr/share/texmf/tex/latex/principia
    ```

2. **Create `principia.sty`**:

    ```bash
    sudo tee /usr/share/texmf/tex/latex/principia/principia.sty << 'EOF'
    \NeedsTeXFormat{LaTeX2e}
    \ProvidesPackage{principia}[2025/01/16 Principia LaTeX macros]

    % Required packages
    \RequirePackage{newtxtext}
    \RequirePackage{pifont}
    \RequirePackage{amssymb}
    \RequirePackage{graphicx}
    \RequirePackage{amsmath}
    \RequirePackage[T1]{fontenc}
    \RequirePackage[utf8]{inputenc}
    \RequirePackage{mathrsfs}
    \RequirePackage{rotating}

    % Basic commands
    \newcommand{\pmd}{\Diamond}
    \newcommand{\pmdd}{\Box}
    \newcommand{\pmthm}{\vdash}
    \newcommand{\pmast}{*}
    \newcommand{\pmcdot}{\cdot}
    \newcommand{\pmdot}{\bullet}
    \newcommand{\pmdott}{\circ}
    \newcommand{\pmimp}{\rightarrow}
    \newcommand{\pmnot}{\neg}

    % Advanced commands with alignment
    \newcommand{\pmrlF}[2]{%
        #1 \mathbin{\ooalign{%
            $\upharpoonright$\cr
            \hidewidth\rotatebox[origin=c]{180}{$\upharpoonleft$}\hidewidth\cr
        }} #2%
    }
    EOF
    ```

3. **Update TeX’s filename database**:

    ```bash
    sudo texhash
    ```

This step is only needed if your LaTeX documents reference `\usepackage{principia}`.

---

## Set Up Working Directories

1. **Create a `temp` directory and a debug log**:

    ```bash
    sudo mkdir -p /var/www/html/temp
    sudo touch /var/www/html/debug.log
    ```

2. **Set permissions**:

    ```bash
    sudo chown -R apache:apache /var/www/html/temp
    sudo chown apache:apache /var/www/html/debug.log

    # For a quick demo; tighten later as needed:
    sudo chmod 777 /var/www/html/temp
    sudo chmod 666 /var/www/html/debug.log
    ```

---

## Install the API Script

1. **Create** `/var/www/html/latex-api.php`:

    ```bash
    sudo tee /var/www/html/latex-api.php << 'EOF'
    <?php

    ob_start();
    error_log("Script started");
    ini_set('display_errors', 1);
    error_reporting(E_ALL);

    function debug_log($message) {
        $log_file = '/var/www/html/debug.log';
        $log_message = date('Y-m-d H:i:s') . " {$message}\n";
        
        if (file_put_contents($log_file, $log_message, FILE_APPEND) === false) {
            error_log("Failed to write to debug log: " . $log_message);
        }
    }

    function send_json_response($success, $data) {
        $response = json_encode([
            'success' => $success,
            'data' => $data
        ]);
        
        if ($response === false) {
            debug_log("JSON encode failed: " . json_last_error_msg());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to encode response'
            ]);
            exit;
        }
        
        echo $response;
        exit;
    }

    try {
        debug_log("Script starting");

        // Set headers for CORS + JSON
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');

        // Handle OPTIONS request (CORS preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            send_json_response(true, ['message' => 'OK']);
        }

        // Ensure POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Method not allowed: ' . $_SERVER['REQUEST_METHOD']);
        }

        // Get input
        $rawInput = file_get_contents('php://input');
        debug_log("Raw input: " . $rawInput);

        // Parse JSON
        $input = json_decode($rawInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON decode error: ' . json_last_error_msg());
        }

        // Validate input
        if (!isset($input['latex']) || empty(trim($input['latex']))) {
            throw new Exception('No LaTeX input provided');
        }

        // Create temp directory for each request
        $workDir = '/var/www/html/temp/latex-' . uniqid();
        debug_log("Work directory: " . $workDir);

        if (!file_exists('/var/www/html/temp')) {
            if (!mkdir('/var/www/html/temp', 0777, true)) {
                throw new Exception('Failed to create temp directory');
            }
        }

        if (!mkdir($workDir, 0777, true)) {
            throw new Exception('Failed to create working directory');
        }

        // Write minimal LaTeX document
        $latexContent = "\\documentclass[preview]{standalone}\n" .
                        "\\usepackage{newtxtext}\n" .
                        "\\usepackage{pifont}\n" .
                        "\\usepackage{amssymb}\n" .
                        "\\usepackage{graphicx}\n" .
                        "\\usepackage{amsmath}\n" .
                        "\\usepackage[T1]{fontenc}\n" .
                        "\\usepackage[utf8]{inputenc}\n" .
                        "\\usepackage{mathrsfs}\n" .
                        "\\usepackage{rotating}\n" .
                        "\\begin{document}\n" .
                        "\\Large\n" .
                        "$" . $input['latex'] . "$\n" .
                        "\\end{document}\n";

        $texFile = $workDir . '/input.tex';
        debug_log("Writing TeX to: " . $texFile);

        if (file_put_contents($texFile, $latexContent) === false) {
            throw new Exception('Failed to write TeX file');
        }

        // Run pdflatex
        $cmd = "cd " . escapeshellarg($workDir) . " && /usr/bin/pdflatex -interaction=nonstopmode input.tex 2>&1";
        debug_log("Running: " . $cmd);
        exec($cmd, $output, $returnVar);
        debug_log("pdflatex output: " . implode("\n", $output));
        debug_log("pdflatex return code: " . $returnVar);

        $pdfFile = $workDir . '/input.pdf';
        if (!file_exists($pdfFile)) {
            throw new Exception('PDF generation failed');
        }

        // Convert PDF to SVG
        $cmd = "pdf2svg " . escapeshellarg($pdfFile) . " " . escapeshellarg($workDir . '/output.svg') . " 2>&1";
        debug_log("Running: " . $cmd);
        exec($cmd, $output, $returnVar);
        debug_log("pdf2svg output: " . implode("\n", $output));
        debug_log("pdf2svg return code: " . $returnVar);

        $svgFile = $workDir . '/output.svg';
        if (!file_exists($svgFile)) {
            throw new Exception('SVG conversion failed');
        }

        // Read the SVG
        $svg = file_get_contents($svgFile);
        if ($svg === false) {
            throw new Exception('Failed to read SVG file');
        }

        // Clean up
        array_map('unlink', glob($workDir . '/*'));
        rmdir($workDir);

        // Respond with JSON
        debug_log("Sending success response");
        send_json_response(true, ['svg' => $svg]);

    } catch (Throwable $e) {
        debug_log("Error: " . $e->getMessage());
        debug_log("Stack trace: " . $e->getTraceAsString());

        // Clean up if needed
        if (isset($workDir) && file_exists($workDir)) {
            array_map('unlink', glob($workDir . '/*'));
            rmdir($workDir);
        }

        http_response_code(500);
        send_json_response(false, ['error' => $e->getMessage()]);
    }

    // Catch unexpected output
    $unexpectedOutput = ob_get_clean();
    if (!empty($unexpectedOutput)) {
        debug_log("Unexpected output: " . $unexpectedOutput);
    }
    EOF
    ```

2. **Set ownership and permissions**:

    ```bash
    sudo chown apache:apache /var/www/html/latex-api.php
    sudo chmod 644 /var/www/html/latex-api.php
    ```

---

## Install the Front-End

If you want a simple HTML/JS page to test the API:

1. **Create** `/var/www/html/index.html` (or rename as needed):

    ```bash
    sudo tee /var/www/html/index.html << 'EOF'
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!-- If you don't want forced HTTPS upgrading, remove the next line -->
      <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
      <title>Principia LaTeX to SVG Converter</title>
      <style>
        /* ... (CSS from your working version) ... */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px; 
          line-height: 1;
          /* rest of your button styles */
        }
        .icon {
          width: 16px;
          height: 16px;
          vertical-align: middle;
          overflow: visible;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        /* ... rest of your CSS ... */
      </style>
    </head>
    <body>
      <h1>Principia LaTeX to SVG Converter</h1>
      <!-- Container, textarea, buttons, etc. -->
      <!-- Output area -->
      <div class="debug-panel" id="debug-output"></div>

      <script>
        const API_URL = 'http://YOUR_SERVER/latex-api.php'
        // or https://YOUR_SERVER/latex-api.php if you have SSL

        // JavaScript fetch logic, event listeners, debug logging, etc.
      </script>
    </body>
    </html>
    EOF
    ```

2. **Set ownership**:

    ```bash
    sudo chown apache:apache /var/www/html/index.html
    sudo chmod 644 /var/www/html/index.html
    ```

---

## Testing and Verification

1. **Check that required commands** work for the `apache` user:

    ```bash
    sudo -u apache which pdflatex
    sudo -u apache which pdf2svg
    sudo -u apache kpsewhich principia.sty  # if using Principia package
    ```

2. **Test PHP**:

    ```bash
    echo "<?php phpinfo(); ?>" | sudo tee /var/www/html/test.php
    ```
    Visit `http://YOUR_SERVER/test.php` in a browser. You should see PHP info.

3. **Try the front-end**:

    - Visit `http://YOUR_SERVER/` (or `index.html`).  
    - Enter `\pmthm p \pmimp \pmnot p` in the LaTeX field (or any LaTeX).  
    - Click **Render**.  
    - If successful, you get an SVG in the output panel.

4. **Logs**:

    ```bash
    sudo tail -f /var/log/httpd/error_log
    sudo tail -f /var/log/php-fpm/error.log
    sudo tail -f /var/www/html/debug.log
    ```

---

## Troubleshooting

- **405 Method Not Allowed**: Usually means the script only allows POST, but your request was GET or an OPTIONS preflight request is failing. Check that your JavaScript uses `method: 'POST'`, and that you have set your CORS headers properly.  
- **Mixed Content**: If your front-end is served over HTTPS but the API is HTTP, browsers block it. Serve both over HTTPS, or remove `upgrade-insecure-requests`.  
- **Connection Refused**: If the browser tries `https://` but the server is only on `http://`, the connection fails.  
- **pdflatex or pdf2svg Not Found**: Ensure your `$PATH` is correct for the `apache` user.  
- **SELinux**: If SELinux is enabled, it might block writes to `/var/www/html/temp`. Temporarily disable it to test:
  ```bash
  sudo setenforce 0
