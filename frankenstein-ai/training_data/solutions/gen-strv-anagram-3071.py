# Task: gen-strv-anagram-3071 | Score: 100% | 2026-02-13T19:14:57.047265

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')