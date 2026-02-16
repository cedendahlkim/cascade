# Task: gen-strv-anagram-9803 | Score: 100% | 2026-02-13T20:50:29.667305

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')