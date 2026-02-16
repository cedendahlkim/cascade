# Task: gen-dict-char_count-1701 | Score: 100% | 2026-02-13T10:01:49.450075

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))