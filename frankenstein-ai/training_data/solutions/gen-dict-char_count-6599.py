# Task: gen-dict-char_count-6599 | Score: 100% | 2026-02-13T09:34:32.982918

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))