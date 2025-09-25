<?php
require 'connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Check if email already exists
    $check = $conn->prepare("SELECT email FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "Error: Email already registered. Please login instead. <a href='login.php'>Login here</a>";
        exit;
    }

    // If not exists insert new user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $passwordHash);

    if ($stmt->execute()) {
        echo "Signup successful! <a href='login.php'>Login here</a>";
    } else {
        echo "Error: " . $stmt->error;
    }
}
?>


<form method="POST">
    Email: <input type="email" name="email" placeholder="juandelacruz@gmail.com" required> <br>
    Password: <input type="password" name="password" required> <br>
    <button type="submit">Sign Up</button>
</form>

<p>Already have an account? <a href="login.php">Login here</a></p>