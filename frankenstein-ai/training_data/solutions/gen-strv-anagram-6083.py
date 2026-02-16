# Task: gen-strv-anagram-6083 | Score: 100% | 2026-02-14T12:20:43.796558

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')