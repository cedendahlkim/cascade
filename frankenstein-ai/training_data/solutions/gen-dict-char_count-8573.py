# Task: gen-dict-char_count-8573 | Score: 100% | 2026-02-13T18:33:47.003509

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))