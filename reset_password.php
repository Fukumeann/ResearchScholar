<?php
require 'connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['token'];
    $newPassword = $_POST['password'];

    // Validate token
    $stmt = $conn->prepare("SELECT email, expires_at FROM password_resets WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($email, $expires_at);
        $stmt->fetch();

        if (strtotime($expires_at) < time()) {
            echo "Token expired. Request a new reset.";
            exit;
        }

        // Update password
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt2 = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
        $stmt2->bind_param("ss", $newHash, $email);
        $stmt2->execute();

        // Delete used token
        $stmt3 = $conn->prepare("DELETE FROM password_resets WHERE token = ?");
        $stmt3->bind_param("s", $token);
        $stmt3->execute();

        echo "Password reset successful. <a href='login.php'>Login here</a>";
    } else {
        echo "Invalid or expired token.";
    }
}
?>

<form method="post">
    <input type="hidden" name="token" value="<?php echo $_GET['token'] ?? ''; ?>">
    New Password: <input type="password" name="password" required><br>
    <button type="submit">Update Password</button>
</form>