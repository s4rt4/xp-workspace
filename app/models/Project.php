<?php
class Project extends Model
{
    protected string $table = 'projects';
    protected array $fillable = ['name', 'description', 'color', 'icon', 'status', 'sort_order'];
}
