# Task: gen-dict-char_count-9716 | Score: 100% | 2026-02-15T10:28:55.735523

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))