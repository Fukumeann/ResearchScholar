<?php
session_start();
require 'connect.php'; // your DB connection file

// Fetch questions with user info and count comments
$sql = "SELECT q.question_id, q.title, q.context, q.created_at, u.name,
        (SELECT COUNT(*) FROM comments c WHERE c.question_id = q.question_id) AS comment_count
        FROM questions q
        JOIN users u ON q.user_id = u.user_id
        ORDER BY q.created_at DESC";
$result = $conn->query($sql);
?>
<!DOCTYPE html>
<html>

<head>
    <title>Questions</title>
    <link rel="stylesheet" href="styles.css"> <!-- your CSS file -->
</head>

<body>

    <h2>Questions</h2>

    <?php if (isset($_SESSION['user_id'])): ?>
        <div class="ask-container">
            <form action="add_question.php" method="POST">
                <input type="text" name="title" placeholder="Ask a question title..." required class="input-title"><br>
                <textarea name="context" placeholder="Describe your question..." required
                    class="input-context"></textarea><br>
                <button type="submit" class="btn-submit">Post Question</button>
            </form>
        </div>
    <?php else: ?>
        <p><a href="login.php">Log in</a> to post a question.</p>
    <?php endif; ?>

    <div class="questions-container">
        <?php while ($row = $result->fetch_assoc()): ?>
            <div class="question-card"> <!-- like your paper-card -->
                <h3>
                    <a href="view_question.php?id=<?= $row['question_id'] ?>">
                        <?= htmlspecialchars($row['title']) ?>
                    </a>
                </h3>
                <p><?= nl2br(htmlspecialchars(substr($row['context'], 0, 250))) ?>...</p>
                <div class="meta">
                    <span>Posted by <?= htmlspecialchars($row['name']) ?> on <?= $row['created_at'] ?></span> |
                    <span><?= $row['comment_count'] ?> comments</span>
                </div>
            </div>
        <?php endwhile; ?>
    </div>

</body>

</html>