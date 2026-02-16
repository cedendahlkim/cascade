# Task: gen-dict-char_count-8783 | Score: 100% | 2026-02-13T11:42:59.336846

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))