<?php
require 'connect.php';

// Reuse the flag you already have in guest_page.php
// $isLoggedIn = isset($_SESSION['user_id']);

$query = "SELECT paper_id, title, abstract, authors, year, file_url, uploaded_at 
          FROM papers 
          WHERE status = 'approved' 
          ORDER BY uploaded_at DESC 
          LIMIT 12";
$result = $conn->query($query);
?>

<div class="papers-container" style="padding:20px;">
    <h2>Latest Research Papers</h2>

    <?php if ($result && $result->num_rows > 0): ?>
        <div class="papers-list"
            style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; margin-top:15px;">
            <?php while ($row = $result->fetch_assoc()): ?>
                <div class="paper-card"
                    style="border:1px solid #ccc; padding:15px; border-radius:10px; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 10px;"><?php echo htmlspecialchars($row['title']); ?></h3>
                    <p style="margin:0; font-size:14px;"><strong>Authors:</strong>
                        <?php echo htmlspecialchars($row['authors']); ?></p>
                    <p style="margin:0; font-size:14px;"><strong>Year:</strong> <?php echo htmlspecialchars($row['year']); ?>
                    </p>

                    <p style="margin:10px 0; font-size:13px; color:#555;">
                        <?php echo substr(htmlspecialchars($row['abstract']), 0, 180) . '...'; ?>
                    </p>

                    <?php if ($isLoggedIn): ?>
                        <a href="<?php echo htmlspecialchars($row['file_url']); ?>" target="_blank"
                            style="display:inline-block; margin-top:8px; color:#0066cc; text-decoration:none; font-size:14px;">
                            📄 View Full Paper
                        </a>
                    <?php else: ?>
                        <a href="login.php"
                            style="display:inline-block; margin-top:8px; color:#cc0000; text-decoration:none; font-size:14px;">
                            🔒 Login to View Paper
                        </a>
                    <?php endif; ?>

                    <div style="font-size:12px; color:#999; margin-top:10px;">
                        Uploaded: <?php echo date("M d, Y", strtotime($row['uploaded_at'])); ?>
                    </div>
                </div>
            <?php endwhile; ?>
        </div>
    <?php else: ?>
        <p>No research papers available yet. Be the first to upload!</p>
    <?php endif; ?>
</div>