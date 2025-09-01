<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class WarehouseClient
{
    protected Client $http;
    protected string $clientKey;

    public function __construct()
    {
        $base = rtrim((string) config('services.warehouse.base'), '/').'/';
        $this->http = new Client([
            'base_uri' => $base, // contoh: http://127.0.0.1:9000/api/
            'timeout'  => 15,
        ]);
        $this->clientKey = (string) config('services.warehouse.client_key', '');
    }

    protected function headers(): array
    {
        return [
            'Accept'        => 'application/json',
            'X-CLIENT-KEY'  => $this->clientKey,
        ];
    }

    /** GET /catalog/products (Warehouse) */
    public function listProducts(array $query = []): array
    {
        $opts = ['headers' => $this->headers()];
        if (!empty($query)) $opts['query'] = $query;

        $res = $this->http->get('catalog/products', $opts);
        return json_decode($res->getBody()->getContents(), true);
    }
 protected function get(string $path, array $query = []): array
    {
        $res = $this->http->get(ltrim($path, '/'), ['headers' => $this->headers(), 'query' => $query]);
        return json_decode((string) $res->getBody(), true) ?: [];
    }
    /** GET /catalog/products/{idOrCode} (Warehouse) */
    public function getProduct(string $idOrCode): array
    {
        $res = $this->http->get("catalog/products/{$idOrCode}", [
            'headers' => $this->headers(),
        ]);
        return json_decode($res->getBody()->getContents(), true);
    }
      /** MENUS by product */
    public function menusByProduct(string $code): array
    {
        return $this->get("catalog/products/{$code}/menus");
    }

    /** Optional: menus tree */
    public function menusTree(?string $productCode = null): array
    {
        $q = [];
        if ($productCode) $q['product_code'] = $productCode;
        return $this->get("catalog/menus/tree", $q);
    }
}
