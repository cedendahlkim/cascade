# Task: gen-dict-char_count-4715 | Score: 100% | 2026-02-13T19:05:30.040044

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))