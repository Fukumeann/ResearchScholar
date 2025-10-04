<?php
session_start();
require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title']);
    $context = trim($_POST['context']);
    $user_id = $_SESSION['user_id'];

    $stmt = $conn->prepare("INSERT INTO questions (user_id, title, context) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $title, $context);
    $stmt->execute();

    header("Location: questions.php?added=1");
    exit;
}
