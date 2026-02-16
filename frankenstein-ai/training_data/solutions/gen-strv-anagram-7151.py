# Task: gen-strv-anagram-7151 | Score: 100% | 2026-02-13T17:36:33.804916

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')