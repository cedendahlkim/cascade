# Task: gen-strv-anagram-4437 | Score: 100% | 2026-02-13T09:19:32.816761

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')