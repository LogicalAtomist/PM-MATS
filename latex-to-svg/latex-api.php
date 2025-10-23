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

    // Set headers
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json');
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');

    debug_log("Headers set");

    // Handle OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        send_json_response(true, ['message' => 'OK']);
    }

    // Verify POST method
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

    // Create temp directory
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


    $latexContent =
    "\\documentclass[preview]{standalone}\n" .
    "\\usepackage{principia}\n" .
    "\\begin{document}\n" .
    "\\Large\n" .
    "$" . $input['latex'] . "$\n" .
    "\\end{document}\n";


    $texFile = $workDir . '/input.tex';
    debug_log("Writing TeX content to: " . $texFile);
    
    if (file_put_contents($texFile, $latexContent) === false) {
        throw new Exception('Failed to write TeX file');
    }

    // Run pdflatex
    $cmd = "cd " . escapeshellarg($workDir) . " && /usr/bin/pdflatex -interaction=nonstopmode input.tex 2>&1";
    debug_log("Running: " . $cmd);
    
    exec($cmd, $output, $returnVar);
    debug_log("pdflatex output: " . implode("\n", $output));
    debug_log("pdflatex return: " . $returnVar);

    $pdfFile = $workDir . '/input.pdf';
    if (!file_exists($pdfFile)) {
        throw new Exception('PDF generation failed');
    }

    // Convert PDF to SVG
    $cmd = "pdf2svg " . escapeshellarg($pdfFile) . " " . escapeshellarg($workDir . '/output.svg') . " 2>&1";
    debug_log("Running: " . $cmd);
    
    exec($cmd, $output, $returnVar);
    debug_log("pdf2svg output: " . implode("\n", $output));
    debug_log("pdf2svg return: " . $returnVar);

    $svgFile = $workDir . '/output.svg';
    if (!file_exists($svgFile)) {
        throw new Exception('SVG conversion failed');
    }

    // Read SVG
    $svg = file_get_contents($svgFile);
    if ($svg === false) {
        throw new Exception('Failed to read SVG file');
    }

    // Clean up
    array_map('unlink', glob($workDir . '/*'));
    rmdir($workDir);

    // Send response
    debug_log("Sending success response");
    send_json_response(true, ['svg' => $svg]);

} catch (Throwable $e) {
    debug_log("Error caught: " . $e->getMessage());
    debug_log("Stack trace: " . $e->getTraceAsString());
    
    // Clean up
    if (isset($workDir) && file_exists($workDir)) {
        array_map('unlink', glob($workDir . '/*'));
        rmdir($workDir);
    }

    http_response_code(500);
    send_json_response(false, ['error' => $e->getMessage()]);
}

// Catch any unexpected output
$unexpectedOutput = ob_get_clean();
if (!empty($unexpectedOutput)) {
    debug_log("Unexpected output: " . $unexpectedOutput);
}
