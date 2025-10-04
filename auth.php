<?php
session_start();

// Force logged-out users to guest page
function requireLogin()
{
    if (!isset($_SESSION['user_id'])) {
        header("Location: guest_page.php");
        exit;
    }
}

// Force admin access only
function requireAdmin()
{
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
        header("Location: guest_page.php");
        exit;
    }
}

// Check if user is logged in
function isLoggedIn()
{
    return isset($_SESSION['user_id']);
}

// Check if current user is admin
function isAdmin()
{
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}
?>