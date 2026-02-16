# Task: gen-dict-char_count-9948 | Score: 100% | 2026-02-14T13:26:01.426466

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))