<?php
/**
 * send.php — signed relay that lets Apps Script send through your hosting's SMTP.
 *
 * Apps Script cannot open a raw SMTP socket, so it POSTs a signed JSON message
 * here and this file hands it to your host's SMTP server via PHPMailer. That is
 * what makes "From: faiz@sheikhfaiz.info" possible without Google Workspace.
 *
 * Install (cPanel / Hostinger / any PHP host):
 *   1. composer require phpmailer/phpmailer     (or upload the PHPMailer folder)
 *   2. Put THIS file in public_html/outreach/send.php
 *   3. Put config.php OUTSIDE public_html (see $CONFIG_PATH below)
 *   4. Confirm https://yourdomain/outreach/send.php returns 405 in a browser.
 *      If it returns your PHP source, stop — PHP is not executing, and your
 *      SMTP password would be public.
 *
 * Security model: the shared secret never travels in the request. Apps Script
 * signs the body with HMAC-SHA256 and this file recomputes the signature. An
 * intercepted request cannot be replayed after 5 minutes or modified at all.
 */

declare(strict_types=1);

$CONFIG_PATH = __DIR__ . '/../../outreach-config.php';   // must be outside the webroot

header('Content-Type: application/json');
header('X-Robots-Tag: noindex, nofollow');

function fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'POST only');
}

if (!is_readable($CONFIG_PATH)) {
    fail(500, 'Config not found. See config.sample.php.');
}
$config = require $CONFIG_PATH;

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > 200000) {
    fail(400, 'Empty or oversized body');
}

/* ------------------------------------------------------------ signature */

$provided = $_SERVER['HTTP_X_OUTREACH_SIGNATURE'] ?? '';
$expected = base64_encode(hash_hmac('sha256', $raw, $config['secret'], true));

// hash_equals, not ===, so response timing cannot leak the secret byte by byte.
if ($provided === '' || !hash_equals($expected, $provided)) {
    fail(401, 'Bad signature');
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    fail(400, 'Malformed JSON');
}

// Replay window: a captured request is useless after five minutes.
$ts = (int)($payload['ts'] ?? 0);
if (abs(time() - $ts) > 300) {
    fail(401, 'Stale request');
}

/* ----------------------------------------------------------- validation */

$to      = trim((string)($payload['to'] ?? ''));
$subject = trim((string)($payload['subject'] ?? ''));
$text    = (string)($payload['text'] ?? '');

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) fail(400, 'Invalid recipient');
if ($subject === '' || $text === '')         fail(400, 'Missing subject or body');

// Header injection guard: a newline in either field could add Bcc headers.
if (preg_match('/[\r\n]/', $subject) || preg_match('/[\r\n]/', $to)) {
    fail(400, 'Illegal characters in headers');
}

$fromEmail = filter_var((string)($payload['fromEmail'] ?? ''), FILTER_VALIDATE_EMAIL)
    ? (string)$payload['fromEmail'] : $config['from_email'];

// Only ever send as your own domain, whatever the caller asks for.
$allowedDomain = strtolower($config['allowed_from_domain']);
if (strtolower(substr(strrchr($fromEmail, '@') ?: '', 1)) !== $allowedDomain) {
    fail(403, 'From address outside allowed domain');
}

/* ----------------------------------------------------------- rate limit */

$counterFile = sys_get_temp_dir() . '/outreach_count_' . date('Ymd') . '.txt';
$count = (int)@file_get_contents($counterFile);
if ($count >= (int)$config['daily_max']) {
    fail(429, 'Daily bridge limit reached');
}

/* ------------------------------------------------------------- send it */

require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->Port       = (int)$config['smtp_port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_user'];
    $mail->Password   = $config['smtp_pass'];
    $mail->SMTPSecure = (int)$config['smtp_port'] === 465
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 20;

    $mail->setFrom($fromEmail, (string)($payload['fromName'] ?? ''));
    $mail->addAddress($to);

    $replyTo = (string)($payload['replyTo'] ?? '');
    if (filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($replyTo);
    }

    $mail->Subject = $subject;
    $mail->isHTML(false);       // plain text: better deliverability on cold mail
    $mail->Body    = $text;

    if (!empty($payload['messageId'])) {
        $mail->MessageID = (string)$payload['messageId'];
    }
    // Threading for follow-ups, so they land under the original email.
    $inReplyTo = (string)($payload['inReplyTo'] ?? '');
    if ($inReplyTo !== '' && !preg_match('/[\r\n]/', $inReplyTo)) {
        $mail->addCustomHeader('In-Reply-To', $inReplyTo);
        $mail->addCustomHeader('References', $inReplyTo);
    }

    $mail->send();

    @file_put_contents($counterFile, (string)($count + 1), LOCK_EX);

    echo json_encode(['ok' => true, 'messageId' => $mail->MessageID]);
} catch (MailException $e) {
    // ErrorInfo, not the exception: it carries the SMTP server's own reason.
    fail(502, 'SMTP: ' . $mail->ErrorInfo);
}
