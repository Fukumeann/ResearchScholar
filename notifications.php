<?php
session_start();
require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch notifications for this user
$stmt = $conn->prepare("SELECT notif_id, message, link, is_read, created_at 
                        FROM notifications 
                        WHERE user_id=? 
                        ORDER BY created_at DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Mark all as read
$conn->query("UPDATE notifications SET is_read=1 WHERE user_id=$user_id");
?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Notifications</title>
</head>

<body>
    <h2>Your Notifications</h2>

    <ul>
        <?php while ($row = $result->fetch_assoc()): ?>
            <li>
                <?php if (!empty($row['link'])): ?>
                    <a href="<?= htmlspecialchars($row['link']) ?>">
                        <?= htmlspecialchars($row['message']) ?>
                    </a>
                <?php else: ?>
                    <?= htmlspecialchars($row['message']) ?>
                <?php endif; ?>
                <small> (<?= $row['created_at'] ?>)</small>
            </li>
        <?php endwhile; ?>
    </ul>
</body>

</html>