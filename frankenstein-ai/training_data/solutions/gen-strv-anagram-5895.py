# Task: gen-strv-anagram-5895 | Score: 100% | 2026-02-13T19:47:51.639507

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')