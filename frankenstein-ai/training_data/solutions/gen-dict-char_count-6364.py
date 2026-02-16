# Task: gen-dict-char_count-6364 | Score: 100% | 2026-02-13T12:12:55.839349

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))