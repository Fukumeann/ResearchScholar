<?php
require 'auth.php';
requireAdmin(); // only admins
require 'connect.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>ResearchScholar - Admin Panel</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

</head>

<body>

    <header>
        <div class="logo">ResearchScholar Admin</div>
        <div class="nav-links">
            <a href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </header>

    <div class="container">
        <!-- Sidebar -->
        <nav class="sidebar">
            <p><strong><?php echo $_SESSION['name'] ?? 'Admin'; ?></strong></p>
            <ul>
                <li><a href="#pending-papers"><i class="fas fa-file-alt"></i> Pending Papers</a></li>
                <li><a href="#pending-questions"><i class="fa-solid fa-question"></i> Pending Questions</a></li>
                <li><a href="#reports"><i class="fas fa-flag"></i> Reports</a></li>
                <li><a href="settings.php"><i class="fas fa-cog"></i> Settings</a></li>
            </ul>
        </nav>

        <!-- Main content -->
        <main>
            <h2>Admin Dashboard</h2>

            <!-- Pending Papers -->
            <div class="panel-section" id="pending-papers">
                <h3>Pending Papers</h3>
                <?php
                $papers = $conn->query("SELECT paper_id,title,authors,year,uploaded_at FROM papers WHERE status='pending' ORDER BY uploaded_at DESC");
                if ($papers && $papers->num_rows > 0):
                    while ($p = $papers->fetch_assoc()): ?>
                        <div>
                            <strong><?php echo htmlspecialchars($p['title']); ?></strong> (<?php echo $p['year']; ?>)<br>
                            Authors: <?php echo htmlspecialchars($p['authors']); ?><br>
                            Uploaded: <?php echo date("M d, Y", strtotime($p['uploaded_at'])); ?><br>
                            <a href="review_paper.php?id=<?php echo $p['paper_id']; ?>">Review</a>
                        </div>
                        <hr>
                    <?php endwhile;
                else:
                    echo "<p>No pending papers.</p>";
                endif;
                ?>
            </div>

            <!-- Pending Questions -->
            <div class="panel-section" id="pending-questions">
                <h3>Pending Questions</h3>
                <?php
                $questions = $conn->query("SELECT question_id,title,created_at FROM questions ORDER BY created_at DESC");
                if ($questions && $questions->num_rows > 0):
                    while ($q = $questions->fetch_assoc()): ?>
                        <div>
                            <strong><?php echo htmlspecialchars($q['title']); ?></strong><br>
                            Created: <?php echo date("M d, Y", strtotime($q['created_at'])); ?><br>
                            <a href="review_question.php?id=<?php echo $q['question_id']; ?>">Review</a>
                        </div>
                        <hr>
                    <?php endwhile;
                else:
                    echo "<p>No pending questions.</p>";
                endif;
                ?>
            </div>

            <!-- Reports -->
            <div class="panel-section" id="reports">
                <h3>Reports</h3>
                <?php
                $reports = $conn->query("SELECT report_id,target_type,target_id,reason,status,created_at FROM reports WHERE status='pending' ORDER BY created_at DESC");
                if ($reports && $reports->num_rows > 0):
                    while ($r = $reports->fetch_assoc()): ?>
                        <div>
                            <strong>Type:</strong> <?php echo $r['target_type']; ?> |
                            <strong>Status:</strong> <?php echo $r['status']; ?><br>
                            <strong>Reason:</strong> <?php echo htmlspecialchars($r['reason']); ?><br>
                            <a href="review_report.php?id=<?php echo $r['report_id']; ?>">Review</a>
                        </div>
                        <hr>
                    <?php endwhile;
                else:
                    echo "<p>No pending reports.</p>";
                endif;
                ?>
            </div>

        </main>
    </div>

</body>

</html>