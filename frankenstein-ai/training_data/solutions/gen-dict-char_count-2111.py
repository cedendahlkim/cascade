# Task: gen-dict-char_count-2111 | Score: 100% | 2026-02-12T20:55:01.103070

s = input()
counts = {}
for char in s:
    if char != ' ':
        if char in counts:
            counts[char] += 1
        else:
            counts[char] = 1

sorted_chars = sorted(counts.keys())

for char in sorted_chars:
    print(char, counts[char])