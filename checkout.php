<?php
<?php
header('Content-Type: application/json');
// allow local testing (adjust or remove in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

// basic validation
$items = is_array($input['items'] ?? null) ? $input['items'] : [];
$total = floatval($input['total'] ?? 0);
$paymentMethod = trim($input['paymentMethod'] ?? '');
$deliveryAddress = trim($input['deliveryAddress'] ?? '');

if (empty($items) || $total <= 0 || !$paymentMethod || !$deliveryAddress) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid required fields']);
    exit;
}

// DB config - update with your credentials
$dbHost = '127.0.0.1';
$dbName = 'bananacrunch';
$dbUser = 'banana_user';      // <-- update
$dbPass = 'your_password';    // <-- update
$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->beginTransaction();

    // Insert order
    $stmt = $pdo->prepare(
        "INSERT INTO orders (payment_method, delivery_address, total, created_at)
         VALUES (:payment_method, :delivery_address, :total, :created_at)"
    );
    $stmt->execute([
        ':payment_method' => $paymentMethod,
        ':delivery_address' => $deliveryAddress,
        ':total' => $total,
        ':created_at' => date('Y-m-d H:i:s'),
    ]);
    $orderId = $pdo->lastInsertId();

    // Insert order items
    $stmtItem = $pdo->prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (:order_id, :product_id, :product_name, :price, :quantity)"
    );

    foreach ($items as $it) {
        $stmtItem->execute([
            ':order_id' => $orderId,
            ':product_id' => $it['id'] ?? null,
            ':product_name' => $it['name'] ?? '',
            ':price' => floatval($it['price'] ?? 0),
            ':quantity' => intval($it['quantity'] ?? 1),
        ]);
    }

    $pdo->commit();

    echo json_encode(['ok' => true, 'orderId' => (string)$orderId]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Checkout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}
?>