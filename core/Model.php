<?php
/**
 * Base Model
 * Simple Active Record-style model
 */
class Model
{
    protected string $table = '';
    protected string $primaryKey = 'id';
    protected array $fillable = [];
    
    /**
     * Get all records
     */
    public function all(string $orderBy = 'created_at DESC', ?int $limit = null): array
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY {$orderBy}";
        if ($limit) $sql .= " LIMIT {$limit}";
        return Database::fetchAll($sql);
    }
    
    /**
     * Find by primary key
     */
    public function find($id): ?array
    {
        return Database::fetch(
            "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?",
            [$id]
        );
    }
    
    /**
     * Find with conditions
     */
    public function where(string $column, $value, string $operator = '='): array
    {
        return Database::fetchAll(
            "SELECT * FROM {$this->table} WHERE {$column} {$operator} ?",
            [$value]
        );
    }
    
    /**
     * Find first matching record
     */
    public function firstWhere(string $column, $value, string $operator = '='): ?array
    {
        return Database::fetch(
            "SELECT * FROM {$this->table} WHERE {$column} {$operator} ? LIMIT 1",
            [$value]
        );
    }
    
    /**
     * Create a new record
     */
    public function create(array $data): string
    {
        // Filter to fillable fields
        $filtered = $this->filterFillable($data);
        $filtered['created_at'] = date('Y-m-d H:i:s');
        $filtered['updated_at'] = date('Y-m-d H:i:s');
        
        return Database::insert($this->table, $filtered);
    }
    
    /**
     * Update a record
     */
    public function update($id, array $data): int
    {
        $filtered = $this->filterFillable($data);
        $filtered['updated_at'] = date('Y-m-d H:i:s');
        
        return Database::update($this->table, $filtered, "{$this->primaryKey} = ?", [$id]);
    }
    
    /**
     * Delete a record
     */
    public function delete($id): int
    {
        return Database::delete($this->table, "{$this->primaryKey} = ?", [$id]);
    }
    
    /**
     * Count records
     */
    public function count(?string $where = null, array $params = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table}";
        if ($where) $sql .= " WHERE {$where}";
        $result = Database::fetch($sql, $params);
        return (int)($result['total'] ?? 0);
    }
    
    /**
     * Search with LIKE
     */
    public function search(string $column, string $query): array
    {
        return Database::fetchAll(
            "SELECT * FROM {$this->table} WHERE {$column} LIKE ? ORDER BY updated_at DESC",
            ["%{$query}%"]
        );
    }
    
    /**
     * Raw query on this table
     */
    public function raw(string $sql, array $params = []): array
    {
        return Database::fetchAll($sql, $params);
    }
    
    /**
     * Filter data to only fillable fields
     */
    private function filterFillable(array $data): array
    {
        if (empty($this->fillable)) return $data;
        return array_intersect_key($data, array_flip($this->fillable));
    }
}
