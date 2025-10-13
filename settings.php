<?php
session_start();
require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch current info
$stmt = $conn->prepare("SELECT name, email, bio, profile_pic FROM users WHERE user_id=?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->bind_result($name, $email, $bio, $profile_pic);
$stmt->fetch();
$stmt->close();

// Handle update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $newName = trim($_POST['name']);
    $newBio = trim($_POST['bio']);
    $newPassword = $_POST['new_password'];

    // Handle profile pic upload if any
    $newPicPath = $profile_pic; // default current
    if (!empty($_FILES['profile_pic']['name'])) {
        $ext = strtolower(pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif'])) {
            $upload_dir = "uploads/profile_pics/";
            if (!is_dir($upload_dir))
                mkdir($upload_dir, 0777, true);
            $newFileName = uniqid("profile_", true) . "." . $ext;
            $newPicPath = $upload_dir . $newFileName;
            move_uploaded_file($_FILES['profile_pic']['tmp_name'], $newPicPath);
        } else {
            echo "<p>Invalid image format (allowed: jpg, png, gif).</p>";
        }
    }

    // update basic info
    $stmt = $conn->prepare("UPDATE users SET name=?, bio=?, profile_pic=? WHERE user_id=?");
    $stmt->bind_param("sssi", $newName, $newBio, $newPicPath, $user_id);
    $stmt->execute();
    $stmt->close();

    // update password if provided
    if (!empty($newPassword)) {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password_hash=? WHERE user_id=?");
        $stmt->bind_param("si", $hash, $user_id);
        $stmt->execute();
        $stmt->close();
    }

    $_SESSION['name'] = $newName; // update session display name

    echo "<script>alert('Settings updated!'); window.location.href='settings.php';</script>";
    exit;
}
?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Account Settings</title>
</head>

<body>
    <h2>Account Settings</h2>

    <form method="POST" enctype="multipart/form-data">
        <label>Name:</label><br>
        <input type="text" name="name" value="<?= htmlspecialchars($name) ?>" required><br><br>

        <label>Email:</label><br>
        <input type="email" value="<?= htmlspecialchars($email) ?>" disabled><br><br>

        <label>Bio:</label><br>
        <textarea name="bio" rows="4"><?= htmlspecialchars($bio) ?></textarea><br><br>

        <label>Profile Picture:</label><br>
        <?php if ($profile_pic): ?>
            <img src="<?= htmlspecialchars($profile_pic) ?>" alt="Profile Picture" width="80"><br>
        <?php endif; ?>
        <input type="file" name="profile_pic" accept="image/*"><br><br>

        <label>New Password (leave blank to keep current):</label><br>
        <input type="password" name="new_password"><br><br>

        <button type="submit">Save Changes</button>
    </form>
</body>

</html>