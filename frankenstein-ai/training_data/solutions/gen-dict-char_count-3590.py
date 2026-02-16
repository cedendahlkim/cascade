# Task: gen-dict-char_count-3590 | Score: 100% | 2026-02-15T08:14:40.944794

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))