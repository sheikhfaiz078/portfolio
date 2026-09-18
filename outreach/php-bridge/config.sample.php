<?php
/**
 * Copy to outreach-config.php and place it OUTSIDE public_html, e.g.
 *   /home/youruser/outreach-config.php
 * so that a web request can never read it even if PHP stops executing.
 *
 * Then: chmod 600 outreach-config.php
 */

return [
    // Must match BRIDGE_SECRET in the Apps Script project properties.
    // Generate: php -r "echo bin2hex(random_bytes(32));"
    'secret' => 'PASTE_A_64_CHAR_RANDOM_STRING_HERE',

    // From your hosting panel: cPanel > Email Accounts > Connect Devices.
    'smtp_host' => 'mail.sheikhfaiz.info',
    'smtp_port' => 465,                       // 465 = SSL, 587 = STARTTLS
    'smtp_user' => 'faiz@sheikhfaiz.info',
    'smtp_pass' => 'THE_MAILBOX_PASSWORD',

    'from_email' => 'faiz@sheikhfaiz.info',

    // Refuse to send as anything outside this domain, whatever is requested.
    'allowed_from_domain' => 'sheikhfaiz.info',

    // Second safety net under the Apps Script cap.
    'daily_max' => 60,
];
