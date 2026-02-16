# Task: gen-dict-char_count-7994 | Score: 100% | 2026-02-15T08:14:45.104052

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))