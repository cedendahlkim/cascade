# Task: gen-strv-anagram-1452 | Score: 100% | 2026-02-13T12:35:36.009466

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')