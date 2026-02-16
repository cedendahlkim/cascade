# Task: gen-strv-anagram-8129 | Score: 100% | 2026-02-13T09:20:47.400093

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')