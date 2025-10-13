<?php
require 'auth.php';
requireLogin();  // logged-out users are redirected to guest_page.php
require 'connect.php';


$user_id = $_SESSION['user_id'];

// Fetch favorite (saved) papers for this user
$query = "
    SELECT p.paper_id, p.title, p.authors, p.year, p.abstract 
    FROM favorites f
    JOIN papers p ON f.paper_id = p.paper_id
    WHERE f.user_id = ?
    ORDER BY f.added_at DESC
";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>My Library</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }

        h2 {
            margin-bottom: 20px;
        }

        .paper {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
        }

        .paper h3 {
            margin: 0 0 10px;
        }

        .paper small {
            display: block;
            margin-top: 5px;
            color: gray;
        }
    </style>
</head>

<body>
    <h2><i class="fas fa-book"></i> My Library (Favorites)</h2>

    <?php if ($result->num_rows > 0): ?>
        <?php while ($row = $result->fetch_assoc()): ?>
            <div class="paper">
                <h3><?php echo htmlspecialchars($row['title']); ?></h3>
                <p><strong>Authors:</strong> <?php echo htmlspecialchars($row['authors']); ?></p>
                <p><strong>Year:</strong> <?php echo htmlspecialchars($row['year']); ?></p>
                <p><em><?php echo htmlspecialchars($row['abstract']); ?></em></p>
                <small>Paper ID: <?php echo $row['paper_id']; ?></small>
            </div>
        <?php endwhile; ?>
    <?php else: ?>
        <p>No papers saved yet. Add some to your favorites!</p>
    <?php endif; ?>
</body>

</html>