# Task: gen-dict-char_count-8586 | Score: 100% | 2026-02-10T15:42:52.483689

def count_characters(s):
    counts = {}
    for char in s:
        if char != ' ':
            counts[char] = counts.get(char, 0) + 1
    
    sorted_chars = sorted(counts.keys())
    
    for char in sorted_chars:
        print(f"{char} {counts[char]}")

s = input()
count_characters(s)