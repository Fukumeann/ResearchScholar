<?php
session_start();
include 'connect.php'; // <-- adjust if you use a different connection file

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    die("You must be logged in to upload papers.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $authors = mysqli_real_escape_string($conn, $_POST['authors']);
    $year = intval($_POST['year']);
    $abstract = mysqli_real_escape_string($conn, $_POST['abstract']);
    $uploader_id = $_SESSION['user_id'];

    // Handle file upload
    if (isset($_FILES['file']) && $_FILES['file']['error'] === 0) {
        $file_name = $_FILES['file']['name'];
        $file_tmp = $_FILES['file']['tmp_name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        if ($file_ext !== 'pdf') {
            die("Only PDF files are allowed.");
        }

        // Create uploads directory if it doesn't exist
        $upload_dir = "uploads/";
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        // Unique filename to avoid overwriting
        $new_filename = uniqid("paper_", true) . ".pdf";
        $file_path = $upload_dir . $new_filename;

        if (move_uploaded_file($file_tmp, $file_path)) {
            // Insert into database
            $sql = "INSERT INTO papers (title, abstract, authors, year, file_url, uploader_id, status, uploaded_at) 
                    VALUES ('$title', '$abstract', '$authors', '$year', '$file_path', '$uploader_id', 'pending', NOW())";

            if (mysqli_query($conn, $sql)) {
                echo "<script>alert('Paper uploaded successfully! Waiting for admin approval.'); window.location.href='user_page.php';</script>";
            } else {
                echo "Database error: " . mysqli_error($conn);
            }
        } else {
            echo "File upload failed.";
        }
    } else {
        echo "No file uploaded.";
    }
}
?>