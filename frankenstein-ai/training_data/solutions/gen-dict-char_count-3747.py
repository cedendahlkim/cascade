# Task: gen-dict-char_count-3747 | Score: 100% | 2026-02-13T13:10:50.246512

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))