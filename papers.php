<?php
include "connect.php";

$result = $conn->query("SELECT * FROM papers WHERE status='approved' ORDER BY uploaded_at DESC");

if ($result->num_rows > 0):
    while ($row = $result->fetch_assoc()): ?>
        <div class="paper-card">
            <h3><?php echo htmlspecialchars($row['title']); ?></h3>
            <p><strong>Authors:</strong> <?php echo htmlspecialchars($row['authors']); ?></p>
            <p><strong>Year:</strong> <?php echo htmlspecialchars($row['year']); ?></p>
            <p><?php echo htmlspecialchars(substr($row['abstract'], 0, 150)); ?>...</p>

            <?php if (isset($_SESSION['user_id'])): ?>
                <a href="<?php echo $row['file_url']; ?>" target="_blank">Open Paper</a>
            <?php else: ?>
                <a href="login.php">Login to read</a>
            <?php endif; ?>
        </div>
        <?php
    endwhile;
else: ?>
    <p>No research papers available yet.</p>
<?php endif; ?>