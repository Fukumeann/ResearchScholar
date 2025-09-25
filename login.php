<?php

session_start();
require 'connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT user_id, password_hash, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($user_id, $password_hash, $role);
        $stmt->fetch();

        if (password_verify($password, $password_hash)) {

            $_SESSION['user_id'] = $user_id;
            $_SESSION['role'] = $role;

            if ($role === 'admin') {
                header("Location: admin_dashboard.php");
            } else {
                header("Location: user_page.php");
            }
            exit;
        } else {
            echo "Invalid Password!";
        }
    } else {
        echo "No account found!";
    }
}
?>

<form method="POST">
    Email: <input type="email" name="email" placeholder="juandelacruz@gmail.com" required> <br>
    Password: <input type="password" name="password" required> <br>
    <button type="submit">Login</button>
</form>

<p><a href="forgot_password.php">Forgot your password?</a></p>