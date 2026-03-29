<?php
class Note extends Model
{
    protected string $table = 'notes';
    protected array $fillable = ['content', 'color', 'pos_x', 'pos_y', 'width', 'height', 'is_pinned'];
}
