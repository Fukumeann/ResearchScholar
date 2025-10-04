<?php
session_start();
require 'connect.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    // Fetch user from database
    $stmt = $conn->prepare("SELECT user_id, password_hash, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($user_id, $password_hash, $role);
        $stmt->fetch();

        if (password_verify($password, $password_hash)) {

            // Option B: assign specific email as admin for testing
            if ($email === 'admin123@gmail.com') { // <-- replace with your test admin email
                $role = 'admin';
            }

            // Set session variables
            $_SESSION['user_id'] = $user_id;
            $_SESSION['role'] = $role;

            // Redirect based on role
            if ($role === 'admin') {
                header("Location: admin_panel.php");
            } else {
                header("Location: user_page.php");
            }
            exit;

        } else {
            $error = "Invalid password!";
        }
    } else {
        $error = "No account found with that email!";
    }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Login - ResearchScholar</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

</head>

<body>
    <h2>Login to ResearchScholar</h2>

    <?php if (!empty($error))
        echo "<div class='error'>$error</div>"; ?>

    <form method="POST">
        <label>Email:</label>
        <input type="email" name="email" placeholder="yourname@gmail.com" required>

        <label>Password:</label>
        <input type="password" name="password" required>

        <button type="submit">Login</button>
    </form>

    <p><a href="forgot_password.php">Forgot your password?</a></p>
    <p>Don't have an account? <a href="register.php">Sign up here</a></p>
</body>

</html>