# Task: gen-dict-char_count-3262 | Score: 100% | 2026-02-13T16:06:57.893872

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))