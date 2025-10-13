<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

require 'connect.php';

$stmt = $conn->prepare("SELECT title, year, uploaded_at FROM papers WHERE uploader_id = ? ORDER BY uploaded_at DESC");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
?>

<h2>Your Published Papers</h2>
<?php if ($result->num_rows > 0): ?>
    <ul>
        <?php while ($row = $result->fetch_assoc()): ?>
            <li>
                <strong><?= htmlspecialchars($row['title']) ?></strong> (<?= $row['year'] ?>)<br>
                <small>Uploaded: <?= $row['uploaded_at'] ?></small>
            </li>
        <?php endwhile; ?>
    </ul>
<?php else: ?>
    <p>You haven’t published any papers yet.</p>
<?php endif; ?>